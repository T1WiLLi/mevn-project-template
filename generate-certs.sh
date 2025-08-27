CERT_DIR="./certs"
CERT_KEY="$CERT_DIR/localhost.key"
CERT_CRT="$CERT_DIR/localhost.crt"

mkdir -p "$CERT_DIR"

if [ -f "$CERT_KEY" ] && [ -f "$CERT_CRT" ]; then
  echo "Certificates already exist in $CERT_DIR. Skipping generation."
  exit 0
fi

echo "Generating self-signed certificates..."
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$CERT_KEY" \
  -out "$CERT_CRT" \
  -days 365 \
  -subj "/CN=localhost"

echo "Certificates generated successfully:"
echo "  - $CERT_KEY"
echo "  - $CERT_CRT"
