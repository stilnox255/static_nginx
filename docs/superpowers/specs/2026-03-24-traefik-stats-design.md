# Design: Zentralisierte Web-Statistiken via Traefik Access Log

**Datum:** 2026-03-24
**Status:** Approved (nach Spec-Review korrigiert)
**Betroffene Projekte:** `proxy/`, `static_nginx/`

---

## Ziel

Ablösung der container-spezifischen GoAccess-Instanzen durch zwei gruppen-basierte Statistik-Instanzen, die den Traefik Access Log als einzige Quelle nutzen. Dadurch werden auch Domains erfasst, die nicht über nginx-Container laufen (Home Assistant, evcc, Minecraft etc.).

**Statistik-Gruppen:**
- **Home:** alle `*.hausschindler.de` und `*.ingoschindler.de` → `stats.ingoschindler.de`
- **Sashriti:** alle `*.sashriti.com` → `stats.sashriti.com`

---

## Architektur

```
Alle Requests
      ↓
  [Traefik]  →  access.log (JSON, Volume: proxy_traefik_logs)
                     ↓
          ┌──────────┴──────────┐
    [goaccess-home]      [goaccess-sashriti]
    tail -F | grep       tail -F | grep
    hausschindler|       sashriti\.com
    ingoschindler
          ↓                     ↓
    [report-home]        [report-sashriti]
    nginx:1-alpine       nginx:1-alpine
          ↓                     ↓
  stats.ingoschindler.de   stats.sashriti.com
  (home-auth)              (sashriti-auth)
```

Alle neuen Container laufen im `proxy`-Projekt. Das Volume `proxy_traefik_logs` wird nicht projekt-übergreifend geteilt.

---

## Änderungen im Detail

### 1. `proxy/traefik.yml`

Traefik Access Log im JSON-Format aktivieren:

```yaml
accessLog:
  filePath: /var/log/traefik/access.log
  format: json
```

### 2. `proxy/docker-compose.yml`

**Traefik-Service:** neues Volume-Mount hinzufügen:
```yaml
- traefik_logs:/var/log/traefik
```

**Neue Volumes:**
```yaml
traefik_logs:
report_home:
report_sashriti:
```

**Neue Container:**

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
  expose: ["7890"]
  networks: [schindler_net]
  restart: unless-stopped

report-home:
  image: nginx:1-alpine
  volumes:
    - report_home:/usr/share/nginx/html:ro
  expose: ["80"]
  networks: [schindler_net]
  restart: unless-stopped

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
  expose: ["7890"]
  networks: [schindler_net]
  restart: unless-stopped

report-sashriti:
  image: nginx:1-alpine
  volumes:
    - report_sashriti:/usr/share/nginx/html:ro
  expose: ["80"]
  networks: [schindler_net]
  restart: unless-stopped
```

### 3. GoAccess-Konfigurationsdateien

**`proxy/goaccess-home.conf`** und **`proxy/goaccess-sashriti.conf`** (gleiche Struktur, unterschiedliche `ws-url`):

**`proxy/goaccess-home.conf`:**
```
time-format %H:%M:%S
date-format %Y-%m-%d
log-format {"ClientAddr":"%^","ClientHost":"%h","ClientPort":"%^","ClientUsername":"%^","DownstreamContentSize":%b,"DownstreamStatus":%s,"Duration":%^,"GzipRatio":%^,"OriginContentSize":%^,"OriginDuration":%^,"OriginStatus":%^,"Overhead":%^,"RequestAddr":"%^","RequestContentSize":%^,"RequestCount":%^,"RequestHost":"%v","RequestMethod":"%m","RequestPath":"%U","RequestPort":"%^","RequestProtocol":"%H","RequestScheme":"%^","RetryAttempts":%^,"StartLocal":"%^","StartUTC":"%dT%t.%^Z"
port 7890
real-time-html true
ws-url wss://stats.ingoschindler.de:443/ws
```

**`proxy/goaccess-sashriti.conf`:** identisch, nur `ws-url` abweichend:
```
ws-url wss://stats.sashriti.com:443/ws
```

Hinweis zum Log-Format: Traefik v3.6 gibt JSON-Felder alphabetisch sortiert aus. GoAccess parst GOJSON per Forward-Key-Scan: Es sucht jeden Schlüssel vorwärts im JSON-String ab der aktuellen Position (kein Rückwärts-Lookup). Daher müssen alle gelisteten Felder in der gleichen Reihenfolge wie im tatsächlichen Log-Output stehen. Unlisted fields between two listed fields are skipped automatically. Unbenötigte Felder werden mit `%^` übersprungen. Der Timestamp (`StartUTC`) enthält Nanosekunden (`2026-03-24T12:04:30.159685949Z`); das Muster `%dT%t.%^Z` konsumiert die Nachkommastellen korrekt.

### 4. `proxy/dynamic/ingoschindler.yml`

Services aktualisieren:

```yaml
services:
  ingoschindler-stats:
    loadBalancer:
      servers:
        - url: "http://proxy-report-home-1:80"

  ingoschindler-stats-ws:
    loadBalancer:
      servers:
        - url: "http://proxy-goaccess-home-1:7890"
```

### 5. `proxy/dynamic/sashriti.yml`

Services aktualisieren:

```yaml
services:
  sashriti-stats:
    loadBalancer:
      servers:
        - url: "http://proxy-report-sashriti-1:80"

  sashriti-stats-ws:
    loadBalancer:
      servers:
        - url: "http://proxy-goaccess-sashriti-1:7890"
```

### 6. GeoIP-Setup in `proxy/`

**`proxy/.gitignore`:** `geoip/` eintragen

**`proxy/update-geoip.sh`** (von `static_nginx/` übernommen und angepasst):
```bash
#!/bin/bash
set -e
DIR="geoip"
wget -O "$DIR/GeoLite2-City.mmdb.gz" https://cdn.jsdelivr.net/npm/geolite2-city/GeoLite2-City.mmdb.gz
gunzip -f "$DIR/GeoLite2-City.mmdb.gz"
echo "GeoIP database updated: $DIR/GeoLite2-City.mmdb"
docker compose restart goaccess-home goaccess-sashriti
```

### 7. `static_nginx/docker-compose.yml` – Aufräumen

Folgende Container entfernen:
- `goaccess-ingoschindler`, `report-ingoschindler`
- `goaccess-hausschindler`, `report-hausschindler`
- `goaccess-sashriti`, `report-sashriti`

Folgende Volumes entfernen:
- `report_ingoschindler`, `report_hausschindler`, `report_sashriti`

Folgende Dateien löschen:
- `static_nginx/goaccess-ingoschindler.conf`
- `static_nginx/goaccess-hausschindler.conf`
- `static_nginx/goaccess-sashriti.conf`
- `static_nginx/update-geoip.sh`

Volumes `logs_ingoschindler`, `logs_hausschindler`, `logs_sashriti` bleiben – werden von den prometheus-exportern genutzt.

---

## Migrationsstrategie

1. `proxy/geoip/` Verzeichnis anlegen (`.gitkeep` einchecken), `geoip/` ins `.gitignore` eintragen
2. `update-geoip.sh` ausführen → GeoLite2-City.mmdb nach `proxy/geoip/` laden
3. Traefik-Config updaten + Traefik neu starten → **kurzer Ausfall (~5s)**, Log-Datei beginnt zu schreiben
4. Neue GoAccess/report-Container hochfahren (`docker compose up -d goaccess-home report-home goaccess-sashriti report-sashriti`)
5. Traefik-Routing (dynamic config) auf neue Container-Namen umstellen – Traefik lädt dynamische Config automatisch neu, kein Neustart nötig
6. Verfügbarkeit von `stats.ingoschindler.de` und `stats.sashriti.com` prüfen
7. Alte GoAccess/report-Container in `static_nginx` stoppen und entfernen

---

## Offene Punkte

- **GoAccess und fehlendes GeoIP-File:** Falls `GeoLite2-City.mmdb` nicht vorhanden ist, startet GoAccess nicht. Reihenfolge in der Migration beachten: erst Datei laden, dann Container starten. Das `proxy/geoip/`-Verzeichnis muss existieren (`.gitkeep`).
- **bfof-Statistiken:** Bewusst ausgeklammert. Eigener Ansatz folgt separat.
