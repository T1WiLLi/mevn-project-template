#!/usr/bin/env bash
set -Eeuo pipefail
trap 'error_handler "${LINENO}" "${BASH_COMMAND}"' ERR

###############################################################################
# on-start.sh - Script to initialize and start the development environment
###############################################################################

log()   { echo -e "$(date '+%F %T') | ${*}" >&2; }
fail()  { log "ERROR: ${*}"; exit 1; }
error_handler() { log "ERROR at line ${1}: ${2}"; exit 1; }

script_dir() { cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P; }

detect_root() {
  local sd; sd="$(script_dir)"
  if [[ -d "${sd}/.." && -d "${sd}/../frontend" ]]; then
    realpath "${sd}/.."; return
  fi
  if command -v git >/dev/null 2>&1 && git rev-parse --show-toplevel >/dev/null 2>&1; then
    git rev-parse --show-toplevel; return
  fi
  if [[ -d "${PWD}/frontend" || -d "${PWD}/backend" ]]; then
    echo "${PWD}"; return
  fi
  fail "Cannot locate project root. Run inside the repo or keep script in scripts/."
}

ROOT="$(detect_root)"
BACKEND="${ROOT}/backend"
FRONTEND="${ROOT}/frontend"
ENV="${ROOT}/.env.template"

echo ""
log "Starting development environment setup at ROOT=${ROOT}"
echo ""

command -v npm >/dev/null || fail "npm is required"
command -v docker >/dev/null || fail "docker is required"

log ".env.template to .env..."
cd "${ROOT}"
if [[ -f ".env" ]]; then
  log ".env already exists -> skipping rename."
elif [[ -f ".env.template" ]]; then
  mv ".env.template" ".env"
  log "Renamed .env.template -> .env"
else
  log "No .env or .env.template found -> skipping."
fi
echo ""

log "Shutting down existing containers..."
cd "${ROOT}"
docker compose down
echo ""

log "Installing backend dependencies..."
cd "${BACKEND}"
npm install
echo ""

log "Installing frontend dependencies..."
cd "${FRONTEND}"
npm install
echo ""

log "Building and starting new containers..."
cd "${ROOT}"
docker compose up --build -d
echo ""

log "Setup complete. Development environment is running."

