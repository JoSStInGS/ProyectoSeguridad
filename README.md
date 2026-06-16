# ProyectoSeguridad — Vulnerable App

## Descripción
Aplicación web cliente-servidor desarrollada con Node.js, Express y AngularJS, utilizada en el curso IC-8071 Seguridad del Software del Tecnológico de Costa Rica, Campus San Carlos. Es un fork de [djadmin/vulnerable-app](https://github.com/djadmin/vulnerable-app) que contiene vulnerabilidades intencionales para su análisis y corrección.

---

## Requisitos previos
- Node.js v6.x
- npm
- gulp (instalado globalmente)

```powershell
npm install -g gulp
```

---

## Cómo correr la aplicación

**1. Instalar dependencias:**
```powershell
npm install
```

**2. Iniciar el servidor:**
```powershell
npm start
```

**3. Abrir en el navegador:**
```http://localhost:8001
---

## Correcciones de seguridad realizadas

### Rama: correccion-servidor

#### Corrección 1 — Middleware de autenticación
**Archivo modificado:** `src/server/routes.js`

Las rutas `/api/user/profile/` eran accesibles sin ninguna sesión activa. Se implementó el middleware `requireAuth` que verifica que la cookie `userAuthToken` corresponde a una sesión registrada en el servidor antes de procesar cualquier petición.

**Cómo verificar:**
```powershell
# Debe responder 401
Invoke-WebRequest -Uri "http://localhost:8001/api/user/profile/" -Method GET -UseBasicParsing | Select-Object StatusCode, Content
```

---

## Corrección 2 — Rate Limiting en Login
**Archivo modificado:** `src/server/routes.js`

El endpoint `/api/user/login` aceptaba peticiones ilimitadas permitiendo ataques de fuerza bruta. Se instaló `express-rate-limit` y se configuró un límite de 3 intentos por IP cada 5 minutos.

**Cómo verificar:**
```powershell
# Al 3er intento debe responder con error de límite
1..5 | ForEach-Object { Invoke-WebRequest -Uri "http://localhost:8001/api/user/login" -Method POST -ContentType "application/json" -Body '{}' -UseBasicParsing | Select-Object StatusCode }
```

---

### Rama: correccion-cliente

#### Corrección 3 — XSS Reflejado en búsqueda 
**Archivos modificados:** `src/server/routes.js`, `src/client/app/xss-search/xss-search.controller.js`, `src/client/app/xss-search/xss-search.html`

El endpoint `/api/search` devolvía el término de búsqueda sin sanitizar, permitiendo inyección de scripts. Se instaló la librería `he` para codificar caracteres HTML peligrosos en el servidor. En el cliente se eliminó `$sce.trustAsHtml()` y se cambió `ng-bind-html` por `ng-bind`.

**Cómo verificar:**
```powershell
# Debe devolver el script codificado como texto plano
Invoke-WebRequest -Uri "http://localhost:8001/api/search?searchTerm=<script>alert('XSS')</script>" -UseBasicParsing | Select-Object Content
```

---

### Rama: correcion-vulnerabilidad-cliente

#### Corrección 4 — CSRF en actualización de perfil
**Archivos modificados:** `src/server/app.js`, `src/server/routes.js`

El endpoint `/api/user/profile/` aceptaba peticiones POST desde cualquier origen sin verificar si provenían del formulario legítimo. Se implementó el patrón de token sincronizador CSRF usando el módulo `crypto` de Node.js. El servidor genera un token único por sesión en una cookie y lo valida en cada petición POST.

**Cómo verificar:**
```powershell
# Debe responder 403 sin token CSRF
$login = Invoke-WebRequest -Uri "http://localhost:8001/api/user/login" -Method POST -ContentType "application/json" -Body '{}' -UseBasicParsing
$token = $login.Content.Trim('"')
Invoke-WebRequest -Uri "http://localhost:8001/api/user/profile/" -Method POST -ContentType "application/json" -Body '{"firstName":"Atacante","lastName":"Externo"}' -Headers @{Cookie="userAuthToken=$token"} -UseBasicParsing | Select-Object StatusCode, Content
```

---

### Rama: correccion-logging

#### Corrección 5 — Logging formal de eventos críticos 
**Archivos modificados:** `src/server/routes.js`, `src/server/logger.js` (nuevo)

El servidor no contaba con ningún sistema de registro persistente. Se creó `logger.js` usando `winston` que registra eventos en `src/server/logs/security.log` en formato JSON estructurado con timestamp, IP y nivel de severidad en modo append-only.

**Cómo verificar:**
```powershell
# Hacer login y verificar que el evento quedó registrado
Invoke-WebRequest -Uri "http://localhost:8001/api/user/login" -Method POST -ContentType "application/json" -Body '{}' -UseBasicParsing | Select-Object StatusCode
Get-Content src/server/logs/security.log
```

---

#### Corrección 6 — Manejo seguro de errores
**Archivos modificados:** `src/server/app.js`, `src/server/utils/404.js`

El servidor exponía información interna en los mensajes de error como URLs, descripciones detalladas y estructura del sistema. Se modificó el manejador de errores para registrar el detalle internamente en el log y devolver únicamente mensajes genéricos al cliente.

**Cómo verificar:**
```powershell
# Debe responder solo con mensaje genérico
Invoke-WebRequest -Uri "http://localhost:8001/api/person/99999" -UseBasicParsing | Select-Object Content
```

---

## Resumen de correcciones

### Jostin (JGGS)
Responsable de todas las correcciones de seguridad del proyecto:
- Corrección 1: Middleware de autenticación en rutas sensibles
- Corrección 2: Rate limiting en endpoint de login
- Corrección 3: Sanitización de XSS en búsqueda
- Corrección 4: Implementación de token CSRF
- Corrección 5: Sistema de logging formal con Winston
- Corrección 6: Manejo seguro de errores del servidor

---

## Consideraciones éticas
Todas las pruebas fueron ejecutadas únicamente en el entorno local autorizado del curso. No se atacaron sistemas externos ni se publicaron exploits.