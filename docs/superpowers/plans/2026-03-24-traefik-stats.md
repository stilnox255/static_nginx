# Traefik-basierte Web-Statistiken Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ersetze die container-spezifischen GoAccess-Instanzen in `static_nginx` durch zwei gruppen-basierte GoAccess-Container im `proxy`-Projekt, die Traefiks JSON Access Log als einzige Log-Quelle nutzen.

**Architecture:** Traefik schreibt alle Requests als JSON in ein Docker-Volume. Zwei GoAccess-Container filtern per `tail | grep` auf ihre jeweilige Domain-Gruppe und erzeugen Real-Time-HTML-Reports, die über separate nginx-Container ausgeliefert werden. Traefik routet `stats.ingoschindler.de` und `stats.sashriti.com` zu diesen Report-Containern.

**Tech Stack:** Docker Compose, Traefik v3.6, GoAccess (allinurl/goaccess:latest), nginx:1-alpine, GeoLite2-City.mmdb (MaxMind CDN)

---

## Dateiübersicht

**Erstellen:**
- `proxy/geoip/.gitkeep` — Verzeichnis für GeoIP-Datei tracken
- `proxy/goaccess-home.conf` — GoAccess-Konfiguration für Home-Gruppe
- `proxy/goaccess-sashriti.conf` — GoAccess-Konfiguration für Sashriti-Gruppe
- `proxy/update-geoip.sh` — GeoIP-Update-Script (von static_nginx übernommen)

**Modifizieren:**
- `proxy/.gitignore` — `geoip/` ausschließen
- `proxy/traefik.yml` — Access Log aktivieren
- `proxy/docker-compose.yml` — Volume + 4 neue Container
- `proxy/dynamic/ingoschindler.yml` — Service-URLs aktualisieren
- `proxy/dynamic/sashriti.yml` — Service-URLs aktualisieren

**Löschen (static_nginx):**
- `static_nginx/goaccess-ingoschindler.conf`
- `static_nginx/goaccess-hausschindler.conf`
- `static_nginx/goaccess-sashriti.conf`
- `static_nginx/update-geoip.sh`
- Aus `static_nginx/docker-compose.yml`: 6 Container + 3 Volumes entfernen

---

## Task 1: GeoIP-Verzeichnis in proxy/ einrichten

**Kontext:** GoAccess startet nicht, wenn das GeoIP-File fehlt aber als Volume gemountet ist. Das Verzeichnis muss existieren und die Datei muss vor dem ersten Container-Start vorhanden sein.

**Files:**
- Create: `proxy/geoip/.gitkeep`
- Modify: `proxy/.gitignore`
- Create: `proxy/update-geoip.sh`

- [ ] **Step 1: .gitkeep anlegen**

```bash
cd /home/ingo/dev/proxy
mkdir geoip
touch geoip/.gitkeep
```

- [ ] **Step 2: geoip/ ins .gitignore eintragen**

Aktuelle `.gitignore` öffnen und `geoip/` hinzufügen. Nur das mmdb-File soll ignoriert werden, nicht das `.gitkeep`:

```
geoip/
!geoip/.gitkeep
```

- [ ] **Step 3: update-geoip.sh erstellen**

Datei `proxy/update-geoip.sh` mit folgendem Inhalt:

```bash
#!/bin/bash
set -e

DIR="geoip"

wget -O "$DIR/GeoLite2-City.mmdb.gz" https://cdn.jsdelivr.net/npm/geolite2-city/GeoLite2-City.mmdb.gz
gunzip -f "$DIR/GeoLite2-City.mmdb.gz"

echo "GeoIP database updated: $DIR/GeoLite2-City.mmdb"

docker compose restart goaccess-home goaccess-sashriti
```

```bash
chmod +x update-geoip.sh
```

- [ ] **Step 4: GeoIP-Datei herunterladen**

```bash
bash update-geoip.sh
```

Achtung: Der letzte Befehl (`docker compose restart ...`) schlägt fehl, weil die Container noch nicht existieren. Das ist erwartet. Die Datei muss vorhanden sein:

```bash
ls -lh geoip/GeoLite2-City.mmdb
```

Erwartete Ausgabe: Datei existiert, Größe ca. 30–60 MB.

- [ ] **Step 5: Commit**

```bash
git add geoip/.gitkeep .gitignore update-geoip.sh
git commit -m "feat: add geoip directory and update script for stats"
```

---

## Task 2: Traefik Access Log aktivieren

**Kontext:** Traefik hat aktuell `accessLog: {}` (leer) in `traefik.yml`. Wir schalten auf JSON-Format mit File-Output um. Das erfordert einen Traefik-Neustart → **~5 Sekunden Downtime** für alle Domains.

**Files:**
- Modify: `proxy/traefik.yml`
- Modify: `proxy/docker-compose.yml`

- [ ] **Step 1: traefik.yml anpassen**

In `proxy/traefik.yml` die Zeile `accessLog: { }` ersetzen durch:

```yaml
accessLog:
  filePath: /var/log/traefik/access.log
  format: json
```

- [ ] **Step 2: Volume in docker-compose.yml hinzufügen**

In `proxy/docker-compose.yml`:

Unter `volumes:` am Ende die neuen Volumes ergänzen:
```yaml
volumes:
  traefik_certs:
    driver: local
  traefik_logs:
  report_home:
  report_sashriti:
```

Beim `traefik`-Service das neue Volume-Mount ergänzen:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
  - ./traefik.yml:/etc/traefik/traefik.yml:ro
  - ./dynamic:/etc/traefik/dynamic:ro
  - traefik_certs:/etc/traefik/acme
  - traefik_logs:/var/log/traefik
```

- [ ] **Step 3: Traefik neu starten**

```bash
docker compose up -d traefik
```

- [ ] **Step 4: Log-Datei prüfen**

Nach dem Neustart sollte innerhalb weniger Sekunden die Log-Datei erscheinen (sobald ein Request reinkommt). Prüfen:

```bash
docker compose exec traefik ls -la /var/log/traefik/
```

Erwartete Ausgabe: `access.log` vorhanden (auch wenn noch leer).

Einen Test-Request erzeugen und prüfen ob Logs geschrieben werden:

```bash
curl -s https://ingoschindler.de > /dev/null
docker compose exec traefik tail -1 /var/log/traefik/access.log | python3 -m json.tool | head -20
```

Erwartete Ausgabe: JSON-Objekt mit `RequestHost`, `DownstreamStatus`, `StartUTC` etc.

- [ ] **Step 5: Commit**

```bash
git add traefik.yml docker-compose.yml
git commit -m "feat: enable Traefik JSON access log to volume"
```

---

## Task 3: GoAccess-Konfigurationsdateien erstellen

**Kontext:** Beide Configs sind bis auf `ws-url` identisch. Das Log-Format ist exakt auf Traefik v3.6's alphabetisch sortierte JSON-Ausgabe abgestimmt (GoAccess parst per Forward-Key-Scan, nicht Key-Lookup).

**Files:**
- Create: `proxy/goaccess-home.conf`
- Create: `proxy/goaccess-sashriti.conf`

- [ ] **Step 1: goaccess-home.conf erstellen**

Datei `proxy/goaccess-home.conf`:

```
time-format %H:%M:%S
date-format %Y-%m-%d
log-format {"ClientAddr":"%^","ClientHost":"%h","ClientPort":"%^","ClientUsername":"%^","DownstreamContentSize":%b,"DownstreamStatus":%s,"Duration":%^,"GzipRatio":%^,"OriginContentSize":%^,"OriginDuration":%^,"OriginStatus":%^,"Overhead":%^,"RequestAddr":"%^","RequestContentSize":%^,"RequestCount":%^,"RequestHost":"%v","RequestMethod":"%m","RequestPath":"%U","RequestPort":"%^","RequestProtocol":"%H","RequestScheme":"%^","RetryAttempts":%^,"StartLocal":"%^","StartUTC":"%dT%t.%^Z"
port 7890
real-time-html true
ws-url wss://stats.ingoschindler.de:443/ws
```

- [ ] **Step 2: goaccess-sashriti.conf erstellen**

Datei `proxy/goaccess-sashriti.conf` — identisch mit goaccess-home.conf, nur `ws-url` abweichend:

```
time-format %H:%M:%S
date-format %Y-%m-%d
log-format {"ClientAddr":"%^","ClientHost":"%h","ClientPort":"%^","ClientUsername":"%^","DownstreamContentSize":%b,"DownstreamStatus":%s,"Duration":%^,"GzipRatio":%^,"OriginContentSize":%^,"OriginDuration":%^,"OriginStatus":%^,"Overhead":%^,"RequestAddr":"%^","RequestContentSize":%^,"RequestCount":%^,"RequestHost":"%v","RequestMethod":"%m","RequestPath":"%U","RequestPort":"%^","RequestProtocol":"%H","RequestScheme":"%^","RetryAttempts":%^,"StartLocal":"%^","StartUTC":"%dT%t.%^Z"
port 7890
real-time-html true
ws-url wss://stats.sashriti.com:443/ws
```

- [ ] **Step 3: Commit**

```bash
git add goaccess-home.conf goaccess-sashriti.conf
git commit -m "feat: add GoAccess configs for home and sashriti groups"
```

---

## Task 4: Neue GoAccess/Report-Container in docker-compose.yml

**Kontext:** Vier neue Container kommen ins `proxy`-Projekt. GoAccess läuft als Pipeline: `tail -F access.log | grep <domain-filter> | goaccess --stdin`. Der `entrypoint`-Override ist nötig, da das GoAccess-Image einen eigenen Entrypoint hat.

**Files:**
- Modify: `proxy/docker-compose.yml`

- [ ] **Step 1: goaccess-home und report-home hinzufügen**

In `proxy/docker-compose.yml` nach dem `traefik`-Service einfügen:

```yaml
  goaccess-home:
    image: allinurl/goaccess:latest
    entrypoint: ["sh", "-c"]
    command: >
      tail -n +1 -F /var/log/traefik/access.log |
      grep --line-buffered -E '"RequestHost":"([a-z0-9.-]*\.)?((hausschindler|ingoschindler)\.de)"' |
      goaccess - --no-global-config --config-file=/etc/goaccess/goaccess.conf
      --output=/srv/report/index.html --real-time-html --port=7890 --addr=0.0.0.0
      --geoip-database=/geoip/GeoLite2-City.mmdb
    volumes:
      - traefik_logs:/var/log/traefik:ro
      - ./goaccess-home.conf:/etc/goaccess/goaccess.conf:ro
      - report_home:/srv/report
      - ./geoip/GeoLite2-City.mmdb:/geoip/GeoLite2-City.mmdb:ro
    expose:
      - 7890
    networks:
      - schindler_net
    restart: unless-stopped

  report-home:
    image: nginx:1-alpine
    volumes:
      - report_home:/usr/share/nginx/html:ro
    expose:
      - 80
    networks:
      - schindler_net
    restart: unless-stopped
```

- [ ] **Step 2: goaccess-sashriti und report-sashriti hinzufügen**

Direkt darunter ergänzen:

```yaml
  goaccess-sashriti:
    image: allinurl/goaccess:latest
    entrypoint: ["sh", "-c"]
    command: >
      tail -n +1 -F /var/log/traefik/access.log |
      grep --line-buffered -E '"RequestHost":"([a-z0-9.-]*\.)?sashriti\.com"' |
      goaccess - --no-global-config --config-file=/etc/goaccess/goaccess.conf
      --output=/srv/report/index.html --real-time-html --port=7890 --addr=0.0.0.0
      --geoip-database=/geoip/GeoLite2-City.mmdb
    volumes:
      - traefik_logs:/var/log/traefik:ro
      - ./goaccess-sashriti.conf:/etc/goaccess/goaccess.conf:ro
      - report_sashriti:/srv/report
      - ./geoip/GeoLite2-City.mmdb:/geoip/GeoLite2-City.mmdb:ro
    expose:
      - 7890
    networks:
      - schindler_net
    restart: unless-stopped

  report-sashriti:
    image: nginx:1-alpine
    volumes:
      - report_sashriti:/usr/share/nginx/html:ro
    expose:
      - 80
    networks:
      - schindler_net
    restart: unless-stopped
```

- [ ] **Step 3: Container starten**

```bash
docker compose up -d goaccess-home report-home goaccess-sashriti report-sashriti
```

- [ ] **Step 4: Container-Status prüfen**

```bash
docker compose ps goaccess-home report-home goaccess-sashriti report-sashriti
```

Erwartete Ausgabe: alle 4 Container im Status `running`.

Falls `goaccess-home` oder `goaccess-sashriti` sofort exitiert:
```bash
docker compose logs goaccess-home
```
Häufigste Ursache: GeoIP-Datei fehlt. Dann `bash update-geoip.sh` (ohne restart-Schritt, da Container noch nicht existieren) und nochmal `docker compose up -d`.

- [ ] **Step 5: GoAccess Log-Parsing prüfen**

Warten bis ein paar Requests in `access.log` geschrieben wurden (ggf. `curl https://ingoschindler.de` ausführen), dann prüfen ob GoAccess die Logs verarbeitet:

```bash
docker compose logs --tail=20 goaccess-home
```

Es sollten keine `Token doesn't match` Fehler erscheinen. Stattdessen Meldungen wie `Processing...` oder `Successful`.

- [ ] **Step 6: Report-HTML prüfen**

```bash
docker compose exec report-home ls -la /usr/share/nginx/html/
```

Erwartete Ausgabe: `index.html` vorhanden und nicht leer.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add GoAccess and report containers for home and sashriti groups"
```

---

## Task 5: Traefik-Routing auf neue Container umstellen

**Kontext:** Die Traefik Dynamic Config in `proxy/dynamic/` wird live neu geladen (kein Neustart nötig). Der Wechsel ist atomar aus Traefik-Sicht. Es gibt einen kurzen Moment (~1s) wo Traefik den neuen Container noch nicht erreicht hat.

Hinweis: In `ingoschindler.yml` gibt es einen bestehenden Bug – `ingoschindler-stats-ws` zeigte fälschlicherweise auf `static-goaccess-hausschindler-1`. Das wird hier korrekt behoben.

**Files:**
- Modify: `proxy/dynamic/ingoschindler.yml`
- Modify: `proxy/dynamic/sashriti.yml`

- [ ] **Step 1: ingoschindler.yml Services aktualisieren**

In `proxy/dynamic/ingoschindler.yml` die Services `ingoschindler-stats` und `ingoschindler-stats-ws` anpassen:

```yaml
    ingoschindler-stats:
      loadBalancer:
        servers:
          - url: "http://proxy-report-home-1:80"

    ingoschindler-stats-ws:
      loadBalancer:
        servers:
          - url: "http://proxy-goaccess-home-1:7890"
```

- [ ] **Step 2: sashriti.yml Services aktualisieren**

In `proxy/dynamic/sashriti.yml` die Services `sashriti-stats` und `sashriti-stats-ws` anpassen:

```yaml
    sashriti-stats:
      loadBalancer:
        servers:
          - url: "http://proxy-report-sashriti-1:80"

    sashriti-stats-ws:
      loadBalancer:
        servers:
          - url: "http://proxy-goaccess-sashriti-1:7890"
```

- [ ] **Step 3: Traefik-Reload abwarten**

Traefik überwacht das `dynamic/`-Verzeichnis und lädt Änderungen automatisch. Kurz warten (~2s) und dann prüfen:

```bash
docker compose logs --tail=5 traefik | grep -i "dynamic"
```

Erwartete Ausgabe: Meldung über Reload der dynamischen Konfiguration.

- [ ] **Step 4: Commit**

```bash
git add dynamic/ingoschindler.yml dynamic/sashriti.yml
git commit -m "fix: route stats services to new proxy GoAccess containers"
```

---

## Task 6: End-to-End-Verifikation

**Kontext:** Vor dem Aufräumen sicherstellen, dass beide Stats-Seiten korrekt funktionieren – HTML-Report erreichbar, WebSocket-Verbindung klappt.

- [ ] **Step 1: stats.ingoschindler.de im Browser öffnen**

URL: `https://stats.ingoschindler.de`

Erwartetes Ergebnis: GoAccess-Dashboard lädt, zeigt Traffic-Daten (auch wenn noch wenig Daten seit dem Neustart vorhanden sind).

- [ ] **Step 2: WebSocket-Verbindung prüfen**

Im Browser-DevTools (Netzwerk → WS) prüfen ob eine WebSocket-Verbindung zu `wss://stats.ingoschindler.de:443/ws` aufgebaut wird.

Alternativ via curl:

```bash
curl -s -o /dev/null -w "%{http_code}" https://stats.ingoschindler.de
```

Erwartete Ausgabe: `200`

- [ ] **Step 3: stats.sashriti.com prüfen**

Gleiche Prüfung für `https://stats.sashriti.com`.

- [ ] **Step 4: Geo-Daten prüfen**

Im GoAccess-Dashboard sollte der "Visitors by Location"-Panel Daten anzeigen (falls die GeoIP-Datei korrekt geladen wurde). Falls leer: Container-Logs prüfen auf GeoIP-bezogene Warnungen:

```bash
docker compose logs goaccess-home | grep -i geo
```

---

## Task 7: static_nginx aufräumen

**Kontext:** Erst aufräumen, nachdem Task 6 erfolgreich abgeschlossen ist. Die alten GoAccess-Container werden gestoppt und aus der Compose-Datei entfernt. Die `logs_*`-Volumes bleiben (prometheus-exporter).

**Files:**
- Modify: `static_nginx/docker-compose.yml`
- Delete: `static_nginx/goaccess-ingoschindler.conf`
- Delete: `static_nginx/goaccess-hausschindler.conf`
- Delete: `static_nginx/goaccess-sashriti.conf`
- Delete: `static_nginx/update-geoip.sh`

- [ ] **Step 1: Alte Container stoppen**

Im `static_nginx`-Verzeichnis:

```bash
cd /home/ingo/dev/static_nginx
docker compose stop goaccess-ingoschindler report-ingoschindler goaccess-hausschindler report-hausschindler goaccess-sashriti report-sashriti
```

- [ ] **Step 2: Container aus docker-compose.yml entfernen**

Aus `static_nginx/docker-compose.yml` folgende Service-Blöcke vollständig entfernen:
- `goaccess-ingoschindler`
- `report-ingoschindler`
- `goaccess-hausschindler`
- `report-hausschindler`
- `goaccess-sashriti`
- `report-sashriti`

Aus dem `volumes:`-Block entfernen:
- `report_ingoschindler:`
- `report_hausschindler:`
- `report_sashriti:`

- [ ] **Step 3: docker compose up um Konsistenz herzustellen**

```bash
docker compose up -d
```

Erwartete Ausgabe: Nur die verbleibenden Container (nginx-Webserver, prometheus-exporter) laufen. Keine Fehlermeldungen.

- [ ] **Step 4: Konfigurationsdateien löschen**

```bash
rm goaccess-ingoschindler.conf goaccess-hausschindler.conf goaccess-sashriti.conf update-geoip.sh
```

- [ ] **Step 5: Dangling volumes aufräumen (optional)**

Die alten report-Volumes können entfernt werden (sind nach dem compose-down nicht mehr referenziert):

```bash
docker volume ls | grep static
# Falls report_ingoschindler, report_hausschindler, report_sashriti noch existieren:
docker volume rm static_report_ingoschindler static_report_hausschindler static_report_sashriti
```

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml
git rm goaccess-ingoschindler.conf goaccess-hausschindler.conf goaccess-sashriti.conf update-geoip.sh
git commit -m "chore: remove old per-container GoAccess instances"
```

---

## Troubleshooting

**GoAccess startet nicht / exitiert sofort:**
- `docker compose logs goaccess-home` lesen
- Häufigste Ursache: GeoIP-File fehlt → `ls proxy/geoip/GeoLite2-City.mmdb` prüfen
- Falls Datei fehlt: `cd /home/ingo/dev/proxy && bash update-geoip.sh` (letzten Fehler ignorieren wenn Container noch nicht existieren)

**GoAccess meldet "Token doesn't match":**
- Traefik v3-Version prüfen: `docker compose exec traefik traefik version`
- Tatsächlichen JSON-Output prüfen: `docker compose exec traefik tail -1 /var/log/traefik/access.log`
- Feldnamen und Reihenfolge mit `log-format` in der .conf vergleichen

**stats.ingoschindler.de zeigt "Bad Gateway":**
- Container-Status prüfen: `docker compose ps` im proxy-Verzeichnis
- Container-Namen prüfen: `docker ps --format "{{.Names}}" | grep proxy`
- Falls Container `proxy-goaccess-home-1` heißt aber Routing auf anderen Namen zeigt: Namen in `dynamic/ingoschindler.yml` anpassen

**WebSocket verbindet nicht:**
- Browser-Konsole auf WebSocket-Fehler prüfen
- `ws-url` in `goaccess-home.conf` muss exakt dem Domain-Namen entsprechen, über den das Dashboard aufgerufen wird
