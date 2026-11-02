#!/usr/bin/env sh
# Sauvegarde chiffrable de la base (à planifier via cron). Usage : ./backup-postgres.sh /chemin/sauvegardes
set -eu
DEST="${1:-./backups}"
mkdir -p "$DEST"
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-sunu}" "${POSTGRES_DB:-sunusafeguard}" | gzip > "$DEST/sunusafeguard-$STAMP.sql.gz"
echo "Sauvegarde : $DEST/sunusafeguard-$STAMP.sql.gz (pensez à la chiffrer, ex. gpg --symmetric)"
