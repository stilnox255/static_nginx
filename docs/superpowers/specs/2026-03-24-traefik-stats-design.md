# Design: Zentralisierte Web-Statistiken via Traefik Access Log

**Datum:** 2026-03-24
**Status:** Approved
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

```
time-format %H:%M:%S
date-format %Y-%m-%d
log-format {"ClientHost":"%h","StartUTC":"%dT%tZ","RequestMethod":"%m","RequestPath":"%U","RequestProtocol":"%H","DownstreamStatus":%s,"DownstreamContentSize":%b,"RequestRefererHeader":"%R","UserAgent":"%u","RequestHost":"%v"}
port 7890
real-time-html true
ws-url wss://stats.ingoschindler.de:443/ws   # bzw. wss://stats.sashriti.com:443/ws
```

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

1. Traefik-Config updaten + neu starten → Log-Datei beginnt zu schreiben
2. GeoIP-Datei nach `proxy/geoip/` kopieren (oder `update-geoip.sh` ausführen)
3. Neue GoAccess/report-Container hochfahren
4. Traefik-Routing (dynamic config) auf neue Container-Namen umstellen
5. Alte GoAccess/report-Container in `static_nginx` stoppen und entfernen
6. Verfügbarkeit von `stats.ingoschindler.de` und `stats.sashriti.com` prüfen

---

## Offene Punkte

- **Traefik JSON-Feldnamen v3:** `DownstreamStatus` und `DownstreamContentSize` sind die v3-Feldnamen (v2 hieß es `OriginStatus`/`OriginContentSize`). Beim ersten Start prüfen ob das Log-Format korrekt geparst wird.
- **GoAccess und fehlendes GeoIP-File:** Falls `GeoLite2-City.mmdb` nicht existiert, startet GoAccess nicht. Das File muss vor `docker compose up` vorhanden sein.
- **bfof-Statistiken:** Bewusst ausgeklammert. Eigener Ansatz folgt separat.
