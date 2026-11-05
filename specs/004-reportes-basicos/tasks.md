---

description: "Lista de tareas del Sprint 4 - Reportes básicos y cierre del MVP"
---

# Tasks: Sprint 4 - Reportes básicos y cierre del MVP

**Input**: Documentos de diseño de `/specs/004-reportes-basicos/`

**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias), research.md,
data-model.md, contracts/api-reportes.md, quickstart.md

**Pruebas**: SÍ se incluyen tareas de pruebas: el spec lo exige (FR-027, FR-031), la constitución lo
exige (principio X) y `docs/sprint-4.md` §11 lo pide como entregable. Se ejecutan con la
infraestructura existente (`node:test` + `supertest` + `backend/tests/ayuda/base-pruebas.js`), sin
dependencias nuevas.

**Organización**: las tareas están agrupadas por historia de usuario para permitir la implementación
y la prueba independientes de cada historia.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Historia]**: a qué historia de usuario pertenece (por ejemplo, [US-S4-01])
- Incluye la ruta exacta del archivo en la descripción
- Cada tarea cita los requisitos funcionales que satisface, para que la trazabilidad
  requisito → historia → tarea → prueba sea directa

## Convenciones de rutas

- **Aplicación web**: `backend/src/`, `frontend/src/`, `database/`
- Rutas con exactitud según [contracts/api-reportes.md](./contracts/api-reportes.md),
  [data-model.md](./data-model.md) y [research.md](./research.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparación mínima compartida antes de tocar el código del módulo de reportes

- [ ] T001 [P] Instalar `pdfkit` ^0.20 (MIT) como dependencia del backend en `backend/package.json`,
  ejecutar `npm install` en `backend/` y verificar con `npm ls pdfkit` que solo entran sus
  dependencias transitivas de JavaScript puro (FR-022, FR-045, research.md §D1)
- [ ] T002 [P] Crear `database/seeds/seed-datos-sprint4.sql` con datos representativos para los
  reportes (FR-006, FR-007, FR-008, FR-009, FR-010): clientes `activo` e `inactivo` con distintas
  `fecha_registro`; membresías en los cuatro estados del ENUM (`activo`, `vencida`, `suspendida`,
  `cancelada`), incluidas membresías `activo` cuya `fecha_fin` cae dentro de los 7 días
  siguientes; pagos `completado` repartidos en varios periodos y clientes con pagos parciales y sin
  pagos; accesos `autorizado` y `rechazado` con su `motivo`; y al menos un cliente con más de una
  membresía para el cálculo de adeudos
- [ ] T003 Ampliar `backend/tests/ayuda/base-pruebas.js` para aplicar
  `database/seeds/seed-datos-sprint4.sql` después de las semillas existentes
  (`seed-administrador.sql`, `seed-datos-sprint2.sql` y `seed-datos-sprint3.sql`), de modo que la
  base `gym_test` tenga datos representativos en cada ejecución
- [ ] T004 [P] Registrar en `frontend/src/services/api.js` los consumos nuevos del sprint siguiendo
  el patrón existente del archivo (FR-018, FR-034): el listado de reportes con sus filtros y la
  descarga del PDF de cada tipo de reporte

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: estructura compartida del módulo de reportes; SIN esto ninguna historia puede empezar

**?? CRITICAL**: no se puede comenzar trabajo de ninguna historia hasta que esta fase esté completa

- [ ] T005 [P] Crear `backend/src/validators/reporte.validator.js` con la validación de los filtros
  de todos los reportes (FR-012, FR-013, FR-016, FR-039): `desde` y `hasta` opcionales en formato
  ISO `YYYY-MM-DD`, con **400** `VALIDACION` y el mensaje "El parámetro <campo> debe tener formato
  YYYY-MM-DD" si el formato no es válido, y con el mensaje "El periodo es inválido: desde no puede
  ser posterior a hasta" si `desde` es posterior a `hasta`; `estado` opcional validado contra el
  listado del tipo de reporte (clientes: `activo`, `inactivo`; membresías: `activo`, `vencida`,
  `suspendida`, `cancelada`; accesos: `autorizado`, `rechazado`) y **400** `VALIDACION` si el valor
  no está en el listado; y `pagina` entero mayor o igual que 1, normalizada a 1 cuando no sea
  válida. Reutilizar el patrón de `backend/src/validators/dashboard.validator.js`
- [ ] T006 [P] Crear `backend/src/models/reporte.model.js` con las consultas de solo lectura
  parametrizadas que comparten los cinco reportes (FR-003, FR-014, FR-039):
  `listarPaginado({ columnas, condiciones, valores, pagina, limite, orden })` con `LIMIT ? OFFSET ?`
  y `contarFilas({ condiciones, valores })`, ambas con todos los valores como parámetros
  posicionales y sin interpolación de SQL
- [ ] T007 Crear `backend/src/services/reporte.service.js` con la lógica compartida (FR-014,
  FR-017, FR-023): el periodo efectivo aplicado, la normalización de la página con el límite fijo
  de **20** registros, el armado del envelope `{ tipo, periodo, totales, filas, paginacion }` con
  `totalPaginas`, y la función `registrarAuditoriaReporte(idUsuario, accion, descripcion)` que llama
  a `backend/src/services/auditoria.service.js` con `modulo = 'reportes'`,
  `resultado = 'exitoso'` y la descripción en el formato `tipo=<tipo>; desde=<fecha>; hasta=<fecha>;
  estado=<valor>; pagina=<n>`, que cabe en `descripcion VARCHAR(255)` de la tabla `auditoria`
- [ ] T008 Crear `backend/src/controllers/reportes.controller.js` con el manejador compartido
  `responderReporte(req, res, siguiente, tipo)` que valida los filtros con el validador, delega en
  el manejador del tipo de reporte, registra la acción `generar_reporte` en la auditoría (FR-023) y
  responde con el envelope
- [ ] T009 Crear `backend/src/routes/reportes.routes.js` con las cinco rutas de consulta
  (`GET /api/reportes/clientes`, `/membresias`, `/pagos`, `/adeudos` y `/accesos`) usando
  `autenticar` y `autorizar('administrador')` (FR-001, FR-002), y montarlas en `backend/src/app.js`
  como `/api/reportes`
- [ ] T010 [P] Crear `frontend/src/components/FiltroReporte.jsx` y
  `frontend/src/components/TablaReporte.jsx`, reutilizando `frontend/src/estilos.css` y los
  patrones de las páginas existentes (FR-013, FR-014, FR-015): el filtro con los periodos
  predefinidos (hoy, semana, mes y personalizado), el rango libre de fecha inicial y fecha final y
  el selector de estado cuando el reporte lo admita; la tabla con las columnas del reporte, la
  paginación y los mensajes de resultado vacío y de error
- [ ] T011 Crear `frontend/src/pages/Reportes.jsx` con la estructura de cuatro pestañas (Clientes,
  Membresías, Pagos y adeudos, Accesos), reutilizando `frontend/src/components/TarjetaIndicador.jsx`
  para los totales, y registrarla en `frontend/src/App.jsx` como ruta protegida del administrador
  (FR-001, FR-032)

**Checkpoint**: la base compartida del módulo de reportes está lista; las historias pueden empezar

---

## Phase 3: User Story 1 - Reporte de clientes (Priority: P1) ?? MVP [US-S4-01]

**Goal**: el administrador consulta el reporte de clientes con totales por estado, filtro por
periodo y filtro por estado

**Independent Test**: iniciar sesión como administrador, generar el reporte de clientes y verificar
que presenta el total de clientes y el desglose por estado con cifras que coinciden con los
clientes registrados, filtrado por `fecha_registro`

### Tests for User Story 1

> **NOTA: escribir estas pruebas primero y comprobar que FALLAN antes de implementar**

- [ ] T012 [P] [US-S4-01] Prueba de contrato para `GET /api/reportes/clientes` (FR-006, FR-012, FR-013, FR-015, FR-016, FR-001, FR-002, SC-005, SC-006, SC-015) en `backend/tests/contract/reportes.test.js`: 200 con el
  envelope y sus totales, 400 `VALIDACION` con `desde` posterior a `hasta`, 400 `VALIDACION` con
  `estado` fuera del listado `activo`/`inactivo`, 401 sin token y 403 para recepcionista,
  entrenador y cliente
- [ ] T013 [P] [US-S4-01] Prueba de integración de la historia US-S4-01 (FR-006, FR-012, FR-013, FR-014, FR-015, FR-017, SC-002, SC-006, SC-008) en
  `backend/tests/integration/reportes-clientes-us-s4-01.test.js`: totales por estado que coinciden con
  la base de datos, filtro por periodo sobre `fecha_registro`, filtro por estado, paginación de 20
  registros sin filas repetidas ni omitidas, y resultado vacío con totales en cero

### Implementation for User Story 1

- [ ] T014 [P] [US-S4-01] Añadir en `backend/src/models/reporte.model.js` las consultas de solo
  lectura de clientes (FR-006, FR-003): el listado paginado con las columnas `id_cliente`, nombre,
  apellido, correo, teléfono, `fecha_registro` y `estado`, el conteo del conjunto filtrado y el
  desglose por estado del ENUM `clientes.estado` (`activo`, `inactivo`)
- [ ] T015 [US-S4-01] Añadir en `backend/src/services/reporte.service.js` la totalización del reporte
  de clientes (`total` y `por_estado`) calculada sobre el conjunto filtrado completo y no sobre la
  página visible (FR-006, FR-017), y el manejador que arma sus filas
- [ ] T016 [US-S4-01] Conectar el manejador `clientes` en
  `backend/src/controllers/reportes.controller.js` y su ruta en
  `backend/src/routes/reportes.routes.js` (FR-006)
- [ ] T017 [US-S4-01] Implementar la pestaña Clientes en `frontend/src/pages/Reportes.jsx` con los
  totales en tarjetas, la tabla paginada y los mensajes de resultado vacío y de error (FR-015,
  FR-032)
- [ ] T018 [US-S4-01] Ejecutar `npm test` en `backend/` y dejar en verde las pruebas de US-S4-01
  (FR-027)

**Checkpoint**: el reporte de clientes funciona y se puede verificar de forma independiente

---

## Phase 4: User Story 2 - Reporte de membresías (Priority: P1) [US-S4-02]

**Goal**: el administrador consulta el reporte de membresías con los cuatro grupos disjuntos
(activas, próximas a vencer, vencidas y suspendidas o canceladas)

**Independent Test**: iniciar sesión como administrador, generar el reporte de membresías y
verificar que separa los cuatro grupos y que la suma de sus totales coincide con el total de
membresías del filtro

### Tests for User Story 2

- [ ] T019 [P] [US-S4-02] Prueba de contrato para `GET /api/reportes/membresias` (FR-007, FR-013, FR-016, FR-001, FR-002, SC-005, SC-006, SC-015) en `backend/tests/contract/reportes.test.js`: 200 con los cuatro totales,
  400 `VALIDACION` con `estado` fuera del listado `activo`/`vencida`/`suspendida`/`cancelada`, 401 sin
  token y 403 para los tres roles no autorizados
- [ ] T020 [P] [US-S4-02] Prueba de integración de la historia US-S4-02 (FR-007, FR-012, FR-013, FR-014, FR-017, SC-002, SC-008, SC-014) en `backend/tests/integration/reportes-membresias-us-s4-02.test.js`: clasificación
  disjunta de cada membresía en su grupo, suma de los cuatro totales igual al total del filtro,
  ventana de 7 días evaluada contra la fecha de hoy, filtro por periodo sobre el periodo de
  vigencia y filtro por estado

### Implementation for User Story 2

- [ ] T021 [P] [US-S4-02] Añadir en `backend/src/models/reporte.model.js` las consultas de solo
  lectura de membresías con `id_cliente`, nombre, tipo de membresía, `fecha_inicio`, `fecha_fin` y
  `estado`, más el conteo y el total por grupo (FR-007, FR-003)
- [ ] T022 [US-S4-02] Implementar en `backend/src/services/reporte.service.js` la clasificación
  disjuelta según la regla del modelo de datos §5.1 (FR-007, FR-017): `activas` cuando
  `estado = 'activo'` y `fecha_fin` está a más de 7 días de la fecha de hoy; `proximas_a_vencer`
  cuando `estado = 'activo'` y `fecha_fin` está dentro de los 7 días siguientes a la fecha de hoy;
  `vencidas` cuando `estado = 'vencida'` o la `fecha_fin` ya pasó; y `suspendidas_o_canceladas` en
  el resto de los casos. Los cuatro grupos son excluyentes y su suma es el total del filtro
- [ ] T023 [US-S4-02] Conectar el manejador `membresias` en
  `backend/src/controllers/reportes.controller.js` y su ruta en
  `backend/src/routes/reportes.routes.js` (FR-007)
- [ ] T024 [US-S4-02] Implementar la pestaña Membresías en `frontend/src/pages/Reportes.jsx` con las
  cuatro tarjetas de totales y la columna de grupo por fila (FR-007, FR-032)
- [ ] T025 [US-S4-02] Ejecutar `npm test` en `backend/` y dejar en verde las pruebas de US-S4-02 sin
  romper US-S4-01 (FR-027)

**Checkpoint**: el reporte de membresías funciona y se puede verificar de forma independiente

---

## Phase 5: User Story 3 - Reporte de pagos y adeudos (Priority: P1) [US-S4-03]

**Goal**: el administrador consulta el reporte de pagos e ingresos por periodo y el reporte de
adeudos pendientes por cliente

**Independent Test**: iniciar sesión como administrador, generar el reporte de pagos por periodo y
el reporte de adeudos por cliente, y verificar que los ingresos sumados y los adeudos calculados
coinciden con los pagos y las membresías registradas

### Tests for User Story 3

- [ ] T026 [P] [US-S4-03] Prueba de contrato para `GET /api/reportes/pagos` y
  `GET /api/reportes/adeudos` (FR-008, FR-009, FR-016, FR-001, FR-002, SC-005, SC-006) en
  `backend/tests/contract/reportes.test.js`: 200 con los totales de cada uno, 400 `VALIDACION` con
  `desde` posterior a `hasta`, 401 sin token y 403 para los tres roles no autorizados
- [ ] T027 [P] [US-S4-03] Prueba de integración de la historia US-S4-03 (FR-008, FR-009, FR-011, FR-003, SC-002, SC-010, SC-016) en `backend/tests/integration/reportes-pagos-adeudos-us-s4-03.test.js`: total de ingresos
  igual a la suma de los montos listados, listado con `estado = 'completado'` únicamente, adeudo
  calculado sobre la última membresía registrada con el precio de su tipo, saldo nunca negativo, y
  verificación de que ningún pago, membresía o cliente queda modificado por la operación

### Implementation for User Story 3

- [ ] T028 [P] [US-S4-03] Añadir en `backend/src/models/reporte.model.js` las consultas de solo
  lectura de pagos y de adeudos (FR-008, FR-009, FR-003): pagos con `id_pago`, cliente, membresía,
  `monto`, `fecha_pago`, `metodo_pago` y `estado`, filtrando por `DATE(fecha_pago)` y
  `estado = 'completado'`; y adeudos con el precio del tipo de la membresía, la suma de los pagos
  `completado` del cliente y el saldo pendiente
- [ ] T029 [US-S4-03] Implementar en `backend/src/services/reporte.service.js` el total de ingresos
  como la suma de los montos de los pagos `completado` del periodo y el cálculo de adeudo según el
  modelo de datos §5.2 (FR-008, FR-011, FR-017): la membresía base es la de `fecha_inicio` más
  reciente y, a igualdad de fecha, la de `id_membresia` mayor; el precio es el de su tipo de
  membresía; se descuentan solo los pagos `completado` del cliente; el saldo es
  `max(0, precio - pagos)`; y el reporte expone el `estado` y la `fecha_fin` de esa membresía base
- [ ] T030 [US-S4-03] Conectar los manejadores `pagos` y `adeudos` en
  `backend/src/controllers/reportes.controller.js` y sus rutas en
  `backend/src/routes/reportes.routes.js` (FR-008, FR-009)
- [ ] T031 [US-S4-03] Implementar la pestaña Pagos y adeudos en `frontend/src/pages/Reportes.jsx`
  con los dos listados y sus totales (FR-032)
- [ ] T032 [US-S4-03] Ejecutar `npm test` en `backend/` y dejar en verde las pruebas de US-S4-03 sin
  romper US-S4-01 ni US-S4-02 (FR-027)

**Checkpoint**: los reportes de pagos y de adeudos funcionan y se pueden verificar de forma
independiente

---

## Phase 6: User Story 4 - Reporte de accesos (Priority: P2) [US-S4-04]

**Goal**: el administrador consulta el reporte de accesos autorizados y rechazados por periodo

**Independent Test**: iniciar sesión como administrador, generar el reporte de accesos por periodo
y verificar que separa los accesos autorizados de los rechazados y que el total coincide con los
accesos registrados

### Tests for User Story 4

- [ ] T033 [P] [US-S4-04] Prueba de contrato para `GET /api/reportes/accesos` (FR-010, FR-013, FR-016, FR-001, FR-002, SC-005, SC-006, SC-015) en `backend/tests/contract/reportes.test.js`: 200 con los totales
  `total`, `autorizados` y `rechazados`, 400 `VALIDACION` con `estado` fuera del listado
  `autorizado`/`rechazado`, 401 sin token y 403 para los tres roles no autorizados
- [ ] T034 [P] [US-S4-04] Prueba de integración de la historia US-S4-04 (FR-010, FR-012, FR-003, SC-002, SC-010) en
  `backend/tests/integration/reportes-accesos-us-s4-04.test.js`: totales que coinciden con la base de
  datos, filtro por periodo sobre `accesos.fecha`, filtro por `resultado`, motivo de rechazo
  presente en los accesos rechazados y verificación de que ningún acceso queda modificado

### Implementation for User Story 4

- [ ] T035 [P] [US-S4-04] Añadir en `backend/src/models/reporte.model.js` las consultas de solo
  lectura de accesos con `id_acceso`, cliente, `fecha`, `hora`, `resultado` y `motivo`, más el conteo
  y los totales por resultado del ENUM `accesos.resultado` (`autorizado`, `rechazado`) (FR-010,
  FR-003)
- [ ] T036 [US-S4-04] Implementar en `backend/src/services/reporte.service.js` los totales de
  `autorizados` y `rechazados` sobre el conjunto filtrado completo (FR-010, FR-017)
- [ ] T037 [US-S4-04] Conectar el manejador `accesos` en
  `backend/src/controllers/reportes.controller.js` y su ruta en
  `backend/src/routes/reportes.routes.js` (FR-010)
- [ ] T038 [US-S4-04] Implementar la pestaña Accesos en `frontend/src/pages/Reportes.jsx` (FR-032)
- [ ] T039 [US-S4-04] Ejecutar `npm test` en `backend/` y dejar en verde las pruebas de US-S4-04 sin
  romper las historias anteriores (FR-027)

**Checkpoint**: el reporte de accesos funciona y se puede verificar de forma independiente

---

## Phase 7: User Story 5 - Exportación de reportes (Priority: P2) [US-S4-05]

**Goal**: el administrador exporta cualquiera de los cinco reportes a un archivo PDF con los mismos
datos y filtros del reporte en pantalla

**Independent Test**: iniciar sesión como administrador, generar un reporte con un filtro concreto,
exportarlo y verificar que el archivo obtenido contiene exactamente los mismos datos y el mismo
filtro que los mostrados en pantalla

### Tests for User Story 5

- [ ] T040 [P] [US-S4-05] Prueba de contrato para los cinco endpoints de exportación
  (`GET /api/reportes/<tipo>/exportar`) en `backend/tests/contract/reportes.test.js` (FR-018, FR-019, FR-020, FR-021, FR-001, FR-002, SC-005, SC-006): 200 con `Content-Type: application/pdf` y
  `Content-Disposition: attachment`, 400 `VALIDACION` con `desde` posterior a `hasta` y con
  `estado` no previsto, 401 sin token y 403 para los tres roles no autorizados
- [ ] T041 [P] [US-S4-05] Prueba de integración de la historia US-S4-05 (FR-019, FR-020, FR-021, SC-003, SC-004, SC-009) en
  `backend/tests/integration/reportes-exportacion-us-s4-05.test.js`: encabezados
  `X-Reporte-Total-Filas`, `X-Reporte-Filas-Exportadas` y `X-Reporte-Truncado` coherentes con el
  conjunto filtrado, exportación del conjunto filtrado completo y no de la página visible,
  truncamiento con aviso cuando se supera el límite de 10.000 filas, y verificación de que el
  archivo no contiene contraseñas, tokens ni datos biométricos

### Implementation for User Story 5

- [ ] T042 [P] [US-S4-05] Crear `backend/src/services/reporte-pdf.service.js` con la generación del
  documento mediante `pdfkit` (FR-018, FR-021, FR-022): título del reporte, periodo aplicado,
  columnas y filas del conjunto filtrado completo, totales y nota de pie con el aviso de
  truncamiento cuando corresponda; y la validación de que los datos son representables en WinAnsi,
  de modo que un carácter fuera de ese conjunto produzca **400** `VALIDACION` con un mensaje claro
  en lugar de un archivo corrupto
- [ ] T043 [US-S4-05] Añadir en `backend/src/controllers/reportes.controller.js` los cinco manejadores
  de exportación y en `backend/src/routes/reportes.routes.js` las cinco rutas
  `GET /api/reportes/<tipo>/exportar` con `autorizar('administrador')` (FR-018, FR-019), que
  devuelven el PDF con los tres encabezados de control
- [ ] T044 [US-S4-05] Registrar la acción `exportar_reporte` en la auditoría con el mismo formato de
  descripción del plan (FR-024), y añadir en `frontend/src/pages/Reportes.jsx` el botón de exportar
  y la visualización del aviso de truncamiento (FR-019, FR-032)
- [ ] T045 [US-S4-05] Ejecutar `npm test` en `backend/` y dejar en verde las pruebas de US-S4-05 sin
  romper las historias anteriores (FR-027)

**Checkpoint**: la exportación a PDF funciona y se puede verificar de forma independiente

---

## Phase 8: User Story 6 - Auditoría de reportes (Priority: P3) [US-S4-06]

**Goal**: el administrador consulta quién generó o exportó cada reporte y con qué filtros

**Independent Test**: iniciar sesión como administrador, generar y exportar un reporte, consultar la
auditoría y verificar que aparecen los dos registros con el usuario que los ejecutó y los datos de
la operación

### Tests for User Story 6

- [ ] T046 [P] [US-S4-06] Prueba de contrato para la consulta de la auditoría de reportes (FR-025, FR-001, SC-005) en `backend/tests/contract/reportes.test.js`: 200 solo para el administrador con `accion`,
  `modulo`, `resultado`, `descripcion` y `usuario`, y 403 para recepcionista, entrenador y cliente
- [ ] T047 [P] [US-S4-06] Prueba de integración de la historia US-S4-06 (FR-023, FR-024, FR-025, SC-007) en
  `backend/tests/integration/reportes-auditoria-us-s4-06.test.js`: un registro `generar_reporte` y
  otro `exportar_reporte` con `modulo = 'reportes'` y la descripción con el tipo y los filtros, un
  registro `rechazado` por intento de un rol no autorizado, y ausencia de registro cuando la
  petición no lleva token

### Implementation for User Story 6

- [ ] T048 [US-S4-06] Verificar en `backend/src/services/auditoria.service.js` que el registro de
  las acciones de reportes usa `accion` `generar_reporte` o `exportar_reporte` (VARCHAR(60)),
  `modulo` `reportes` (VARCHAR(40)), `resultado` `exitoso` o `rechazado` (VARCHAR(20)) y la
  descripción con el tipo y los filtros (VARCHAR(255)) (FR-023, FR-024), y confirmar que una
  petición sin usuario identificado no genera registro y que un fallo del registro no impide la
  operación principal
- [ ] T049 [US-S4-06] Implementar en `frontend/src/pages/Reportes.jsx` la sección de auditoría de
  reportes con la fecha, el usuario, la acción, el resultado y la descripción de cada operación
  (FR-025, FR-032)
- [ ] T050 [US-S4-06] Ejecutar `npm test` en `backend/` y dejar en verde las pruebas de US-S4-06 sin
  romper las historias anteriores (FR-027)

**Checkpoint**: la trazabilidad de los reportes funciona y se puede verificar de forma independiente

---

## Phase 9: User Story 7 - Cierre y calidad del MVP (Priority: P3) [US-S4-07]

**Goal**: el equipo verifica y documenta el MVP completo antes de entregarlo

**Independent Test**: recorrer de punta a punta los flujos principales de los cuatro sprints sobre
una base de datos real, ejecutar la suite completa de pruebas y verificar que la documentación del
proyecto coincide con el sistema entregado

### Tests for User Story 7

- [ ] T051 [P] [US-S4-07] Prueba de integración de cierre del MVP (FR-023, FR-029, FR-030) en
  `backend/tests/integration/cierre-mvp-us-s4-07.test.js`: verificación de que las seis acciones de
  auditoría del Sprint 3 siguen registradas con usuario, módulo, fecha, resultado y descripción, de
  que las reglas RN-25 a RN-34 figuran en `docs/project-context.md` §12, y de que los diez endpoints
  de reportes responden con los códigos y las formas que fija `contracts/api-reportes.md`

### Implementation for User Story 7

- [ ] T052 [P] [US-S4-07] Verificar el prerrequisito de este sprint: la migración 003 está aplicada
  en la base local y en la base de pruebas y las pruebas de integración del Sprint 3 se ejecutan sin
  omitirse, sin fallos y sin cancelaciones (FR-026, `docs/sprint-4.md` §1)
- [ ] T053 [US-S4-07] Corregir en `backend/src/` o en `frontend/src/` los defectos que se detecten al
  verificar el Sprint 3, o documentarlos en `docs/project-context.md` de forma explícita con su
  motivo (FR-028)
- [ ] T054 [US-S4-07] Actualizar `docs/project-context.md` con las reglas RN-15 a RN-34 en su sección
  12 y con el número real de sprints, y `docs/reglas.md` con el número real de sprints (FR-030, FR-031, SC-013, principio I)
- [ ] T055 [US-S4-07] Actualizar `docs/sprint-4.md` §6 para que la redacción de RN-27 y RN-31
  coincida con su redacción provisional en el spec, incluida la ampliación del filtro por periodo al
  reporte de clientes y la precisión sobre los pagos completados (FR-030, research.md §D10)
- [ ] T056 [US-S4-07] Ejecutar la validación de punta a punta de los flujos principales de los
  cuatro sprints siguiendo los escenarios de `specs/004-reportes-basicos/quickstart.md` y registrar
  los resultados en la tabla de registro de esa guía (FR-029, SC-001, SC-012)
- [ ] T057 [US-S4-07] Actualizar `resultados-pruebas.txt` y `resultados-pruebas.csv` con los
  resultados reales de la última ejecución (FR-033, SC-013)
- [ ] T058 [US-S4-07] Revisar en `frontend/src/pages/Reportes.jsx` que la pantalla de reportes
  mantiene un diseño y una navegación consistentes con las páginas existentes y que muestra
  mensajes claros de éxito, de error y de resultado vacío (FR-032, principio XI)

**Checkpoint**: el MVP está verificado y documentado

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: verificación transversal, documentación y regresión

- [ ] T059 [P] Revisión final transversal sobre `backend/src/routes/reportes.routes.js`,
  `backend/src/controllers/reportes.controller.js`, `backend/src/models/reporte.model.js` y
  `backend/src/services/reporte-pdf.service.js` (FR-001, FR-002, FR-004, FR-005, FR-019, FR-020,
  FR-024, FR-025, FR-027, FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-041, FR-042,
  FR-043, FR-044): permisos por rol validados en el backend en los diez endpoints y petición sin
  token rechazada; sin contraseñas, tokens ni datos biométricos en las respuestas ni en los archivos
  exportados; sin operaciones de modificación o eliminación sobre pagos, membresías o accesos;
  consultas parametrizadas; errores sin información interna; `.env` fuera del repositorio; frontend
  sin acceso directo a MySQL; ES Modules y JWT con bcrypt mantenidos; separación modular intacta; y
  ausencia de funciones fuera del alcance del MVP, de cambios en el comportamiento de los sprints
  anteriores y de tablas nuevas
- [ ] T060 Ejecutar la suite completa del backend (`npm test` en `backend/`) y corregir cualquier
  regresión de los Sprints 1, 2 y 3 (FR-027, SC-011)
- [ ] T061 [P] Revisión de consistencia de la documentación del proyecto (FR-030, FR-031): reglas
  RN-25 a RN-34 en `docs/project-context.md` §12, número real de sprints en `docs/reglas.md` y
  `docs/project-context.md`, RN-27 y RN-31 en `docs/sprint-4.md` §6, y cierre de las secciones del
  informe de calidad `docs/calidad/sprint-4-calidad-nueva-funcionalidad.md` (principio I)
- [ ] T062 [P] Revisión visual de `frontend/src/pages/Reportes.jsx` contra el patrón de las páginas
  existentes y ajuste de los mensajes de éxito, de error y de resultado vacío (FR-032, principio XI)

---

## Dependencias y orden de ejecución

### Dependencias de fase

- **Setup (Fase 1)**: sin dependencias; puede empezar de inmediato
- **Foundational (Fase 2)**: depende de Setup; BLOQUEA todas las historias
- **Historias de usuario (Fases 3 a 9)**: todas dependen de la fase Foundational
  - Orden recomendado por prioridad: US-S4-01 (P1) → US-S4-02 (P1) → US-S4-03 (P1) →
    US-S4-04 (P2) → US-S4-05 (P2) → US-S4-06 (P3) → US-S4-07 (P3)
  - US-S4-05 y US-S4-06 amplían los archivos creados en las fases anteriores, por lo que sus tareas
    no se marcan como paralelas
- **Polish (Fase 10)**: depende de las historias elegidas

### Dependencias entre historias de usuario

- **US-S4-01 (P1)**: arranca tras Foundational; sin dependencias de otras historias
- **US-S4-02 (P1)**: arranca tras Foundational; el reporte de adeudos de US-S4-03 usa la
  clasificación de membresías definida aquí, pero el reporte de membresías es verificable solo
- **US-S4-03 (P1)**: arranca tras Foundational; el cálculo de adeudos es verificable solo
- **US-S4-04 (P2)**: arranca tras Foundational; el reporte de accesos es verificable solo
- **US-S4-05 (P2)**: arranca tras Foundational; la exportación puede usar un reporte de ejemplo
- **US-S4-06 (P3)**: arranca tras Foundational; la auditoría se puede verificar generando un reporte
  de los anteriores
- **US-S4-07 (P3)**: requiere las historias anteriores y el prerrequisito FR-026

### Dentro de cada historia de usuario

- Las pruebas se escriben primero y deben fallar antes de implementar
- Modelos antes que servicios, servicios antes que controladores y rutas
- El frontend de la historia después de su endpoint
- La historia se completa antes de pasar a la siguiente prioridad

### Oportunidades de paralelismo

- Todas las tareas marcadas [P] de Setup pueden ejecutarse en paralelo
- Todas las tareas marcadas [P] de Foundational pueden ejecutarse en paralelo, salvo T007, T008 y
  T009, que dependen entre sí
- Una vez completada la fase Foundational, las historias pueden empezar en paralelo si hay capacidad
- Las pruebas de una misma historia marcadas [P] pueden ejecutarse en paralelo
- Los modelos y las consultas de una historia marcados [P] pueden ejecutarse en paralelo
- Las historias pueden repartirse entre varios desarrolladores

---

## Ejemplo de paralelismo: Historia US-S4-01

```text
# Lanzar juntas las pruebas de US-S4-01:
Tarea: "Prueba de contrato para GET /api/reportes/clientes ... en backend/tests/contract/reportes.test.js"
Tarea: "Prueba de integración de la historia US-S4-01 ... en backend/tests/integration/reportes-clientes-us-s4-01.test.js"

# Lanzar junto con la consulta del modelo:
Tarea: "Añadir en backend/src/models/reporte.model.js las consultas de solo lectura de clientes ..."
```

---

## Estrategia de implementación

### MVP primero (solo la Historia US-S4-01)

1. Completar la Fase 1: Setup
2. Completar la Fase 2: Foundational (CRÍTICA: bloquea todas las historias)
3. Completar la Fase 3: Historia US-S4-01
4. **PARAR y VALIDAR**: probar US-S4-01 de forma independiente
5. Demostrar si ya es suficiente

### Entrega incremental

1. Completar Setup + Foundational → la base compartida está lista
2. US-S4-01 → probar de forma independiente → demostrar (¡MVP!)
3. US-S4-02 → probar de forma independiente → demostrar
4. US-S4-03 → probar de forma independiente → demostrar
5. US-S4-04 → probar de forma independiente → demostrar
6. US-S4-05 → probar de forma independiente → demostrar
7. US-S4-06 → probar de forma independiente → demostrar
8. US-S4-07 → cierre y calidad del MVP → entregar

### Estrategia de equipo en paralelo

Con varios desarrolladores:

1. El equipo completa Setup + Foundational de forma conjunta
2. Una vez terminada la fase Foundational:
   - Desarrollo A: US-S4-01 y US-S4-02 (reportes de clientes y de membresías)
   - Desarrollo B: US-S4-03 y US-S4-04 (reportes de pagos, adeudos y accesos)
   - Desarrollo C: US-S4-05 y US-S4-06 (exportación y auditoría)
3. US-S4-07 se integra al final con el conjunto de las historias anteriores

---

## Notas

- Las tareas de pruebas están incluidas porque lo exigen FR-027, FR-031, el principio X de la
  constitución y `docs/sprint-4.md` §11; se ejecutan con la infraestructura existente (`node:test` +
  `supertest` + `backend/tests/ayuda/base-pruebas.js`), sin dependencias nuevas.
- Cada tarea indica la ruta exacta del archivo; los identificadores, los mensajes de error y los
  códigos HTTP siguen `contracts/api-reportes.md`, y las reglas de cálculo, `data-model.md`.
- Cada tarea cita los requisitos funcionales que satisface: los 45 FR del spec quedan referenciados
  en al menos una tarea.
- El identificador de historia usa el código completo del spec (`[US-S4-01]`), como en el Sprint 3,
  para que la trazabilidad requisito → historia → tarea → prueba sea directa.
- Este sprint no crea tablas ni migraciones: la auditoría de reportes se registra en la tabla
  `auditoria` existente (research.md §D5).
- La única dependencia nueva es `pdfkit`, justificada en research.md §D1 conforme a FR-045.
- Los archivos de prueba nuevos deben ir en `backend/tests/contract/` o `backend/tests/integration/`
  con sufijo `.test.js`, porque el script `npm test` solo recoge esos dos patrones.
- Commits pequeños por tarea o grupo lógico, en Conventional Commits (tipo y alcance en inglés,
  descripción en español).
- Al cerrar cada historia, ejecutar `npm test` completo en `backend/` para detectar regresiones
  tempranas en las historias anteriores.
