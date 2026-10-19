# Tareas: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Input**: Documentos de diseño de `/specs/001-base-usuarios-clientes/`

**Prerrequisitos**: plan.md, spec.md, research.md, data-model.md, contracts/api.md,
quickstart.md

**Tests**: SÍ incluidos. El plan de implementación (`plan.md`, Contexto Técnico) define
explícitamente la estrategia de pruebas con `node:test` + `supertest` (contrato e
integración), y la constitución (Principio X) exige probar autenticación, roles y
clientes antes de dar por terminada cada función.

**Organización**: las tareas están agrupadas por historia de usuario para permitir
implementación y pruebas independientes. Historias del `spec.md`:
US1 Inicio de sesión (P1), US2 Registro de clientes (P1), US3 Registro de usuarios (P2),
US4 Asignación de roles (P2), US5 Consulta de clientes (P2), US6 Modificación de clientes
(P3), US7 Consulta de información propia (P3).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: historia de usuario a la que pertenece la tarea
- Cada tarea indica la ruta exacta del archivo

## Convenciones de rutas (según plan.md)

- Aplicación web: `backend/src/`, `frontend/src/`, `database/`
- Pruebas: `backend/tests/contract/`, `backend/tests/integration/`

---

## Fase 1: Configuración (infraestructura compartida)

**Propósito**: inicializar la estructura del proyecto (FR-018, FR-019) y las
herramientas comunes.

- [X] T001 Crear la estructura de carpetas del proyecto en la raíz: `frontend/`,
      `backend/` y `database/` con sus subcarpetas según plan.md (`backend/src/{config,routes,controllers,services,models,middlewares,validators,utils}`,
      `backend/tests/{contract,integration}`, `frontend/src/{pages,components,services}`,
      `database/{migrations,seeds,scripts}`); NO crear carpetas alternativas
      (`client/`, `server/`, `dataBase/`).
- [X] T002 Inicializar `backend/package.json` con `"type": "module"` (ES Modules
      obligatorio, sin `require` ni `module.exports`) y las dependencias decididas en
      research.md (D1, D6): `express`, `mysql2`, `bcrypt`, `jsonwebtoken`, `dotenv`,
      `cors`; y como devDependencies `supertest`.
- [X] T003 [P] Inicializar `frontend/` con Vite y React en JavaScript (research.md D2):
      crear `frontend/package.json`, `frontend/index.html`, `frontend/vite.config.js`
      (con proxy de `/api` a `http://localhost:3000` en desarrollo) y
      `frontend/src/main.jsx`; dependencias `react`, `react-dom`, `react-router-dom`.
- [X] T004 [P] Crear `backend/.env.example` con las variables `DB_HOST`, `DB_PORT`,
      `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` y `PORT` sin valores reales
      (FR-021), y crear/actualizar `.gitignore` en la raíz incluyendo `.env`,
      `node_modules/` y archivos físicos de MySQL (FR-021).
- [X] T005 [P] Crear `database/scripts/crear-base-de-datos.js` (ES Modules) que lee las
      variables de entorno y crea la base de datos si no existe con codificación
      `utf8mb4` (FR-023).
- [X] T006 [P] Crear `database/scripts/ejecutar-migraciones.js` (ES Modules) que aplica
      en orden alfabético los scripts de `database/migrations/` que no estén registrados
      en la tabla `esquema_migraciones` y los registra tras ejecutarlos (FR-023,
      research.md D10).

---

## Fase 2: Fundacional (prerrequisitos bloqueantes)

**Propósito**: infraestructura que DEBE estar completa antes de cualquier historia de
usuario.

**?? CRÍTICO**: ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T007 Crear la migración `database/migrations/001_crear_tablas.sql` con las tablas
      `usuarios`, `clientes`, `tipos_membresia`, `membresias` y `pagos` según
      data-model.md: motor InnoDB, `utf8mb4`, claves primarias, claves foráneas y las
      restricciones literales del modelo (UNIQUE en `usuarios.correo` y
      `clientes.correo`, ENUM de `rol` con valores
      `('administrador','recepcionista','entrenador','cliente')`, ENUM de `estado`
      `('activo','inactivo')`, `usuarios.cliente_id` NULL con FK a
      `clientes.id_cliente` ON DELETE RESTRICT, ENUM de estado de `membresias`
      `('activo','vencida','suspendida','cancelada')`), además de la tabla
      `esquema_migraciones`.
- [X] T008 Crear la migración `database/migrations/002_tabla_esquema_migraciones.sql`
      si `esquema_migraciones` no quedó incluida en T007; verificar que ejecutar
      `node database/scripts/ejecutar-migraciones.js` sobre una base vacía la recrea
      completa sin intervención manual (SC-006).
- [X] T009 [P] Crear `database/seeds/seed-administrador.sql` con el usuario
      administrador semilla cuya contraseña está almacenada como hash bcrypt (FR-002),
      idempotente por correo único (research.md D9), y documentar las credenciales de
      desarrollo en `database/README.md`.
- [X] T010 [P] Crear `backend/src/config/database.js`: pool de conexiones `mysql2/promise`
      con las variables de entorno (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`,
      `DB_NAME`); las credenciales NUNCA se escriben en el código (FR-021).
- [X] T011 [P] Crear `backend/src/config/entorno.js` (con `dotenv`) que valida la
      presencia de las variables requeridas y aborta el arranque con mensaje claro si
      faltan.
- [X] T012 [P] Crear `backend/src/utils/respuestas.js` con helpers para respuestas de
      éxito y para el envelope de error `{ mensaje, codigo }` definido en
      contracts/api.md.
- [X] T013 Crear `backend/src/middlewares/errores.js`: middleware central de errores que
      traduce errores de validación (400), unicidad MySQL 1062 (409) y cualquier error
      interno a 500 con mensaje genérico, sin exponer stack traces ni detalles del
      servidor (FR-020).
- [X] T014 Crear `backend/src/middlewares/autenticacion.js`: verifica el JWT
      (`Authorization: Bearer`) con `JWT_SECRET`, decodifica `id_usuario` y `rol`, y
      comprueba en cada petición que el usuario exista y esté `activo` (usuario
      inactivo o token inválido/expirado → 401; FR-004, FR-024, caso límite
      "desactivado con sesión activa").
- [X] T015 Crear `backend/src/middlewares/autorizacion.js`: factoría `autorizar(...roles)`
      que responde 403 con el envelope `{ mensaje, codigo: "AUTORIZACION" }` cuando el
      rol del token no está permitido para la ruta (FR-005); la validación ocurre
      SIEMPRE en el backend.
- [X] T016 Crear `backend/src/app.js` (Express, JSON, cors en desarrollo) que monta el
      router de salud y deja el encadenamiento listo para rutas de auth, usuarios y
      clientes, con el middleware de errores al final; y crear `backend/src/server.js`
      que arranca en `PORT`.
- [X] T017 [P] Crear el endpoint público `GET /api/salud` en
      `backend/src/routes/salud.routes.js` devolviendo `{ "estado": "ok" }` (infraestructura
      de quickstart).
- [X] T018 [P] Crear `frontend/src/services/api.js`: cliente HTTP con `fetch` que agrega
      el encabezado `Authorization: Bearer` desde el token almacenado, redirige al login
      ante 401 y parsea el envelope de errores de contracts/api.md.
- [X] T019 [P] Crear `frontend/src/context/AuthContext.jsx` (research.md D3): estado
      global mínimo de sesión (token e usuario) con persistencia en `localStorage`,
      funciones `iniciarSesion` y `cerrarSesion`, y ruta protegida base en
      `frontend/src/components/RutaProtegida.jsx`.

**Punto de control**: la base se reconstruye desde cero, el backend arranca con
`/api/salud` en 200 y los middlewares de autenticación/autorización están listos.

---

## Fase 3: Historia de usuario 1 - Inicio de sesión (Prioridad: P1) ?? MVP

**Objetivo**: un usuario registrado inicia sesión con correo y contraseña y recibe un
JWT con su rol (US-S1-01, FR-001 a FR-004, FR-024).

**Prueba independiente**: iniciar sesión con el usuario semilla administrador concede
acceso; con contraseña incorrecta se rechaza con mensaje genérico; una ruta protegida
sin token responde 401 y con rol insuficiente 403.

### Pruebas para la Historia de usuario 1

> **NOTA**: escribir estas pruebas PRIMERO y verificar que fallan antes de la
> implementación.

- [X] T020 [P] [US1] Crear prueba de contrato `backend/tests/contract/auth.test.js`
      (node:test + supertest): login 200 con credenciales válidas del semilla, 401 con
      contraseña incorrecta e idéntico mensaje genérico con correo inexistente, según
      contracts/api.md.
- [X] T021 [P] [US1] Crear prueba de integración `backend/tests/integration/auth.test.js`:
      el token emitido permite acceder a una ruta protegida de prueba, el token
      manipulado responde 401, y el JWT expira a las 8 horas (FR-024).
- [X] T022 [P] [US1] Crear prueba de integración `backend/tests/integration/autorizacion.test.js`:
      un usuario autenticado con rol no administrador recibe 403 al invocar una ruta
      reservada al administrador (precondición de US3/US4, SC-004).

### Implementación para la Historia de usuario 1

- [X] T023 [US1] Crear `backend/src/validators/auth.validator.js`: valida formato de
      correo y que `password` no esté vacía en el login (FR-013).
- [X] T024 [US1] Crear `backend/src/models/usuario.model.js` con la función
      `buscarUsuarioPorCorreo(correo)` usando consultas parametrizadas (`?`, FR-015);
      selecciona `id_usuario`, `nombre`, `correo`, `password` (hash bcrypt), `rol` y
      `estado`.
- [X] T025 [US1] Crear `backend/src/services/auth.service.js`: verifica con
      `bcrypt.compare`, rechaza usuarios `inactivo` con el mismo mensaje genérico que
      credenciales inválidas (caso límite del spec), y emite el JWT con payload
      `{ id_usuario, rol }`, algoritmo HS256 y expiración de 8 horas (FR-024,
      research.md D6).
- [X] T026 [US1] Crear `backend/src/controllers/auth.controller.js` con
      `iniciarSesion` que responde `{ token, usuario: { id_usuario, nombre, correo, rol } }`
      sin incluir jamás el campo `password` (contracts/api.md).
- [X] T027 [US1] Crear `backend/src/routes/auth.routes.js` con `POST /api/auth/login`
      (ruta pública, sin middleware de autenticación) y montarlo en `backend/src/app.js`.
- [X] T028 [US1] Crear `frontend/src/pages/Login.jsx`: formulario de correo y contraseña
      que llama a `api.js`, guarda la sesión en `AuthContext`, muestra mensajes de error
      claros y redirige según el rol; integrar rutas y navegación en
      `frontend/src/App.jsx`.

**Punto de control**: la Historia de usuario 1 está completa y puede probarse de forma
independiente (quickstart V1).

---

## Fase 4: Historia de usuario 2 - Registro de clientes (Prioridad: P1)

**Objetivo**: administrador y recepcionista registran clientes con validación; el
entrenador recibe 403 (US-S1-04, FR-009, FR-013, FR-014).

**Prueba independiente**: desde un recepcionista autenticado, registrar un cliente con
datos completos y verificar que queda en MySQL y aparece en el listado; con datos
inválidos o correo duplicado se rechaza sin crear el registro.

### Pruebas para la Historia de usuario 2

- [X] T029 [P] [US2] Crear prueba de contrato `backend/tests/contract/clientes.test.js`
      para `POST /api/clientes`: 201 con datos válidos; 400 con correo con formato
      incorrecto o campos obligatorios vacíos (nombre, apellido, correo); 409 con correo
      ya registrado; 403 con rol entrenador y con rol cliente.
- [X] T030 [P] [US2] Crear prueba de integración `backend/tests/integration/clientes-alta.test.js`:
      registrar un cliente como recepcionista y verificar su persistencia consultando
      MySQL directamente; verificar que `telefono` y `direccion` pueden omitirse
      (opcionales).

### Implementación para la Historia de usuario 2

- [X] T031 [P] [US2] Crear `backend/src/validators/cliente.validator.js` citando las
      restricciones de data-model.md: `nombre` y `apellido` obligatorios (VARCHAR 100),
      `correo` obligatorio con formato válido (VARCHAR 150), `telefono` (VARCHAR 20) y
      `direccion` (VARCHAR 200) opcionales; cualquier campo desconocido se ignora o
      rechaza con 400.
- [X] T032 [US2] Crear `backend/src/models/cliente.model.js` con `crearCliente(datos)`,
      `buscarClientePorCorreo(correo)` y `listarClientes({ pagina, limite })` usando
      consultas parametrizadas (FR-015); `fecha_registro` y `estado = 'activo'` los
      asigna MySQL por defecto (data-model.md).
- [X] T033 [US2] Crear `backend/src/services/cliente.service.js` con `registrarCliente`:
      valida la entrada, rechaza correo duplicado con 409 (`CONFLICTO_CORREO`) usando la
      restricción UNIQUE como autoridad final, y nunca emite `DELETE` sobre la tabla
      `clientes` (FR-014).
- [X] T034 [US2] Crear `backend/src/controllers/clientes.controller.js` con
      `crearCliente` (201 con el cliente creado) y `backend/src/routes/clientes.routes.js`
      con `POST /api/clientes` protegido por `autenticacion` +
      `autorizar('administrador', 'recepcionista')`; montar el router en
      `backend/src/app.js`.
- [X] T035 [US2] Crear `frontend/src/pages/Clientes.jsx` con la vista de listado base y
      `frontend/src/components/ClienteForm.jsx` (alta de cliente) que muestra mensajes
      de éxito y de error devueltos por el backend; el formulario solo se ofrece a
      administrador y recepcionista (la autoridad de seguridad sigue en el backend).

**Punto de control**: la Historia de usuario 2 está completa e independiente
(quickstart V2).

---

## Fase 5: Historia de usuario 3 - Registro de usuarios (Prioridad: P2)

**Objetivo**: solo el administrador registra usuarios con correo único, contraseña
hasheada y rol válido (US-S1-02, FR-006, FR-007, FR-008).

**Prueba independiente**: registrar un usuario con rol recepcionista y verificar que
puede iniciar sesión y que su contraseña está almacenada con hash bcrypt; correo
duplicado → 409; no administrador → 403.

### Pruebas para la Historia de usuario 3

- [X] T036 [P] [US3] Crear prueba de contrato `backend/tests/contract/usuarios.test.js`
      para `POST /api/usuarios`: 201; 400 con rol inválido o password corta; 409 con
      correo existente; 403 con roles recepcionista, entrenador y cliente (SC-004).
- [X] T037 [P] [US3] Crear prueba de integración `backend/tests/integration/usuarios.test.js`:
      el usuario creado puede iniciar sesión y su `password` en la tabla `usuarios` es
      un hash bcrypt, no texto plano (SC-002); `cliente_id` debe ser NULL al crear un
      usuario con rol administrativo y, con `rol = 'cliente'`, el backend lo resuelve
      solo (aclaración 2026-10-14: se prueban la creación automática del cliente, la
      reutilización por correo, el 409 por cliente ya vinculado y el rollback).

### Implementación para la Historia de usuario 3

- [X] T038 [US3] Ampliar `backend/src/models/usuario.model.js` con `crearUsuario(datos)`,
      `buscarUsuarioPorId(id)` y `listarUsuarios()` con consultas parametrizadas.
- [X] T039 [US3] Ampliar `backend/src/validators/` con `usuario.validator.js` citando
      data-model.md: `nombre` (VARCHAR 100) obligatorio, `correo` (VARCHAR 150)
      obligatorio y con formato válido, `password` obligatoria con longitud mínima de 8
      caracteres, `rol` obligatorio dentro de
      `('administrador','recepcionista','entrenador','cliente')`.
- [X] T040 [US3] Ampliar `backend/src/services/cliente.service.js` o crear
      `backend/src/services/usuario.service.js` con `crearUsuario`: hashea la contraseña
      con `bcrypt.hash` (nunca texto plano, FR-002) y rechaza correo duplicado con 409.
      Para `rol = 'cliente'` crea o reutiliza el cliente dentro de una transacción con
      rollback y enlaza `cliente_id` (queda NULL en los demás roles; aclaración
      2026-10-14, que sustituye a la exigencia previa de `cliente_id` en el alta).
- [X] T041 [US3] Crear `backend/src/controllers/usuarios.controller.js` con `crearUsuario`
      y `backend/src/routes/usuarios.routes.js` con `POST /api/usuarios` y
      `GET /api/usuarios` protegidos por `autenticacion` + `autorizar('administrador')`
      (FR-006); montar el router en `backend/src/app.js`.
- [X] T042 [US3] Crear `frontend/src/pages/Usuarios.jsx` con el listado y el formulario
      de alta de usuarios (nombre, apellido visible cuando el rol es `cliente`, correo,
      password y rol, sin ningún campo de id), con mensajes de éxito/error del backend
      (aclaración 2026-10-14).

**Punto de control**: la Historia de usuario 3 está completa e independiente
(quickstart V3, pasos 1–2).

---

## Fase 6: Historia de usuario 4 - Asignación de roles (Prioridad: P2)

**Objetivo**: el administrador asigna o cambia el rol de un usuario y el nuevo rol
surte efecto en la siguiente petición (US-S1-03, FR-008).

**Prueba independiente**: cambiar el rol de un usuario de entrenador a recepcionista y
verificar que su siguiente operación concede y niega las acciones del nuevo rol; rol
inexistente → 400; no administrador → 403.

### Pruebas para la Historia de usuario 4

- [X] T043 [P] [US4] Crear prueba de integración `backend/tests/integration/roles.test.js`:
      PATCH de rol exitoso, efecto inmediato en la siguiente petición autenticada del
      usuario, 400 con rol fuera del ENUM y 403 al intentarlo con un no administrador.

### Implementación para la Historia de usuario 4

- [X] T044 [US4] Ampliar `backend/src/models/usuario.model.js` con
      `actualizarRol(id, rol)` (consultas parametrizadas).
- [X] T045 [US4] Ampliar `backend/src/services/usuario.service.js` con `asignarRol`:
      valida que el rol esté dentro del ENUM; si el nuevo rol es `cliente` exige
      `cliente_id`, y si deja de ser `cliente` deja `cliente_id` en NULL (data-model.md).
- [X] T046 [US4] Ampliar `backend/src/controllers/usuarios.controller.js` y
      `backend/src/routes/usuarios.routes.js` con `PATCH /api/usuarios/:id/rol`
      protegido con `autorizar('administrador')`.

**Punto de control**: la Historia de usuario 4 está completa e independiente
(quickstart V3, paso 3).

---

## Fase 7: Historia de usuario 5 - Consulta de clientes (Prioridad: P2)

**Objetivo**: administrador, recepcionista y entrenador listan clientes; el entrenador
recibe solo nombre, apellido, teléfono y estado; paginación de 20 por página
(US-S1-06, FR-011, FR-025, FR-027).

**Prueba independiente**: con los tres roles autorizados, el listado muestra los campos
permitidos por rol (el entrenador no ve correo ni dirección); el rol cliente recibe
403; más de 20 registros producen varias páginas.

### Pruebas para la Historia de usuario 5

- [X] T047 [P] [US5] Ampliar `backend/tests/contract/clientes.test.js` con
      `GET /api/clientes`: 200 con los tres roles autorizados; la respuesta del
      entrenador contiene exactamente `nombre`, `apellido`, `telefono` y `estado` (sin
      `correo` ni `direccion`); 403 con rol cliente; estructura de paginación
      `{ clientes, pagina, limite: 20, total, totalPaginas }` (FR-025, FR-027).
- [X] T048 [P] [US5] Crear prueba de integración `backend/tests/integration/clientes-consulta.test.js`:
      insertar 25 clientes de prueba y verificar dos páginas con 20 y 5 registros.

### Implementación para la Historia de usuario 5

- [X] T049 [US5] Ampliar `backend/src/models/cliente.model.js` con
      `listarClientes({ pagina, limite })` que selecciona por defecto todos los campos
      y con la opción `camposEntrenador` proyecta SOLO `nombre`, `apellido`, `telefono`
      y `estado` directamente en SQL (FR-025; el backend nunca filtra solo en el
      frontend) y `contarClientes()` para el total; límite fijo de 20 y `pagina`
      parameterizada (FR-027).
- [X] T050 [US5] Ampliar `backend/src/services/cliente.service.js` con `obtenerListadoClientes(rolSolicitante, pagina)` que aplica la proyección de campos según el rol (administrador y recepcionista: todos los campos; entrenador: campos restringidos) y calcula `totalPaginas`.
- [X] T051 [US5] Ampliar `backend/src/controllers/clientes.controller.js` y `backend/src/routes/clientes.routes.js` con `GET /api/clientes` protegido por `autorizar('administrador', 'recepcionista', 'entrenador')`, y `GET /api/clientes/:id` con la misma proyección por rol (404 si no existe).
- [X] T052 [US5] Ampliar `frontend/src/pages/Clientes.jsx` con la paginación (controles de página, `totalPaginas`) y columnas condicionales por rol (sin correo/dirección para entrenador), consumiendo el contrato de paginación de contracts/api.md.

**Punto de control**: la Historia de usuario 5 está completa e independiente
(quickstart V4).

---

## Fase 8: Historia de usuario 6 - Modificación de clientes (Prioridad: P3)

**Objetivo**: administrador y recepcionista modifican clientes con validación; datos
inválidos conservan el registro original; entrenador y cliente reciben 403
(US-S1-05, FR-010).

**Prueba independiente**: modificar el teléfono de un cliente y verificar el cambio
persistido; enviar un correo inválido y verificar 400 con los datos originales intactos.

### Pruebas para la Historia de usuario 6

- [X] T053 [P] [US6] Ampliar `backend/tests/contract/clientes.test.js` con
      `PATCH /api/clientes/:id`: 200 con datos válidos; 400 con correo inválido y
      verificación de que los datos originales permanecen; 404 con id inexistente; 403
      con entrenador y cliente.

### Implementación para la Historia de usuario 6

- [X] T054 [US6] Ampliar `backend/src/models/cliente.model.js` con
      `actualizarCliente(id, datos)` que solo actualiza los campos presentes y
      permitidos (nombre, apellido, correo, telefono, direccion) con consultas
      parametrizadas; sin `DELETE` (FR-014).
- [X] T055 [US6] Ampliar `backend/src/services/cliente.service.js` con
      `modificarCliente`: valida la entrada, rechaza 409 si el nuevo correo pertenece a
      otro cliente y no aplica ningún cambio si la validación falla.
- [X] T056 [US6] Ampliar `backend/src/controllers/clientes.controller.js` y
      `backend/src/routes/clientes.routes.js` con `PATCH /api/clientes/:id` protegido
      con `autorizar('administrador', 'recepcionista')` (FR-010).
- [X] T057 [US6] Ampliar `frontend/src/pages/ClienteDetalle.jsx` con el formulario de
      modificación (reutiliza `ClienteForm.jsx`) y confirmación antes de guardar cambios.

**Punto de control**: la Historia de usuario 6 está completa e independiente
(quickstart V5).

---

## Fase 9: Historia de usuario 7 - Consulta de información propia (Prioridad: P3)

**Objetivo**: el usuario con rol cliente consulta únicamente su propia información; sin
cliente asociado muestra un mensaje claro (US-S1-07, FR-012, RN-14).

**Prueba independiente**: con un usuario cliente autenticado, `mi-cuenta` devuelve solo
sus datos; intentar ver a otro cliente se rechaza sin revelar datos; modificar
cualquier cosa responde 403.

### Pruebas para la Historia de usuario 7

- [X] T058 [P] [US7] Crear prueba de integración `backend/tests/integration/mi-cuenta.test.js`:
      el cliente solo ve su propio registro (SC-005); un cliente sin `cliente_id`
      recibe un mensaje claro sin errores técnicos; intentar `GET /api/clientes/:id` de
      otro cliente responde 403 sin datos de terceros.

### Implementación para la Historia de usuario 7

- [X] T059 [US7] Ampliar `backend/src/models/cliente.model.js` con
      `buscarClientePorIdPropio(idUsuario)` que resuelve `usuarios.cliente_id` →
      `clientes` (aclaración 2026-10-09; FK de `usuarios` a `clientes`).
- [X] T060 [US7] Ampliar `backend/src/services/cliente.service.js` con
      `obtenerMiCuenta(idUsuario)`: devuelve el registro completo propio; si el usuario
      no tiene `cliente_id` lanza un error de dominio con mensaje claro (caso límite
      del spec) mapeado a 404.
- [X] T061 [US7] Ampliar `backend/src/controllers/clientes.controller.js` y
      `backend/src/routes/clientes.routes.js` con `GET /api/clientes/mi-cuenta` (ruta
      estática declarada ANTES de `/api/clientes/:id`) protegida solo con
      `autenticacion`, resolviendo el cliente desde el token, jamás desde un id del
      cliente (FR-012).
- [X] T062 [US7] Ampliar el middleware de autorización en
      `backend/src/middlewares/autorizacion.js` y las rutas existentes para que el rol
      `cliente` reciba 403 en `GET /api/clientes`, `GET /api/clientes/:id` y las
      operaciones de escritura de clientes (US-S1-07 escenario 3).
- [X] T063 [US7] Crear `frontend/src/pages/MiCuenta.jsx` accesible solo con rol cliente
      (RutaProtegida con rol), que muestra los datos propios y el mensaje claro cuando
      no hay cliente asociado.

**Punto de control**: todas las historias son funcionales e independientes.

---

## Fase 10: Pulido y preocupaciones transversales

**Propósito**: mejoras que afectan a varias historias.

- [X] T064 [P] Ampliar `backend/tests/integration/` con pruebas de los casos límite del
      spec: token expirado → 401 (con un JWT de prueba de vida corta), usuario
      desactivado con sesión activa → 401, intentos de inyección SQL en campos de texto
      sin efecto (FR-015) y respuesta 500 genérica simulando MySQL no disponible
      (FR-020).
- [X] T065 [P] Verificar la seguridad del repositorio (FR-021): `.gitignore` contiene
      `.env`, no hay secretos en el código y `backend/.env.example` documenta todas las
      variables sin valores reales; documentar en `database/README.md` el usuario de
      MySQL dedicado (no `root`).
- [ ] T066 Ejecutar la guía `specs/001-base-usuarios-clientes/quickstart.md` completa
      (escenarios V1–V9) en el entorno de desarrollo y corregir cualquier desviación;
      verificar SC-001 a SC-007.
- [X] T067 [P] Actualizar `README.md` de la raíz con la estructura del proyecto, los
      comandos de instalación y arranque (backend, frontend, migraciones), las
      credenciales de desarrollo del semilla y la referencia a `quickstart.md`; toda la
      documentación en español.
- [X] T068 Revisar que no existen librerías de reconocimiento facial instaladas ni
      endpoints de membresías/pagos funcionales (FR-016, FR-026); las tablas
      `tipos_membresia`, `membresias` y `pagos` existen solo con estructura y claves.

---

## Dependencias y Orden de Ejecución

### Dependencias entre fases

- **Fase 1 (Configuración)**: sin dependencias; puede iniciarse de inmediato.
- **Fase 2 (Fundacional)**: depende de la Fase 1; BLOQUEA todas las historias.
- **Fase 3 (US1, P1)**: depende de la Fase 2; sin dependencias de otras historias.
- **Fase 4 (US2, P1)**: depende de la Fase 2 (autenticación/autorización). Usa el
  patrón de validadores/servicios que US1 ya estableció, pero archivos propios.
- **Fase 5 (US3, P2)**: depende de la Fase 2; amplía `usuario.model.js` creado en US1
  (T024) — por eso US1 debe completarse antes que US3.
- **Fase 6 (US4, P2)**: depende de US3 (usa `usuario.service.js` y `usuario.model.js`).
- **Fase 7 (US5, P2)**: depende de US2 (`cliente.model.js` y `cliente.service.js`).
- **Fase 8 (US6, P3)**: depende de US2 y compone bien con US5 (misma página de detalle).
- **Fase 9 (US7, P3)**: depende de US2 (modelo de clientes) y de US5 (ruta
  `/api/clientes/:id` ampliada).
- **Fase 10 (Pulido)**: depende de las historias que se deseen incluir en la entrega.

### Dependencias entre historias

- **US1 (P1)**: arranca tras la Fase 2; no depende de otras historias. ?? MVP.
- **US2 (P1)**: arranca tras la Fase 2; no depende de otras historias.
- **US3 (P2)**: arranca tras la Fase 2 + US1 (`usuario.model.js`).
- **US4 (P2)**: requiere US3.
- **US5 (P2)**: requiere US2.
- **US6 (P3)**: requiere US2.
- **US7 (P3)**: requiere US2 (+ US5 para la ruta con id).

### Dentro de cada historia

- Pruebas primero (verificar que fallan) → modelos → validadores → servicios →
  controladores/rutas → frontend.

### Oportunidades de paralelismo

- Todas las tareas marcadas [P] de la Fase 1 y Fase 2 (archivos distintos).
- Una vez completada la Fase 2, US1 y US2 pueden avanzar en paralelo (archivos
  distintos: auth vs clientes).
- Las pruebas de cada historia marcadas [P] pueden lanzarse juntas.
- Los modelos y validadores de una misma historia marcados [P] pueden ejecutarse en
  paralelo.

---

## Ejemplo de paralelismo: Historia de usuario 1

```bash
# Lanzar juntas las pruebas de US1 (T020–T022):
Tarea: "Prueba de contrato de auth en backend/tests/contract/auth.test.js"
Tarea: "Prueba de integración de auth en backend/tests/integration/auth.test.js"
Tarea: "Prueba de integración de autorización en backend/tests/integration/autorizacion.test.js"

# Tras decidir el diseño de pruebas, modelos y validador en paralelo (T023, T024):
Tarea: "Validador de auth en backend/src/validators/auth.validator.js"
Tarea: "Modelo de usuario en backend/src/models/usuario.model.js"
```

---

## Estrategia de Implementación

### MVP primero (solo Historia de usuario 1)

1. Completar Fase 1: Configuración.
2. Completar Fase 2: Fundacional (CRÍTICO; bloquea todo).
3. Completar Fase 3: Historia de usuario 1 (inicio de sesión).
4. **PARAR y VALIDAR**: probar US1 de forma independiente (quickstart V1 con el semilla
   administrador).
5. Demostrar/entregar si está listo.

### Entrega incremental

1. Configuración + Fundacional → base lista.
2. + US1 (login) → probar → MVP.
3. + US2 (registro de clientes) → probar → el gimnasio ya puede registrar clientes.
4. + US3 y US4 (usuarios y roles) → administración completa.
5. + US5 y US6 (consulta y modificación) → operación diaria completa.
6. + US7 (mi cuenta) → aislamiento de información del cliente verificado.
7. Pulido → quickstart completo, SC-001…SC-007 en verde.

### Estrategia de equipo en paralelo

1. El equipo completa Configuración + Fundacional.
2. Con la base lista:
   - Desarrollador A: US1 y US3 y US4 (cadena de usuarios).
   - Desarrollador B: US2 y US5 y US6 (cadena de clientes).
3. Ambas cadenas convergen en US7 y el pulido final.

---

## Notas

- [P] = archivos distintos, sin dependencias entre tareas.
- La etiqueta [Story] traza cada tarea a su historia de usuario.
- Cada historia puede completarse y probarse por separado; verificar que las pruebas
  fallan antes de implementar.
- Commit tras cada tarea o grupo lógico, siguiendo Conventional Commits en español.
- Verificar en cada historia la regla transversal: sin `DELETE` sobre `usuarios` ni
  `clientes`, sin `require`/`module.exports` en backend ni scripts de `database/`, y
  sin secretos en el repositorio.
