# Quickstart: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Funcionalidad**: `001-base-usuarios-clientes`
**Fecha**: 2026-10-09

Guía de validación de extremo a extremo. No incluye código de implementación; los
detalles de endpoints y modelo de datos están en `contracts/api.md` y `data-model.md`.

## Prerrequisitos

- Node.js 20 LTS o superior.
- MySQL 8.x ejecutándose en local (por defecto `localhost:3306`).
- Un usuario de MySQL dedicado para la aplicación (no `root`), con permisos de CREATE,
  ALTER, INSERT, SELECT, UPDATE sobre la base de datos de desarrollo.

## Configuración inicial

1. **Variables de entorno**: copiar `backend/.env.example` a `backend/.env` y completar:

   ```text
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=<usuario_dedicado>
   DB_PASSWORD=<contraseña>
   DB_NAME=gym_sistema
   JWT_SECRET=<cadena_aleatoria_larga_para_desarrollo>
   PORT=3000
   ```

2. **Base de datos y migraciones** (crea la base, las tablas y la semilla):

   ```bash
   node database/scripts/crear-base-de-datos.js
   node database/scripts/ejecutar-migraciones.js
   ```

   Resultado esperado: tablas `usuarios`, `clientes`, `tipos_membresia`, `membresias`,
   `pagos` y `esquema_migraciones` creadas (InnoDB, utf8mb4); usuario administrador
   semilla presente (credenciales documentadas en `database/README.md`).

3. **Backend**:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   Comprobación: `GET http://localhost:3000/api/salud` → 200 `{ "estado": "ok" }`.

4. **Frontend** (otra terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Abrir la URL que muestra Vite (normalmente `http://localhost:5173`); el proxy envía
   `/api` al backend en el puerto 3000.

## Pruebas automatizadas

```bash
cd backend
npm test
```

Ejecuta `node:test` + `supertest` contra la base de datos de prueba (`gym_test`,
creada por los scripts). Resultado esperado: todas las pruebas en verde, incluyendo
autorización (403 por rol), hash bcrypt y unicidad de correo.

## Escenarios de validación manual (extremo a extremo)

Cada escenario corresponde a una historia de usuario de `spec.md`. Los códigos HTTP y
mensajes exactos están en `contracts/api.md`.

### V1 — Inicio de sesión (US-S1-01, SC-001)

1. Iniciar sesión con el usuario semilla administrador → se concede acceso y solo se
   muestran las opciones del administrador.
2. Intentar con contraseña incorrecta → mensaje de error genérico, sin acceso.
3. Probar el mismo flujo con recepcionista, entrenador y cliente; verificar que cada
   rol ve solo sus funciones (SC-001: 100% de concesiones/rechazos correctos).

### V2 — Registro de clientes (US-S1-04, SC-003)

1. Como recepcionista, registrar un cliente con nombre, apellido y correo (teléfono y
   dirección opcionales) → aparece en el listado.
2. Intentar con correo inválido o campos obligatorios vacíos → 400 sin crear registro.
3. Intentar con un correo ya existente → 409.
4. Como entrenador, intentar registrar un cliente → 403.
5. Verificar en MySQL que la fila existe y que no hay contraseñas en texto plano en
   `usuarios` (SC-002, inspección directa).

### V3 — Registro de usuarios y asignación de rol (US-S1-02, US-S1-03, SC-004)

1. Como administrador, registrar un usuario con rol recepcionista → el nuevo usuario
   puede iniciar sesión y su contraseña está hasheada (SC-002).
2. Registrar otro usuario con el mismo correo → 409 informando el conflicto.
3. Cambiar el rol de entrenador a recepcionista → el usuario pasa a operar con los
   permisos del nuevo rol en su siguiente petición.
4. Intentar cualquiera de estas operaciones como recepcionista, entrenador o cliente →
   403 en el 100% de los intentos (SC-004).

### V4 — Consulta de clientes por rol (US-S1-06, FR-025)

1. Como administrador y como recepcionista, listar clientes → todos los campos.
2. Como entrenador, listar clientes → solo nombre, apellido, teléfono y estado; sin
   correo, dirección ni datos financieros.
3. Como cliente, listar clientes → 403.
4. Registrar más de 20 clientes y verificar la paginación (20 por página,
   `totalPaginas` correcto; FR-027).

### V5 — Modificación de clientes (US-S1-05)

1. Como recepcionista, modificar el teléfono de un cliente → el cambio queda persistido
   y visible en la consulta.
2. Enviar datos inválidos (correo con formato incorrecto) → 400 y los datos originales
   se conservan.
3. Como entrenador o cliente → 403.

### V6 — Consulta de información propia (US-S1-07, SC-005)

1. Crear un usuario con rol cliente (el backend crea o reutiliza el cliente con el
   mismo correo, sin pedir ningún id) e iniciar sesión con él →
   `GET /api/clientes/mi-cuenta` muestra solo sus datos.
2. Intentar consultar a otro cliente por id → rechazo sin revelar datos de terceros
   (SC-005: 100% de las pruebas).
3. Un usuario cliente sin `cliente_id` → mensaje claro sin errores técnicos.
4. Intentar modificar su información → 403.

### V7 — Sesión, seguridad y casos límite

1. Esperar a que el JWT caduque (o probar con un token manipulado) → 401 y el frontend
   redirige al inicio de sesión (FR-024).
2. Desactivar un usuario con sesión activa → su siguiente petición autenticada → 401.
3. Login con correo inexistente → mismo mensaje genérico que contraseña incorrecta.
4. Enviar campos con intentos de inyección SQL → consultas parametrizadas sin efecto
   (FR-015).
5. Detener MySQL → el backend responde 500 con mensaje genérico, sin detalles internos
   (FR-020).
6. Confirmar que `.env` no está en Git y que `.env.example` no contiene secretos
   (FR-021).
7. Confirmar que no existen rutas de membresías funcionales, pagos funcionales ni
   reconocimiento facial (FR-016, FR-026); las tablas existen pero sin endpoints.

### V8 — Reconstrucción de la base de datos (SC-006)

1. Eliminar la base de datos de desarrollo.
2. Repetir el paso de configuración inicial → todas las tablas y la semilla quedan
   recreadas sin intervención manual sobre el motor.

### V9 — Flujo completo del sprint (SC-007)

Recorrer V1 → V6 en orden con los cuatro roles sin errores, en el entorno de
desarrollo, y verificar el flujo de `contracts/api.md` ("Ejemplo de recorrido
completo").

## Criterios de aceptación verificables

| Criterio | Cómo verificarlo |
|----------|------------------|
| SC-001 | V1 con los cuatro roles |
| SC-002 | V2 paso 5 e inspección de `usuarios.password` |
| SC-003 | V2 (registro de un cliente en < 2 min incluyendo verificación) |
| SC-004 | V3 paso 4 |
| SC-005 | V6 |
| SC-006 | V8 |
| SC-007 | V9 |
