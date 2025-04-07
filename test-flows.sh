#!/bin/bash

# Colores para salida
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
API_URL="http://localhost:3001/api/v1"
EMAIL_1="test@example.com"
EMAIL_2="test2@example.com"
PASSWORD="Password123!"
USER_ID_1="84b74d4a-7baf-4368-80b0-60886bd7c9b1"
USER_ID_2="475795ac-0839-43fe-96f1-e6b690942024"
USER_ID_3="950f3ac6-39e7-47b2-9999-f3807b6cc934"

# Variable para almacenar el token
TOKEN=""

echo -e "${YELLOW}=============== PRUEBAS DE API CONSENTIA ===============${NC}"

# Función para hacer solicitudes y mostrar resultados
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  local auth_header=""
  
  echo -e "\n${YELLOW}=> $description${NC}"
  
  if [ ! -z "$TOKEN" ]; then
    auth_header="-H \"Authorization: Bearer $TOKEN\""
  fi
  
  if [ "$method" == "GET" ]; then
    if [ ! -z "$TOKEN" ]; then
      response=$(curl -s -X $method "$API_URL$endpoint" -H "Authorization: Bearer $TOKEN")
    else
      response=$(curl -s -X $method "$API_URL$endpoint")
    fi
  else
    if [ ! -z "$TOKEN" ]; then
      response=$(curl -s -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$data")
    else
      response=$(curl -s -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data")
    fi
  fi
  
  # Mostrar resultado formateado
  echo "$response" | jq '.' || echo "$response"
  
  # Verificar si hay un error en la respuesta
  if [[ "$response" == *"\"error\""* || "$response" == *"\"statusCode\""* ]]; then
    echo -e "${RED}❌ Prueba fallida${NC}"
  else
    echo -e "${GREEN}✅ Prueba exitosa${NC}"
  fi
  
  echo -e "${YELLOW}--------------------------------------------------------${NC}"
}

# 1. Login con usuario test@example.com
echo -e "\n${YELLOW}=============== INICIO DE SESIÓN ===============${NC}"
response=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL_1\", \"password\": \"$PASSWORD\"}")
echo "$response" | jq '.'

# Extraer el token si el login fue exitoso
if [[ "$response" == *"\"access_token\""* ]]; then
  TOKEN=$(echo "$response" | jq -r '.session.access_token')
  echo -e "${GREEN}✅ Login exitoso. Token obtenido.${NC}"
else
  echo -e "${RED}❌ Login fallido. No se pudo obtener token.${NC}"
fi

# 2. Obtener perfil del usuario actual
if [ ! -z "$TOKEN" ]; then
  make_request "GET" "/users/me" "" "Obtener perfil del usuario actual"
fi

# 3. Intentar ver eventos de auditoría
if [ ! -z "$TOKEN" ]; then
  make_request "GET" "/reports/audit?page=1&limit=10" "" "Obtener logs de auditoría (requiere permisos)"
fi

# 4. Registrar un evento de auditoría manualmente
if [ ! -z "$TOKEN" ]; then
  audit_data="{\"action\":\"TEST_ACTION\",\"resourceType\":\"SYSTEM\",\"resourceId\":\"test-resource\",\"details\":{\"testFlow\":true,\"description\":\"Prueba manual de auditoría\"}}"
  make_request "POST" "/audit/log" "$audit_data" "Registrar evento de auditoría manual"
fi

# 5. Actualizar información de perfil
if [ ! -z "$TOKEN" ]; then
  update_data="{\"name\":\"Usuario Actualizado\"}"
  make_request "PATCH" "/users/me" "$update_data" "Actualizar información de perfil"
fi

# 6. Listar compañías disponibles
if [ ! -z "$TOKEN" ]; then
  make_request "GET" "/companies" "" "Listar compañías disponibles"
fi

# 7. Verificar datos de consentimiento
if [ ! -z "$TOKEN" ]; then
  make_request "GET" "/consents/me" "" "Obtener consentimientos del usuario"
fi

# 8. Logout
if [ ! -z "$TOKEN" ]; then
  make_request "POST" "/auth/logout" "{}" "Cerrar sesión"
fi

# 9. Intentar con usuario no existente
echo -e "\n${YELLOW}=============== PRUEBA CON USUARIO INEXISTENTE ===============${NC}"
invalid_login="{\"email\": \"noexiste@example.com\", \"password\": \"$PASSWORD\"}"
make_request "POST" "/auth/login" "$invalid_login" "Intento de login con usuario inexistente"

echo -e "\n${YELLOW}=============== PRUEBA DE REGISTRO ===============${NC}"
random_email="user_$(date +%s)@example.com"
register_data="{\"email\": \"$random_email\", \"password\": \"$PASSWORD\", \"name\": \"Usuario Nuevo\"}"
make_request "POST" "/auth/register" "$register_data" "Registrar nuevo usuario"

echo -e "\n${YELLOW}=============== FIN DE PRUEBAS ===============${NC}" 