#!/bin/bash

# JSON embebido dentro de una variable
JSON='{
  "email": "demo@example.com",
  "password": "123456"
  "turnstileToken": "prueba",
}'

echo "Enviando 20 peticiones POST al endpoint /auth/login..."
echo "-----------------------------------------------"

for i in {1..20}; do
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost/auth/login \
    -H "Content-Type: application/json" \
    -d "$JSON")

  echo "$i -> $code"
done
