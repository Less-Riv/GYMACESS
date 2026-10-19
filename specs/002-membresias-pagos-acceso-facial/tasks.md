---

description: "Lista de tareas del Sprint 2: membresías, pagos, reconocimiento facial y control de acceso"
---

# Tareas: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Entrada**: Documentos de diseño de `/specs/002-membresias-pagos-acceso-facial/`

**Prerrequisitos**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Pruebas**: se incluyen tareas de prueba porque la especificación lo exige (FR-027, principio X de `docs/reglas.md`: las funciones deben probarse de extremo a extremo) y porque es la estrategia aprobada en el Sprint 1 (`node:test` + `supertest`).

**Organización**: las tareas están agrupadas por historia de usuario (US-S2-01 a US-S2-10 de `spec.md`) para permitir implementación y prueba independientes. Mapeo: US1=US-S2-01, US2=US-S2-02, US3=US-S2-03, US4=US-S2-04, US5=US-S2-05, US6=US-S2-06, US7=US-S2-07, US8=US-S2-08, US9=US-S2-09, US10=US-S2-10.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Historia]**: historia de usuario a la que pertenece la tarea
- Toda tarea indica la ruta exacta del archivo

## Convenciones de rutas

- Backend: `backend/src/` (rutas, controladores, servicios, modelos, middlewares, validators, utils)
- Pruebas: `backend/tests/contract/` e `backend/tests/integration/`
- Frontend: `frontend/src/` (pages, components, services, context)
- Base de datos: `database/migrations/`, `database/seeds/`

---

## Fase 1: Preparación (infraestructura compartida)

**Propósito**: dependencias y configuración inicial que comparten todas las historias

- [x] T001 [P] Instalar `@vladmandic/face-api` en `frontend/package.json` y copiar los pesos del modelo a `frontend/public/modelos-faciales/` desde `node_modules/@vladmandic/face-api/model/` (research.md §1)
- [x] T002 [P] Agregar `FACIAL_UMBRAL=0.5` a `backend/.env.example` y leerla en `backend/src/config/entorno.js` con valor por defecto 0.5 (research.md §3)
- [x] T003 [P] Crear `database/seeds/seed-datos-sprint2.sql` con tipos de membresía de ejemplo (Mensual 30 días 500.00, Trimestral 90 días 1350.00) para las pruebas

---

## Fase 2: Fundacional (prerrequisitos bloqueantes)

**Propósito**: infraestructura que DEBE estar lista antes de cualquier historia de usuario

**?? CRÍTICO**: no puede comenzar ninguna historia hasta completar esta fase

- [x] T004 Crear `database/migrations/002_crear_tablas_sprint2.sql` con las tablas `rostros`, `accesos` y `auditoria` (InnoDB, `utf8mb4`, claves primarias y foráneas, integridad referencial; descriptor `TEXT` NOT NULL en `rostros`, índice único `id_cliente` en `rostros`, `motivo` obligatorio cuando `resultado = 'rechazado'` en `accesos`) y el ajuste `ALTER TABLE pagos MODIFY id_membresia BIGINT NOT NULL` (data-model.md)
- [x] T005 [P] Crear `backend/src/models/auditoria.model.js` con inserción y consulta (campos: usuario, acción, módulo, fecha, resultado, descripción; `docs/project-context.md` §7.10)
- [x] T006 [P] Crear `backend/src/services/auditoria.service.js` con `registrarAccion()` usada por membresías, pagos, rostros y accesos; las descripciones nunca contienen datos biométricos (FR-016, research.md §6)
- [x] T007 Ampliar `backend/tests/ayuda/base-pruebas.js` con la limpieza y preparación de las tablas nuevas (`rostros`, `accesos`, `auditoria`) y de `pagos`, `membresias` y `tipos_membresia` para las pruebas

**Punto de control**: base lista: migración aplicable, auditoría utilizable y auxiliar de pruebas preparado

---

## Fase 3: Historia de usuario 1 - Registro de tipos de membresía (Prioridad: P1) ?? MVP

**Objetivo**: el administrador crea y modifica tipos de membresía con nombre, duración y precio

**Prueba independiente**: como administrador, crear un tipo "Mensual" (30 días, 500.00) y verificar que aparece en el listado; con recepcionista/entrenador/cliente la operación responde 403 (US-S2-01)

### Pruebas para la Historia 1

> **NOTA: escribir estas pruebas PRIMERO y verificar que fallan antes de la implementación**

- [x] T008 [P] [US1] Prueba de contrato de `GET/POST/PUT /api/tipos-membresia` (201 en alta, 400 sin nombre o duración 0, 403 por rol) en `backend/tests/contract/tipos-membresia.test.js`
- [x] T009 [P] [US1] Prueba de integración de alta y modificación de tipos (persistencia, cambio de precio conserva la relación con membresías existentes, rechazos por rol) en `backend/tests/integration/tipos-membresia.test.js`

### Implementación para la Historia 1

- [x] T010 [P] [US1] Crear `backend/src/models/tipo-membresia.model.js` (listar, crear, obtener por id, actualizar; motor de consultas parametrizadas sobre el pool existente)
- [x] T011 [P] [US1] Crear `backend/src/validators/tipo-membresia.validator.js` (nombre obligatorio no vacío, duración en días mayor que 0, precio mayor o igual que 0; FR-001)
- [x] T012 [US1] Crear `backend/src/services/tipo-membresia.service.js` con las operaciones del módulo (depende de T010, T011)
- [x] T013 [US1] Crear `backend/src/controllers/tipos-membresia.controller.js` con las respuestas usando `backend/src/utils/respuestas.js`
- [x] T014 [US1] Crear `backend/src/routes/tipos-membresia.routes.js` (solo rol administrador con `autenticar` y `autorizar`) y montarla en `backend/src/app.js` con prefijo `/api/tipos-membresia`
- [x] T015 [P] [US1] Crear `frontend/src/pages/TiposMembresia.jsx` con alta y modificación de tipos, mensajes de éxito y error (contrato `contracts/api-membresias.md`)
- [x] T016 [US1] Ampliar `frontend/src/services/api.js` con las funciones de tipos de membresía y registrar la ruta en `frontend/src/App.jsx` (protegida al administrador)

**Punto de control**: la gestión de tipos de membresía funciona y se prueba de forma independiente

---

## Fase 4: Historia de usuario 2 - Asignación de membresía (Prioridad: P1)

**Objetivo**: administrador y recepcionista asignan una membresía a un cliente con fechas calculadas

**Prueba independiente**: como recepcionista, asignar una membresía de 30 días a un cliente registrado y verificar estado activo con fechas calculadas; una segunda membresía activa se rechaza (US-S2-02)

### Pruebas para la Historia 2

- [x] T017 [P] [US2] Prueba de contrato de `POST /api/membresias` (201 con fechas calculadas, 400 cliente/tipo inexistentes, 409 segunda membresía activa, 403 por rol) en `backend/tests/contract/membresias.test.js`
- [x] T018 [P] [US2] Prueba de integración de asignación (fecha fin = inicio + duración, rechazo con fechas invertidas RN-03, rechazo a cliente inactivo, única activa por cliente FR-005) en `backend/tests/integration/membresias-asignacion.test.js`

### Implementación para la Historia 2

- [x] T019 [P] [US2] Crear `backend/src/models/membresia.model.js` (crear, listar por cliente, obtener por id, cálculo del estado efectivo: estado almacenado `activo` con `fecha_fin` anterior a hoy ⇒ `vencida` al consultar; FR-004)
- [x] T020 [P] [US2] Crear `backend/src/validators/membresia.validator.js` (cliente y tipo requeridos, `fecha_fin` no puede ser anterior a `fecha_inicio`; RN-01, RN-02, RN-03)
- [x] T021 [US2] Crear `backend/src/services/membresia.service.js` con `asignarMembresia()` (verifica cliente y tipo válidos y activos, calcula `fecha_fin = fecha_inicio + duración del tipo`, rechaza con 409 si ya existe membresía activa del cliente, registra auditoría; depende de T019, T020, T006)
- [x] T022 [US2] Crear `backend/src/controllers/membresias.controller.js` con las respuestas del contrato `contracts/api-membresias.md`
- [x] T023 [US2] Crear `backend/src/routes/membresias.routes.js` (administrador y recepcionista) y montarla en `backend/src/app.js` con prefijo `/api/membresias`
- [x] T024 [P] [US2] Crear `frontend/src/components/ModalConfirmacion.jsx` para confirmaciones de acciones sensibles (principio XI)
- [x] T025 [P] [US2] Crear `frontend/src/pages/Membresias.jsx` con el formulario de asignación (cliente, tipo, fecha de inicio) y el listado de membresías
- [x] T026 [US2] Ampliar `frontend/src/services/api.js` con las funciones de asignación y registrar la ruta protegida a administrador y recepcionista en `frontend/src/App.jsx`

**Punto de control**: la asignación de membresías funciona y se prueba de forma independiente

---

## Fase 5: Historia de usuario 6 - Registro de información facial (Prioridad: P1)

**Objetivo**: administrador y recepcionista registran el descriptor facial de un cliente con la cámara

**Prueba independiente**: con un cliente registrado y una cámara compatible, capturar el rostro y verificar que el estado del registro queda "completo" y que la consulta no expone datos biométricos (US-S2-06)

### Pruebas para la Historia 6

- [x] T027 [P] [US6] Prueba de contrato de `POST/GET /api/rostros/:idCliente` (201 al crear, 200 al actualizar, 400 descriptor sin 128 valores, 404 cliente inexistente, 403 por rol) en `backend/tests/contract/rostros.test.js`
- [x] T028 [P] [US6] Prueba de integración del registro facial (un registro por cliente sin duplicados, actualización al volver a capturar, 409 a cliente inactivo, la respuesta nunca incluye el descriptor) en `backend/tests/integration/rostros.test.js`

### Implementación para la Historia 6

- [x] T029 [P] [US6] Crear `backend/src/models/rostro.model.js` (upsert por `id_cliente` con índice único; el `descriptor` TEXT no se incluye nunca en las consultas de respuesta; FR-017)
- [x] T030 [P] [US6] Crear `backend/src/validators/rostro.validator.js` (descriptor: arreglo de exactamente 128 valores numéricos; cliente requerido)
- [x] T031 [US6] Crear `backend/src/services/rostro.service.js` con registrar/actualizar y consulta de estado (completo/pendiente), con auditoría sin datos biométricos (depende de T029, T030, T006)
- [x] T032 [US6] Crear `backend/src/controllers/rostros.controller.js` y `backend/src/routes/rostros.routes.js` (administrador y recepcionista), montada en `backend/src/app.js` con prefijo `/api/rostros`
- [x] T033 [P] [US6] Crear `frontend/src/components/CapturaFacial.jsx` (getUserMedia con `facingMode: 'user'`, vista previa, captura en `<canvas>`, cálculo del descriptor con `@vladmandic/face-api` y los pesos locales; luz frontal sin contraluz; FR-025)
- [x] T034 [US6] Ampliar `frontend/src/pages/ClienteDetalle.jsx` con la sección de registro facial que usa `CapturaFacial.jsx` y envía el descriptor
- [x] T035 [US6] Ampliar `frontend/src/services/api.js` con las funciones de rostros

**Punto de control**: el registro facial funciona de extremo a extremo con la cámara

---

## Fase 6: Historia de usuario 4 - Registro de pagos (Prioridad: P2)

**Objetivo**: administrador y recepcionista registran pagos asociados a la membresía del cliente

**Prueba independiente**: registrar un pago en efectivo por la membresía de un cliente y verificar que queda asociado al cliente y a la membresía, y que aparece en el historial (US-S2-04)

### Pruebas para la Historia 4

- [x] T036 [P] [US4] Prueba de contrato de `POST /api/pagos` (201 con fecha del servidor, 400 monto menor o igual que 0 o método fuera del catálogo, 409 membresía de otro cliente, 403 por rol) en `backend/tests/contract/pagos.test.js`
- [x] T037 [P] [US4] Prueba de integración de pagos (historial cronológico, RN-05 membresía del mismo cliente, no existe operación de eliminación) en `backend/tests/integration/pagos.test.js`

### Implementación para la Historia 4

- [x] T038 [P] [US4] Crear `backend/src/models/pago.model.js` (insertar y listar por cliente; sin sentencias DELETE sobre `pagos`; RN-06)
- [x] T039 [P] [US4] Crear `backend/src/validators/pago.validator.js` (monto mayor que 0, método de pago en el catálogo cerrado `efectivo` o `transferencia`; FR-020, clarificación Q2)
- [x] T040 [US4] Crear `backend/src/services/pago.service.js` con `registrarPago()` (verifica la relación cliente-membresía antes de persistir y responde 409 `PAGO_MEMBRESIA_AJENA`, auditoría; depende de T038, T039, T006)
- [x] T041 [US4] Crear `backend/src/controllers/pagos.controller.js` y `backend/src/routes/pagos.routes.js` (administrador y recepcionista), montada en `backend/src/app.js` con prefijo `/api/pagos`
- [x] T042 [P] [US4] Crear `frontend/src/pages/Pagos.jsx` con el formulario de registro de pago (monto, método efectivo o transferencia, membresía del cliente)
- [x] T043 [US4] Ampliar `frontend/src/services/api.js` con las funciones de pagos y registrar la ruta protegida en `frontend/src/App.jsx`

**Punto de control**: los pagos se registran y se prueban de forma independiente

---

## Fase 7: Historia de usuario 7 - Identificación mediante reconocimiento facial (Prioridad: P2)

**Objetivo**: el punto de acceso identifica al cliente por su rostro comparando descriptores

**Prueba independiente**: con un cliente con descriptor registrado, presentar su rostro y verificar que el sistema lo identifica por nombre; con un rostro no registrado no identifica a nadie (US-S2-07)

### Pruebas para la Historia 7

- [x] T044 [P] [US7] Prueba de contrato de `POST /api/accesos/identificar` (200 identificado, 200 no identificado con motivo, 400 descriptor inválido, 403 por rol) en `backend/tests/contract/accesos.test.js`
- [x] T045 [P] [US7] Prueba de integración de identificación (descriptor registrado identifica, desconocido responde `identificacion_no_reconocida`, reintentos ilimitados siempre registrados) en `backend/tests/integration/identificacion.test.js`

### Implementación para la Historia 7

- [x] T046 [P] [US7] Crear `backend/src/models/acceso.model.js` (insertar intentos con fecha, hora, resultado y motivo; consultar descriptores activos de `rostros` para la comparación; sin DELETE; FR-014)
- [x] T047 [US7] Crear `backend/src/services/acceso-facial.service.js` con `identificarDescriptor()` (distancia euclidiana ponderada contra los descriptores registrados, umbral `FACIAL_UMBRAL` 0.5 por defecto; si la menor distancia supera el umbral no identifica; depende de T046, T002)
- [x] T048 [US7] Crear `backend/src/controllers/accesos.controller.js` con la acción identificar y `backend/src/routes/accesos.routes.js` con `POST /api/accesos/identificar` (administrador y recepcionista)
- [x] T049 [US7] Crear `frontend/src/pages/PuntoAcceso.jsx` que usa `CapturaFacial.jsx`, muestra el resultado y, si no se reconoce, el mensaje "No se reconoció tu rostro. Intenta de nuevo o consulta al personal." con reintentos sin límite (FR-011)
- [x] T050 [US7] Ampliar `frontend/src/services/api.js` con la función de identificación y registrar la ruta protegida en `frontend/src/App.jsx`

**Punto de control**: la identificación facial funciona y se prueba de forma independiente

---

## Fase 8: Historia de usuario 8 - Validación de acceso (Prioridad: P2)

**Objetivo**: tras identificar, validar la membresía y autorizar o rechazar registrando siempre el intento

**Prueba independiente**: con un cliente identificado, probar los cuatro estados de membresía y verificar que solo la activa autoriza y que los cuatro quedan registrados en `accesos` (US-S2-08)

### Pruebas para la Historia 8

- [x] T051 [P] [US8] Prueba de integración de validación de acceso (activa y vigente autoriza; vencida, suspendida, cancelada o inexistente rechazan con su motivo; sin identificación exitosa no valida RN-09; todo intento genera registro RN-10) en `backend/tests/integration/accesos-validacion.test.js`

### Implementación para la Historia 8

- [x] T052 [US8] Ampliar `backend/src/services/acceso-facial.service.js` con `validarAcceso()` (la validación de membresía solo ocurre tras identificación exitosa; autoriza solo con membresía activa y vigente sin tolerancia; rechaza con motivos `membresia_vencida`, `membresia_suspendida`, `membresia_cancelada`, `membresia_inexistente`; FR-012, FR-013)
- [x] T053 [US8] Registrar cada resultado del control de acceso en `auditoria` desde `backend/src/services/acceso-facial.service.js` (FR-016)
- [x] T054 [US8] Ampliar `frontend/src/pages/PuntoAcceso.jsx` con los estados de resultado autorizado/rechazado, el motivo y el nombre del cliente cuando aplique

**Punto de control**: el flujo completo identificar → validar → autorizar o rechazar → registrar funciona

---

## Fase 9: Historia de usuario 3 - Renovación de membresía (Prioridad: P3)

**Objetivo**: administrador y recepcionista renuevan una membresía extendiendo su vigencia

**Prueba independiente**: renovar una membresía activa y verificar que la fecha de finalización se extiende según el tipo elegido (US-S2-03)

### Pruebas para la Historia 3

- [x] T055 [P] [US3] Prueba de contrato de `PUT /api/membresias/:id/renovar` (200 con nueva fecha, 409 suspendida o cancelada, 404 inexistente, 403 por rol) en `backend/tests/contract/membresias.test.js`
- [x] T056 [P] [US3] Prueba de integración de renovación (activa y vencida extienden la vigencia, suspendida o cancelada se rechaza con mensaje claro) en `backend/tests/integration/membresias-renovacion.test.js`

### Implementación para la Historia 3

- [x] T057 [US3] Ampliar `backend/src/services/membresia.service.js` con `renovarMembresia()` (fecha_fin nueva = fecha_fin actual + duración del tipo elegido; estados renovables activo y vencido; suspendida o cancelada responden 409; auditoría; FR-005, clarificación Q1)
- [x] T058 [US3] Ampliar `backend/src/controllers/membresias.controller.js` y `backend/src/routes/membresias.routes.js` con `PUT /:id/renovar`
- [x] T059 [US3] Ampliar `frontend/src/pages/Membresias.jsx` con la acción de renovación y `ModalConfirmacion.jsx` para confirmarla
- [x] T060 [US3] Ampliar `frontend/src/services/api.js` con la función de renovación

**Punto de control**: la renovación funciona y se prueba de forma independiente

---

## Fase 10: Historia de usuario 5 - Consulta de pagos y adeudos (Prioridad: P3)

**Objetivo**: el administrador consulta el historial de pagos y el saldo pendiente de cada cliente

**Prueba independiente**: con un cliente cuyo pago no cubre el precio completo, consultar los adeudos y verificar que muestra el saldo pendiente (US-S2-05)

### Pruebas para la Historia 5

- [x] T061 [P] [US5] Prueba de integración de consulta de pagos y adeudos (saldo = precio vigente − suma de pagos, 403 a recepcionista, entrenador y cliente en la vista de adeudos) en `backend/tests/integration/adeudos.test.js`

### Implementación para la Historia 5

- [x] T062 [US5] Ampliar `backend/src/services/pago.service.js` con `consultarAdeudos()` (precio vigente del tipo de la membresía del cliente menos la suma de sus pagos registrados, nunca negativo; FR-007, clarificación Q2)
- [x] T063 [US5] Ampliar `backend/src/controllers/pagos.controller.js` y `backend/src/routes/pagos.routes.js` con `GET /api/pagos/adeudos` (solo administrador)
- [x] T064 [US5] Ampliar `frontend/src/pages/Pagos.jsx` con la vista de adeudos por cliente

**Punto de control**: la consulta financiera del administrador funciona

---

## Fase 11: Historia de usuario 9 - Consulta de accesos (Prioridad: P3)

**Objetivo**: administrador y recepcionista consultan los registros con filtros; el entrenador una vista básica

**Prueba independiente**: tras varios intentos, consultar el listado como recepcionista y verificar que aparecen todos con resultado y motivo (US-S2-09)

### Pruebas para la Historia 9

- [x] T065 [P] [US9] Prueba de integración de consulta de accesos (filtros por fecha y resultado, vista básica del entrenador sin motivos, cliente recibe 403 en el listado general, sin operación de eliminación) en `backend/tests/integration/accesos-consulta.test.js`

### Implementación para la Historia 9

- [x] T066 [US9] Ampliar `backend/src/models/acceso.model.js` con la consulta paginada con filtros de fecha, resultado y cliente
- [x] T067 [US9] Ampliar `backend/src/controllers/accesos.controller.js` y `backend/src/routes/accesos.routes.js` con `GET /api/accesos` (administrador y recepcionista), `GET /api/accesos/basicos` (entrenador, campos cliente, fecha, hora y resultado) y `GET /api/accesos/mis-accesos` (cliente, solo los propios; FR-015, FR-028)
- [x] T068 [P] [US9] Crear `frontend/src/pages/Accesos.jsx` con el listado y los filtros de fecha y resultado para administrador y recepcionista, y la vista reducida para entrenador
- [x] T069 [US9] Ampliar `frontend/src/services/api.js` con las funciones de consulta de accesos y registrar la ruta protegida en `frontend/src/App.jsx`

**Punto de control**: la consulta de accesos por rol funciona

---

## Fase 12: Historia de usuario 10 - Mis datos: membresía, pagos, adeudos y accesos (Prioridad: P3)

**Objetivo**: el cliente ve en "Mi cuenta" su propia información, sin acceso a datos de terceros

**Prueba independiente**: iniciar sesión como cliente con membresía, pagos y accesos, y verificar que "Mi cuenta" muestra todo; otro cliente no puede ver esos datos (US-S2-10)

### Pruebas para la Historia 10

- [x] T070 [P] [US10] Prueba de integración de "Mi cuenta" (membresía con días restantes y estado, pagos propios, adeudo con la fórmula FR-007, accesos propios; 403 sobre datos de otro cliente; mensaje claro sin membresía; estado "al_corriente" sin adeudo) en `backend/tests/integration/mi-cuenta-sprint2.test.js`

### Implementación para la Historia 10

- [x] T071 [P] [US10] Crear `backend/src/models/mi-cuenta.model.js` con las consultas propias del cliente (membresía efectiva, pagos, suma de pagos y accesos), siempre filtradas por el cliente del token (FR-028)
- [x] T072 [US10] Crear `backend/src/services/mi-cuenta.service.js` que compone la información propia (membresía con días restantes y estado efectivo, historial de pagos, adeudo y accesos; depende de T071)
- [x] T073 [US10] Crear `backend/src/controllers/mi-cuenta-sprint2.controller.js` y `backend/src/routes/mi-cuenta-sprint2.routes.js` (solo rol cliente), montada en `backend/src/app.js` con prefijo `/api/mi-cuenta` según el contrato `contracts/api-mi-cuenta.md`
- [x] T074 [US10] Ampliar `frontend/src/pages/MiCuenta.jsx` con las secciones de membresía (con días restantes y estado), pagos, adeudo y accesos
- [x] T075 [US10] Ampliar `frontend/src/services/api.js` con las funciones de mi cuenta

**Punto de control**: las vistas propias del cliente funcionan y se prueban de forma independiente

---

## Fase 13: Auditoría y pulido transversal

**Propósito**: mejoras que afectan a varias historias

- [x] T076 [P] Crear `backend/tests/contract/auditoria.test.js` (solo administrador consulta; 403 a los demás roles) en `backend/tests/contract/auditoria.test.js`
- [x] T077 Crear `backend/src/controllers/auditoria.controller.js` y `backend/src/routes/auditoria.routes.js` con `GET /api/auditoria` (solo administrador, con filtros opcionales de fecha y módulo), montada en `backend/src/app.js` (contrato `contracts/api-auditoria.md`)
- [x] T078 [P] Ampliar `backend/tests/integration/autorizacion.test.js` y `backend/tests/integration/roles.test.js` con la matriz de permisos completa del Sprint 2 (todos los endpoints nuevos y el 403 correspondiente)
- [x] T079 Revisar `frontend/src/App.jsx` y verificar que todas las rutas nuevas están protegidas por rol con `RutaProtegida.jsx`, con navegación consistente (principio XI)
- [x] T080 Ejecutar `npm test` en `backend/` y verificar que todas las pruebas pasan sin regresiones del Sprint 1 (FR-026); ejecutar `npm run build` en `frontend/` y verificar que compila sin errores
- [x] T081 Ejecutar la validación de extremo a extremo de `specs/002-membresias-pagos-acceso-facial/quickstart.md` (flujo completo SC-009: crear tipo → asignar membresía → registrar pago → registrar rostro → identificar → validar → registrar acceso → revisar Mi cuenta)
- [x] T082 [P] Actualizar `README.md` y `database/README.md` con las tablas nuevas y el flujo del Sprint 2; verificar que `spec.md` no tiene marcadores pendientes

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Preparación (Fase 1)**: sin dependencias; puede comenzar de inmediato
- **Fundacional (Fase 2)**: depende de la Preparación; BLOQUEA todas las historias
- **Historias (Fases 3-12)**: todas dependen del Fundacional; entre ellas:
  - **US1 (tipos)** bloquea a **US2 (asignación)**: no se asigna membresía sin tipos
  - **US2 (membresías)** bloquea a **US4 (pagos)**, **US8 (validación)** y **US10 (mis datos)**
  - **US6 (registro facial)** es independiente de US1-US5; puede ejecutarse en paralelo
  - **US7 (identificación)** depende de **US6** (rostros registrados)
  - **US8 (validación)** depende de **US7** (identificación exitosa) y **US2** (membresías)
  - **US3 (renovación)** depende de **US2**
  - **US5 (adeudos)** depende de **US4** (pagos registrados)
  - **US9 (consulta de accesos)** depende de **US7/US8** (registros de acceso)
  - **US10 (mis datos)** depende de **US2, US4 y US9**
- **Auditoría y pulido (Fase 13)**: depende de las historias deseadas

### Orden sugerido (por prioridad)

P1: US1 → US2 → US6 | P2: US4 → US7 → US8 | P3: US3 → US5 → US9 → US10

### Oportunidades de paralelismo

- Preparación: T001, T002 y T003 en paralelo
- Fundacional: T005 y T006 en paralelo (tras T004)
- Dentro de cada historia: pruebas en paralelo; modelos y validadores en paralelo
- Historias paralelas tras Fundacional: US1 y US6 pueden avanzar a la vez (no comparten archivos)
- Con equipo distribuido: un desarrollador en P1 (US1-US2-US6), otro en P2 (US4-US7-US8)

## Estrategia de implementación

### MVP primero (Historia 1)

1. Completar Preparación y Fundacional
2. Completar la Historia 1 (tipos de membresía)
3. **PARAR y VALIDAR**: probar la Historia 1 de forma independiente
4. Demostrar si está listo

### Entrega incremental

1. Preparación + Fundacional → base lista
2. US1 + US2 + US6 (P1) → administración y registro facial operativos
3. US4 + US7 + US8 (P2) → pagos y el flujo distintivo del sprint: identificar → validar → registrar
4. US3 + US5 + US9 + US10 (P3) → renovación, finanzas, consulta de accesos y vistas del cliente
5. Fase 13 → auditoría, pulido y validación de extremo a extremo

## Notas

- Las pruebas se escriben antes de la implementación de cada historia y deben fallar primero
- Se hace commit por tarea o grupo lógico (convención de commits en `AGENTS.md`)
- No se reimplementa nada del Sprint 1 (FR-026); los módulos existentes solo se amplían
- Los identificadores y comentarios del código permanecen en inglés; los mensajes visibles en español (`AGENTS.md`)
