#!/usr/bin/env bash
# Applies the migrations to a throwaway Postgres and runs the RLS tests.
# Needs the Postgres 16 server binaries; runs as root by dropping to `postgres`.
# A fresh cluster each time, because roles are cluster-wide.
set -euo pipefail

BIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
DIR="${PGTEST_DIR:-/var/lib/postgresql/pgtest}"
PORT="${PGTEST_PORT:-55432}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
run() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else bash -c "$*"; fi; }

run "$BIN/pg_ctl -D $DIR stop -m fast >/dev/null 2>&1 || true"
run "rm -rf $DIR && $BIN/initdb -D $DIR -A trust >/dev/null"
run "$BIN/pg_ctl -D $DIR -o '-p $PORT -c unix_socket_directories=/tmp -c listen_addresses=' -l $DIR.log -w start >/dev/null"
trap 'run "$BIN/pg_ctl -D $DIR stop -m fast >/dev/null 2>&1 || true"' EXIT

P=(psql -h /tmp -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${P[@]}" -f "$HERE/tests/stub-supabase.sql"
for f in "$HERE"/migrations/*.sql; do "${P[@]}" -f "$f"; done
"${P[@]}" -f "$HERE/tests/rls.test.sql" 2>&1 | grep -E "PASS|ERROR|FAIL|assert" | sed 's/^psql:[^ ]* //'
echo "ALL RLS TESTS PASSED"
