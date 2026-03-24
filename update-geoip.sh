#!/bin/bash
set -e

DIR="geoip"

wget -O "$DIR/GeoLite2-City.mmdb.gz" https://cdn.jsdelivr.net/npm/geolite2-city/GeoLite2-City.mmdb.gz
gunzip -f "$DIR/GeoLite2-City.mmdb.gz"

echo "GeoIP database updated: $DIR/GeoLite2-City.mmdb"

docker compose restart goaccess-ingoschindler goaccess-hausschindler goaccess-sashriti

