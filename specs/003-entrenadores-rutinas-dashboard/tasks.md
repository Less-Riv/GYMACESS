# Tasks: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Input**: Design documents from `/specs/003-entrenadores-rutinas-dashboard/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: SÍ se incluyen tareas de pruebas: el spec lo exige (FR-031), la constitución lo
exige (principio X) y el plan define la estrategia (`node:test` + `supertest`, misma
infraestructura de los Sprints 1 y 2).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `database/`
- Rutas con exactitud según [contracts/api-entrenadores-asignaciones.md](./contracts/api-entrenadores-asignaciones.md),
  [contracts/api-rutinas-progreso.md](./contracts/api-rutinas-progreso.md) y
  [contracts/api-dashboard.md](./contracts/api-dashboard.md)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparación mínima compartida antes de tocar la base de datos o los módulos

- [X] T001 [P] Actualizar la versión y la descripción del backend a Sprint 3 en backend/package.json (sin tocar `"type": "module"`)
- [X] T002 [P] Registrar en frontend/src/services/api.js los consumos nuevos del sprint (entrenadores, asignaciones, personal, rutinas, objetivos, progresos, mi-entrenamiento, dashboard) siguiendo el patrón existente del archivo

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: estructura de información compartida; SIN esto ninguna historia puede empezar

**?? CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Crear database/migrations/003_crear_tablas_sprint3.sql con las tablas `entrenadores`, `asignaciones_entrenador`, `rutinas`, `ejercicios_rutina`, `objetivos_entrenamiento` y `progresos_clientes` según data-model.md: motor InnoDB, `utf8mb4`, claves foráneas con integridad referencial; `entrenadores.id_usuario` **ÚNICO** (RN-15); `ejercicios_rutina` con `ON DELETE CASCADE` sobre `rutinas`; índices `ix_asignaciones_cliente_estado`, `ix_rutinas_cliente_estado` y `ix_progresos_clientes_fecha`; SIN tocar las tablas de los Sprints 1 y 2
- [ ] T004 Aplicar la migración en la base local y en la base de pruebas ejecutando `node database/scripts/ejecutar-migraciones.js` y verificando que las seis tablas quedan creadas
- [X] T005 [P] Crear database/seeds/seed-datos-sprint3.sql con un usuario de prueba con rol `entrenador` (contraseña con hash bcrypt) y dos clientes de ejemplo, idempotente al estilo de seeds/seed-datos-sprint2.sql

**Checkpoint**: base de datos del sprint lista; las historias pueden empezar en paralelo

---

## Phase 3: User Story 1 - Registro de entrenadores (Priority: P1) ?? MVP

**Goal**: el administrador registra, consulta y modifica entrenadores asociados a cuentas con rol `entrenador` (US-S3-01)

**Independent Test**: iniciar sesión como administrador, registrar un entrenador con una cuenta válida de rol `entrenador` y verificar que aparece en el listado; comprobar 400 `USUARIO_INVALIDO`, 409 `USUARIO_YA_ASOCIADO` y 403 para los demás roles

### Tests for User Story 1

- [X] T006 [P] [US1] Prueba de contrato para `GET/POST/PUT /api/entrenadores` (matriz de permisos, `USUARIO_INVALIDO`, `USUARIO_YA_ASOCIADO`) en backend/tests/contract/entrenadores.test.js
- [X] T007 [P] [US1] Prueba de integración de la historia US-S3-01 (alta, consulta, modificación y 403 por rol) en backend/tests/integration/entrenadores-us-s3-01.test.js

### Implementation for User Story 1

- [X] T008 [P] [US1] Crear el validador del módulo en backend/src/validators/entrenador.validator.js (id_usuario presente y entero; nombre no vacío y hasta 80 caracteres; teléfono y correo de contacto opcionales; estado solo en `activo`/`inactivo`)
- [X] T009 [P] [US1] Crear el modelo en backend/src/models/entrenador.model.js con consultas parametrizadas (listar con carga de clientes, buscar por id, buscar por id_usuario, insertar y actualizar)
- [X] T010 [US1] Crear el servicio en backend/src/services/entrenador.service.js: validar que la cuenta existe, está activa y tiene rol `entrenador`, y que no esté ya asociada a otro entrenador (RN-15, FR-002)
- [X] T011 [US1] Crear el controlador en backend/src/controllers/entrenadores.controller.js con los códigos HTTP del contrato (201, 400, 403, 404, 409)
- [X] T012 [US1] Crear las rutas en backend/src/routes/entrenadores.routes.js con `autenticar` y `autorizar` (POST/PUT solo administrador; GET administrador y recepcionista) y montarlas en backend/src/app.js como `/api/entrenadores`
- [X] T013 [P] [US1] Crear la página frontend/src/pages/Entrenadores.jsx (listado con carga, formulario de alta y modificación, mensajes de éxito y error) y registrarla como ruta protegida para administrador en frontend/src/App.jsx
- [ ] T014 [US1] Ejecutar `npm test` en backend/ y dejar en verde las pruebas de US1

**Checkpoint**: US1 funcional y verificable de forma independiente

---

## Phase 4: User Story 2 - Asignación de entrenador a cliente (Priority: P1)

**Goal**: administrador o recepcionista asignan y reasignan un entrenador a un cliente, con histórico y una sola asignación activa por cliente (US-S3-02)

**Independent Test**: como recepcionista, asignar un entrenador a un cliente activo; verificar 409 al asignar un segundo, que la reasignación cierra la anterior con fecha, y que el entrenador desplazado pierde acceso (403)

### Tests for User Story 2

- [X] T015 [P] [US2] Prueba de contrato para `POST /api/asignaciones` y `PUT /api/asignaciones/:id` (201, 400 `CLIENTE_INACTIVO`/`ENTRENADOR_INACTIVO`, 409 `ASIGNACION_ACTIVA_EXISTENTE`, 403 por rol) en backend/tests/contract/asignaciones.test.js
- [X] T016 [P] [US2] Prueba de integración de la historia US-S3-02 (asignación, reasignación con cierre, pérdida de acceso del entrenador anterior) en backend/tests/integration/asignaciones-us-s3-02.test.js

### Implementation for User Story 2

- [X] T017 [P] [US2] Crear el modelo en backend/src/models/asignacion.model.js con consultas parametrizadas (buscar asignación activa por cliente con `SELECT ... FOR UPDATE`, insertar, cerrar, listar con filtros)
- [X] T018 [US2] Crear el validador en backend/src/validators/asignacion.validator.js (id_cliente e id_entrenador obligatorios; fecha_asignacion opcional en formato ISO)
- [X] T019 [US2] Crear el servicio en backend/src/services/asignacion.service.js: transacción con bloqueo de la fila del cliente; 409 si ya hay asignación activa (RN-16); reasignación que cierra la anterior con `fecha_fin` = hoy (FR-004); rechazar clientes o entrenadores inexistentes o inactivos (RN-01, RN-15); auditoría `asignar_entrenador` y `reasignar_entrenador` del módulo `asignaciones` mediante backend/src/services/auditoria.service.js (FR-020)
- [X] T020 [US2] Ampliar backend/src/services/entrenador.service.js para cerrar en la misma transacción las asignaciones activas del entrenador al pasar `estado = 'inactivo'` (FR-001, investigación §6)
- [X] T021 [US2] Crear el controlador en backend/src/controllers/asignaciones.controller.js y las rutas en backend/src/routes/asignaciones.routes.js (POST y PUT para administrador y recepcionista; GET para administrador, recepcionista y entrenador con filtro propio) y montarlas en backend/src/app.js como `/api/asignaciones`
- [X] T022 [P] [US2] Crear el componente frontend/src/components/AsignarEntrenador.jsx (alta y reasignación con confirmación mediante frontend/src/components/ModalConfirmacion.jsx) y usarlo en frontend/src/pages/ClienteDetalle.jsx
- [ ] T023 [US2] Ejecutar `npm test` en backend/ y dejar en verde las pruebas de US2 sin romper US1

**Checkpoint**: asignación y reasignación operativas con histórico

---

## Phase 5: User Story 3 - Creación de rutinas de entrenamiento (Priority: P2)

**Goal**: el entrenador crea y modifica rutinas con ejercicios para sus clientes asignados, con una única rutina activa por cliente (US-S3-03)

**Independent Test**: como entrenador con un cliente asignado, crear una rutina con tres ejercicios válidos; verificar 403 para un cliente ajeno a su carga, 400 para ejercicios sin series, repeticiones ni instrucciones, y que la rutina anterior queda `finalizada`

### Tests for User Story 3

- [X] T024 [P] [US3] Prueba de contrato para `GET/POST/PUT /api/rutinas` y `PUT /api/rutinas/:id/ejercicios` (201, 400 `VALIDACION` de RN-18, 403 `AUTORIZACION`) en backend/tests/contract/rutinas.test.js
- [X] T025 [P] [US3] Prueba de integración de la historia US-S3-03 (rutina con ejercicios, única activa, modificación sin tocar progresos) en backend/tests/integration/rutinas-us-s3-03.test.js

### Implementation for User Story 3

- [X] T026 [P] [US3] Crear los modelos en backend/src/models/rutina.model.js y backend/src/models/ejercicio-rutina.model.js con consultas parametrizadas (listar con ejercicios por rutina, insertar, actualizar, finalizar la activa del cliente, reemplazar ejercicios)
- [X] T027 [US3] Crear el validador en backend/src/validators/rutina.validator.js: nombre no vacío y hasta 80 caracteres; lista de ejercicios no vacía; en cada ejercicio al menos uno de `series` (> 0), `repeticiones` o `instrucciones` con valor (RN-18, FR-008)
- [X] T028 [US3] Crear el servicio en backend/src/services/rutina.service.js: comprobar la asignación activa del cliente con el entrenador autenticado (RN-19, 403); transacción que finaliza la rutina activa anterior al crear una nueva (FR-009); auditoría `crear_rutina` y `modificar_rutina` del módulo `rutinas` (FR-020)
- [X] T029 [US3] Crear el controlador en backend/src/controllers/rutinas.controller.js y las rutas en backend/src/routes/rutinas.routes.js (GET para administrador, recepcionista y entrenador filtrando la carga; POST/PUT solo entrenador de su carga) y montarlas en backend/src/app.js como `/api/rutinas`
- [X] T030 [P] [US3] Crear los componentes frontend/src/components/RutinaForm.jsx y frontend/src/components/EjercicioForm.jsx (alta y edición de rutina con lista de ejercicios reordenables)
- [X] T031 [US3] Crear la página frontend/src/pages/Rutinas.jsx (listado y detalle de rutinas con sus ejercicios), registrarla en frontend/src/App.jsx y enlazarla desde frontend/src/pages/ClienteDetalle.jsx
- [ ] T032 [US3] Ejecutar `npm test` en backend/ y dejar en verde las pruebas de US3 sin romper US1 ni US2

**Checkpoint**: el entrenador puede operar rutinas de su carga de forma independiente

---

## Phase 6: User Story 4 - Registro de objetivos y progresos (Priority: P2)

**Goal**: el entrenador registra objetivos y progresos históricos de sus clientes (US-S3-04)

**Independent Test**: como entrenador, registrar un objetivo y dos progresos (uno con peso y medidas y otro solo con fecha y comentario); verificar que quedan en el histórico ordenado, que no se pueden modificar ni eliminar, y que un cliente ajeno a la carga devuelve 403

### Tests for User Story 4

- [X] T033 [P] [US4] Prueba de contrato para `POST/GET/PUT /api/objetivos` y `POST/GET /api/progresos` (201, 400 `VALIDACION`, 403, y la inexistencia de PUT/DELETE de progresos) en backend/tests/contract/progresos.test.js
- [X] T034 [P] [US4] Prueba de integración de la historia US-S3-04 (objetivo, cierre al cumplir, dos progresos y conservación del histórico) en backend/tests/integration/progresos-us-s3-04.test.js

### Implementation for User Story 4

- [X] T035 [P] [US4] Crear los modelos en backend/src/models/objetivo.model.js y backend/src/models/progreso.model.js con consultas parametrizadas (insertar, listar con filtros ordenando progresos por fecha ascendente, actualizar estado del objetivo; SIN operaciones de modificación ni eliminación de progresos)
- [X] T036 [US4] Crear el validador en backend/src/validators/progreso.validator.js: comentario no vacío y hasta 500 caracteres; peso > 0 opcional; medidas (pecho, cintura, cadera, muslos) ≥ 0 opcionales; `id_objetivo` opcional; en objetivos, descripción no vacía y estado solo en `pendiente`, `en_curso`, `cumplido`, `cancelado` (FR-010, FR-011)
- [X] T037 [US4] Crear el servicio en backend/src/services/entrenamiento.service.js: asignación activa exigida (RN-19, 403); al cumplir o cancelar un objetivo registrar `fecha_cierre` (FR-010); auditoría `registrar_objetivo` y `registrar_progreso` de los módulos `objetivos` y `progresos` (FR-020); progresos inmutables (RN-17)
- [X] T038 [US4] Crear el controlador en backend/src/controllers/progresos.controller.js y las rutas en backend/src/routes/progresos.routes.js (objetivos y progresos; edición solo del entrenador de la carga; consulta para administrador y recepcionista) y montarlas en backend/src/app.js como `/api/objetivos` y `/api/progresos`
- [X] T039 [P] [US4] Crear el componente frontend/src/components/RegistroProgreso.jsx (fecha, comentario, peso y medidas opcionales) y el panel de objetivos con cambio de estado en frontend/src/components/ObjetivosPanel.jsx
- [X] T040 [US4] Integrar los componentes de US4 en frontend/src/pages/Rutinas.jsx y frontend/src/pages/ClienteDetalle.jsx con mensajes claros de éxito y error
- [ ] T041 [US4] Ejecutar `npm test` en backend/ y dejar en verde las pruebas de US4 sin romper historias anteriores

**Checkpoint**: objetivos y progresos históricos funcionando para el entrenador

---

## Phase 7: User Story 5 - Consulta de rutina y progreso (Priority: P3)

**Goal**: el cliente consulta desde "Mi cuenta" su rutina activa, sus objetivos y su histórico de progresos (US-S3-05)

**Independent Test**: iniciar sesión como cliente con rutina activa y progresos y verificar la pestaña "Mi entrenamiento"; repetir con un cliente sin datos y verificar los mensajes `sin_rutina_asignada` y `sin_progreso_registrado`; comprobar 403 al consultar rutas de clientes ajenos

### Tests for User Story 5

- [X] T042 [P] [US5] Prueba de contrato para `GET /api/mi-entrenamiento` (200 con datos propios, mensajes de ausencia de datos, 403 para otros roles) en backend/tests/contract/mi-entrenamiento.test.js
- [X] T043 [P] [US5] Prueba de integración de la historia US-S3-05 (cliente ve solo lo suyo; otro cliente recibe 403) en backend/tests/integration/mi-entrenamiento-us-s3-05.test.js

### Implementation for User Story 5

- [X] T044 [US5] Crear el servicio en backend/src/services/mi-entrenamiento.service.js: resolver siempre el cliente desde el usuario autenticado (RN-22, FR-013), devolver rutina activa con ejercicios, objetivos y progresos ordenados, y los mensajes de FR-014 cuando no hay datos
- [X] T045 [US5] Crear el controlador en backend/src/controllers/mi-entrenamiento.controller.js y las rutas en backend/src/routes/mi-entrenamiento.routes.js (solo rol cliente) y montarlas en backend/src/app.js como `/api/mi-entrenamiento`
- [X] T046 [US5] Ampliar frontend/src/pages/MiCuenta.jsx con la pestaña "Mi entrenamiento" (entrenador responsable, rutina con ejercicios, objetivos con estado e histórico de progresos), reutilizando frontend/src/estilos.css
- [ ] T047 [US5] Ejecutar `npm test` en backend/ y dejar en verde las pruebas de US5 sin romper historias anteriores

**Checkpoint**: el cliente consume su propio entrenamiento sin ver datos ajenos

---

## Phase 8: User Story 6 - Dashboard administrativo (Priority: P3)

**Goal**: el administrador ve los indicadores agregados del gimnasio con filtro de periodo (US-S3-06)

**Independent Test**: con datos de los tres sprints, entrar como administrador y verificar que los 12 indicadores coinciden con los datos de origen y se recalculan al cambiar el periodo; comprobar 403 para recepcionista, entrenador y cliente

### Tests for User Story 6

- [X] T048 [P] [US6] Prueba de contrato para `GET /api/dashboard` (200 con las doce secciones, 400 con `desde` > `hasta`, 403 para los tres roles no autorizados) en backend/tests/contract/dashboard.test.js
- [X] T049 [P] [US6] Prueba de integración de la historia US-S3-06 (valores coherentes con los datos sembrados, periodo por defecto, indicadores en cero con base vacía) en backend/tests/integration/dashboard-us-s3-06.test.js

### Implementation for User Story 6

- [X] T050 [P] [US6] Crear el validador en backend/src/validators/dashboard.validator.js (fechas ISO opcionales; 400 si `desde` > `hasta`; valores por defecto del periodo: primer día del mes anterior → hoy, investigación §4)
- [X] T051 [US6] Crear el modelo en backend/src/models/dashboard.model.js con las consultas consolidadas parametrizadas de la tabla de indicadores de contracts/api-dashboard.md (clientes activos, membresías vigentes y vencidas, accesos recientes y rechazados, entrenadores registrados y activos, asignaciones con y sin entrenador, rutinas activas, objetivos cumplidos y pendientes con su porcentaje y progresos del periodo)
- [X] T052 [US6] Crear el servicio en backend/src/services/dashboard.service.js: componer la respuesta con el periodo efectivo y los agregados, con porcentaje de objetivos a un decimal y 0 cuando no hay objetivos (FR-016, FR-017, FR-018)
- [X] T053 [US6] Crear el controlador en backend/src/controllers/dashboard.controller.js y las rutas en backend/src/routes/dashboard.routes.js (solo administrador con `autorizar('administrador')`) y montarlas en backend/src/app.js como `/api/dashboard`
- [X] T054 [P] [US6] Crear el componente frontend/src/components/TarjetaIndicador.jsx para presentar cada indicador con su etiqueta y valor
- [X] T055 [US6] Crear la página frontend/src/pages/Dashboard.jsx con el filtro de periodo y las secciones del contrato, registrarla en frontend/src/App.jsx como ruta protegida del administrador
- [ ] T056 [US6] Ejecutar `npm test` en backend/ y dejar en verde las pruebas de US6 sin romper historias anteriores

**Checkpoint**: dashboard operativo y exclusivo del administrador

---

## Phase 9: User Story 7 - Consulta del personal asignado (Priority: P3)

**Goal**: administrador y recepcionista consultan la carga del personal; el entrenador ve solo la suya (US-S3-07)

**Independent Test**: con tres entrenadores y clientes asignados, consultar `/api/personal` como recepcionista y verificar carga, detalle y pendientes de asignación; como entrenador, verificar que `mi-carga` solo devuelve su propia carga; como cliente, 403

### Tests for User Story 7

- [X] T057 [P] [US7] Prueba de contrato para `GET /api/personal` y `GET /api/personal/mi-carga` (200 por rol, 403 para cliente y para el rol equivocado) en backend/tests/contract/personal.test.js
- [X] T058 [P] [US7] Prueba de integración de la historia US-S3-07 (carga por entrenador, filtros y pendientes de asignación) en backend/tests/integration/personal-us-s3-07.test.js

### Implementation for User Story 7

- [X] T059 [US7] Ampliar backend/src/models/asignacion.model.js con las consultas de la vista del personal (listar entrenadores con sus clientes asignados y los clientes sin asignación activa, con filtros) y la de la carga propia del entrenador autenticado
- [X] T060 [US7] Crear el controlador en backend/src/controllers/personal.controller.js y las rutas en backend/src/routes/personal.routes.js (`GET /api/personal` para administrador y recepcionista; `GET /api/personal/mi-carga` solo para entrenador, 403 en los demás casos) y montarlas en backend/src/app.js como `/api/personal`
- [X] T061 [P] [US7] Crear la página frontend/src/pages/Personal.jsx (listado del personal con carga, detalle por entrenador y sección de pendientes de asignación, con filtro) y registrarla en frontend/src/App.jsx para administrador y recepcionista
- [ ] T062 [US7] Ejecutar `npm test` en backend/ y dejar en verde las pruebas de US7 sin romper historias anteriores

**Checkpoint**: todas las historias del sprint operativas de forma independiente

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: verificación transversal, auditoría, documentación y regresión

- [ ] T063 [P] Verificar que las seis acciones de auditoría del sprint (`asignar_entrenador`, `reasignar_entrenador`, `crear_rutina`, `modificar_rutina`, `registrar_objetivo`, `registrar_progreso`) quedan registradas con usuario, módulo, fecha, resultado y descripción, y que su consulta sigue respondiendo 403 a los no administradores (FR-020, SC-013)
- [ ] T064 Ejecutar la suite completa del backend (`npm test` en backend/) y corregir cualquier regresión de los Sprints 1 y 2 (FR-029)
- [X] T065 [P] Actualizar README.md describiendo los módulos nuevos del Sprint 3 (entrenadores, asignaciones, rutinas, objetivos, progresos, dashboard y personal)
- [ ] T066 Ejecutar la validación de extremo a extremo de quickstart.md (escenarios 3.1 a 3.8) y dejar registro de los resultados (principio X, FR-031)
- [X] T067 Revisión final de seguridad: permisos por rol validados en el backend en todos los endpoints nuevos, sin eliminaciones ordinarias de historiales, sin datos sensibles en respuestas y sin conexiones del frontend a MySQL (FR-019, FR-021, FR-024, FR-025, FR-027)
- [ ] T068 [P] Tras la aprobación del equipo, incorporar las reglas RN-15 a RN-24 en docs/project-context.md §12 y confirmar en docs/reglas.md que las reglas vigentes siguen aplicándose sin contradicción (FR-032, principio I del prospecto de constitución)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; puede empezar de inmediato
- **Foundational (Phase 2)**: depende de Setup; BLOQUEA todas las historias
- **User Stories (Phases 3-9)**: todas dependen de Foundational
  - Orden recomendado por prioridad: US1 (P1) → US2 (P1) → US3 (P2) → US4 (P2) → US5 (P3) → US6 (P3) → US7 (P3)
  - US3 requiere la asignación activa de US2 para probarse de extremo a extremo
  - US4 requiere las rutinas de US3 solo para mostrarlas juntas en la interfaz; la API es independiente
  - US5 requiere US3 y US4 para tener datos que mostrar
  - US6 y US7 requieren los datos de US1 y US2 (y de los Sprints 1 y 2) para alimentarse
- **Polish (Phase 10)**: depende de todas las historias elegidas

### User Story Dependencies

- **US1 (P1)**: arranca tras Foundational; sin dependencias de otras historias
- **US2 (P1)**: arranca tras Foundational; necesita US1 para tener entrenadores (integración en T020)
- **US3 (P2)**: arranca tras Foundational; se prueba con la asignación de US2
- **US4 (P2)**: arranca tras Foundational; independiente en API, se integra con US3 en interfaz
- **US5 (P3)**: necesita US3 y US4 para tener contenido que consumir
- **US6 (P3)**: necesita US1 y US2 para los indicadores de entrenadores y asignaciones
- **US7 (P3)**: necesita US1 y US2 para la carga del personal

### Within Each User Story

- Pruebas primero (deben fallar antes de implementar)
- Modelos → validadores → servicios → controladores → rutas → frontend
- Historia completa antes de pasar a la siguiente prioridad

### Parallel Opportunities

- T001 y T002 en paralelo (Setup)
- T005 en paralelo con el resto de Foundational
- En cada historia, todas las tareas marcadas [P] (pruebas, modelos y validadores) pueden ejecutarse en paralelo entre sí
- Diferentes historias pueden trabajarse en paralelo si hay capacidad, respetando las dependencias de integración listadas arriba

---

## Parallel Example: User Story 1

```text
# Lanzar juntas las pruebas de US1:
Tarea: "Prueba de contrato para GET/POST/PUT /api/entrenadores ... backend/tests/contract/entrenadores.test.js"
Tarea: "Prueba de integración de la historia US-S3-01 ... backend/tests/integration/entrenadores-us-s3-01.test.js"

# Lanzar juntos el validador y el modelo:
Tarea: "Crear el validador del módulo ... backend/src/validators/entrenador.validator.js"
Tarea: "Crear el modelo ... backend/src/models/entrenador.model.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO - bloquea todas las historias)
3. Completar Phase 3: User Story 1
4. **PARAR y VALIDAR**: probar US1 de forma independiente (alta, consulta, 403 y 409)
5. Demostrar si ya es suficiente

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → probar → demo (MVP del sprint: entrenadores registrados)
3. US2 → probar → demo (asignación y reasignación con histórico)
4. US3 → probar → demo (rutinas del entrenador)
5. US4 → probar → demo (objetivos y progresos)
6. US5 → probar → demo (el cliente ve su entrenamiento)
7. US6 → probar → demo (dashboard del administrador)
8. US7 → probar → demo (carga del personal)
9. Polish → regresión completa y auditoría verificada

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational
2. Cuando termine Foundational:
   - Desarrollador A: US1 y US2 (entrenadores y asignaciones)
   - Desarrollador B: US3 y US4 (rutinas, objetivos y progresos)
   - Desarrollador C: US6 y US7 (dashboard y personal; dependen de datos sembrados)
3. US5 se integra al final con el contenido de US3 y US4

---

## Notes

- Las tareas de pruebas están incluidas porque lo exigen FR-031, el principio X de la
  constitución y el plan; se ejecutan con la infraestructura existente (`node:test` +
  `supertest` + backend/tests/ayuda/base-pruebas.js), sin dependencias nuevas.
- Cada tarea incluye la ruta exacta del archivo; los identificadores, mensajes de error y
  códigos HTTP siguen los contratos de `contracts/`.
- Commits pequeños por tarea o grupo lógico, en Conventional Commits (tipo y alcance en
  inglés, descripción en español).
- Al cerrar cada historia, ejecutar `npm test` completo en backend/ para detectar regresiones
  tempranas en las historias anteriores.
