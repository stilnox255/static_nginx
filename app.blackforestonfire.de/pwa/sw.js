const CACHE_NAME = 'bfof-v1';
const API_CACHE_NAME = 'bfof-api-v1';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.filter(n => n !== CACHE_NAME && n !== API_CACHE_NAME).map(n => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    // Skip Quarkus management endpoints
    if (url.pathname.startsWith('/q/')) return;

    // API requests: network-first, fall back to cache for offline support
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            caches.open(API_CACHE_NAME).then(cache =>
                fetch(event.request)
                    .then(response => {
                        if (response.ok) cache.put(event.request, response.clone());
                        return response;
                    })
                    .catch(() => cache.match(event.request))
            )
        );
        return;
    }

    // Static assets + cross-origin images: cache-first, update in background
    event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(event.request).then(cached => {
                const networkFetch = fetch(event.request).then(response => {
                    // Cache ok responses and opaque responses (cross-origin images without CORS)
                    if (response.ok || response.type === 'opaque') cache.put(event.request, response.clone());
                    return response;
                });
                if (cached) {
                    // Background update — suppress network errors silently
                    networkFetch.catch(() => {});
                    return cached;
                }
                return networkFetch;
            })
        )
    );
});

// --- Push handler ---

const DB_NAME = "bfof-db";
const DB_VERSION = 1;

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("bfof-notifications")) {
                db.createObjectStore("bfof-notifications", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("bfof-prefs")) {
                db.createObjectStore("bfof-prefs");
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getLocale() {
    try {
        const db = await openDb();
        return new Promise((resolve) => {
            const tx = db.transaction("bfof-prefs", "readonly");
            const req = tx.objectStore("bfof-prefs").get("locale");
            req.onsuccess = () => { db.close(); resolve(req.result || "de"); };
            req.onerror = () => { db.close(); resolve("de"); };
        });
    } catch {
        return "de";
    }
}

async function storeNotification(id, data) {
    const db = await openDb();
    const tx = db.transaction("bfof-notifications", "readwrite");
    tx.objectStore("bfof-notifications").put({
        id,
        receivedAt: new Date().toISOString(),
        read: false,
        tag: data.tag || null,
        url: data.url || null,
        de: data.de || { title: "", body: "" },
        fr: data.fr || { title: "", body: "" },
        en: data.en || { title: "", body: "" }
    });
    return new Promise((resolve) => {
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); resolve(); };
    });
}

async function markNotificationRead(id) {
    const db = await openDb();
    const tx = db.transaction("bfof-notifications", "readwrite");
    const store = tx.objectStore("bfof-notifications");
    return new Promise((resolve) => {
        const req = store.get(id);
        req.onsuccess = () => {
            if (req.result) store.put({ ...req.result, read: true });
            tx.oncomplete = () => { db.close(); resolve(); };
        };
        req.onerror = () => { db.close(); resolve(); };
    });
}

self.addEventListener("push", (event) => {
    if (!event.data) return;

    event.waitUntil((async () => {
        const data = event.data.json();
        const locale = await getLocale();
        const localized = data[locale] || data.de || { title: "Black Forest on Fire", body: "" };
        const id = crypto.randomUUID();

        await storeNotification(id, data);

        const notificationOptions = {
            body: localized.body,
            icon: "/icon.svg",
            badge: "/icon.svg",
            data: { id, url: data.url || "/" }
        };
        if (data.tag) {
            notificationOptions.tag = data.tag;
            notificationOptions.renotify = data.renotify ?? false;
        }
        await self.registration.showNotification(localized.title, notificationOptions);

        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
            client.postMessage({ type: "PUSH_RECEIVED" });
        }
    })());
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const { id, url } = event.notification.data;
    const target = new URL(url, self.location.origin).href;

    event.waitUntil((async () => {
        await markNotificationRead(id);

        const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of windowClients) {
            if (new URL(client.url).origin === self.location.origin) {
                await client.navigate(target);
                return client.focus();
            }
        }
        return self.clients.openWindow(target);
    })());
});
