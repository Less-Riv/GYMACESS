# Investigación: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Fecha**: 2026-10-19
**Rama**: `003-entrenadores-rutinas-dashboard`
**Plan asociado**: [plan.md](./plan.md)

Este documento resuelve las decisiones técnicas del Sprint 3. El sprint no tiene dependencias
nuevas ni tecnologías por elegir (constitución, principio III), por lo que la investigación se
centra en cómo modelar y resolver las reglas de negocio del spec sin reabrir lo entregado en los
Sprints 1 y 2.

## 1. Relación entrenador ↔ usuario del sistema

**Decisión**: la tabla `entrenadores` guarda una referencia **única y obligatoria** a
`usuarios.id_usuario` (índice único), reutilizando el rol `entrenador` que el Sprint 1 ya
define en el catálogo de roles. La ficha del entrenador agrega nombre de contacto, teléfono,
correo de contacto y estado (`activo`/`inactivo`); los datos de cuenta (correo de acceso y
contraseña) siguen siendo responsabilidad del módulo de usuarios (FR-002).

**Justificación**: cumple RN-15 y evita duplicar credenciales o catálogos de roles; el
administrador primero crea el usuario con rol entrenador (Sprint 1) y luego da de alta el
entrenador (FR-001), encadenando ambos módulos sin reimplementar ninguno.

**Alternativas consideradas**: (a) clonar los datos de la cuenta dentro de `entrenadores`
(descartada: duplica información y la desincroniza); (b) inferir el entrenador por el rol del
usuario sin tabla propia (descartada: no permite estado propio, histórico de asignaciones ni
relación 1:N con clientes).

## 2. Unicidad de la asignación activa y de la rutina activa por cliente

**Decisión**: ambas reglas (una única asignación activa y una única rutina activa por cliente)
se garantizan con **validación transaccional en el servicio**, dentro de una transacción
`START TRANSACTION` con lectura bloqueante (`SELECT ... FOR UPDATE`) de la fila vigente del
cliente antes de insertar la nueva y cerrar la anterior. No se crean columnas generadas ni
índices parciales.

**Justificación**: MySQL 8 no admite índices únicos parciales (tipo `WHERE estado = 'activa'`),
y la columna generada `activa_flag` con índice único complicaría la migración sin aportar nada
a la escala de un gimnasio (decenas de clientes). La validación en el servicio deja además el
mensaje de error claro que exigen US-S3-02 esc. 3 y US-S3-03 esc. 4 (FR-004, FR-009), y es
consistente con cómo el Sprint 2 resolvió la "una única membresía activa por cliente" (FR-005
del Sprint 2).

**Alternativas consideradas**: índice único sobre columna generada (más robusta ante concurrencia
extrema, pero añade una mecánica de esquema que el equipo no ha usado en ningún sprint); bloqueo
a nivel de fila del cliente (elegida, la fila de `clientes` es el punto natural de serialización).

## 3. Fuente de los indicadores del dashboard

**Decisión**: el dashboard se resuelve con **consultas consolidadas parametrizadas en
`dashboard.model.js`**, sin crear tablas de resumen ni vistas materializadas; FR-017 y FR-023
permiten "una vista o consultas consolidadas" y se elige la segunda opción por simplicidad.

**Justificación**: el volumen es el de un gimnasio (menos de 500 clientes), por lo que los
agregados se calculan en milisegundos; con consultas no existe el riesgo de datos desactualizados
del caso límite "dato modificado en su módulo de origen" (US-S3-06 esc. 6, SC-009); y cada
indicador queda documentado en un solo lugar (`api-dashboard.md`), lo que hace verificable
SC-009.

**Alternativas consideradas**: vista SQL en la migración (útil si los agregados fueran
compartidos por varios consumidores; aquí solo los usa el dashboard); tabla de resumen
periódica (descartada: introduce sincronización y queda desactualizada entre refrescos).

## 4. Indicadores y filtro de periodo

**Decisión**: `GET /api/dashboard` acepta `desde` y `hasta` (fechas ISO). **Por defecto**: el
último mes completo hasta hoy (primer día del mes anterior a hoy → hoy). Los indicadores son:
clientes activos, membresías vigentes y vencidas, accesos recientes y rechazados (del periodo),
entrenadores registrados, clientes con y sin entrenador asignado, rutinas activas, objetivos
cumplidos y pendientes (del periodo), porcentaje de objetivos cumplidos sobre el total del
periodo y cantidad de progresos registrados en el periodo (FR-016, clarificación 2026-10-19).

**Justificación**: el filtro de periodo está previsto en US-S3-06 esc. 3 y hace medible
SC-009; el valor por defecto evita que el administrador vea siempre "todo el histórico" sin
quererlo, y coincide con el hábito de revisar el desempeño del último mes.

**Alternativas consideradas**: periodo fijo de 30 días móviles (descartado: los cortes de mes
son los que usa la administración del gimnasio); sin filtro (contradice US-S3-06 esc. 3).

## 5. Auditoría del sprint

**Decisión**: reutilizar `auditoria.service.js` tal como quedó en el Sprint 2 (best-effort,
sin datos sensibles) registrando con `modulo` = `entrenadores`, `asignaciones`, `rutinas` y
`progresos`, y `accion` ∈ {`asignar_entrenador`, `reasignar_entrenador`, `crear_rutina`,
`modificar_rutina`, `registrar_objetivo`, `registrar_progreso`}, con resultado
`exitoso`/`rechazado` (FR-020).

**Justificación**: es exactamente el conjunto de acciones que enumera `docs/sprint-3.md` §6;
reutilizar el servicio existente mantiene un solo formato de registro y una sola consulta
exclusiva del administrador (FR-020), sin duplicar lógica.

**Alternativas consideradas**: registrar también el alta y la baja de entrenadores (descartada
por ahora: `docs/sprint-3.md` §6 limita la auditoría a las tres acciones del sprint; puede
ampliarse si el equipo lo aprueba, conforme al principio I).

## 6. Efecto de la baja de un entrenador y de la reasignación

**Decisión**: ambas operaciones se ejecutan en **una sola transacción**: la baja de un
entrenador (`PUT /api/entrenadores/:id` con `estado = inactivo`) cierra sus asignaciones
activas (`fecha_fin = hoy`, `estado = cerrada`); la reasignación (`PUT /api/asignaciones/:id`)
cierra la asignación vigente del cliente e inserta la nueva, dejando al entrenador anterior sin
acceso de lectura ni edición sobre ese cliente (FR-001, FR-004; sesiones 2026-10-19).

**Justificación**: un estado intermedio (entrenador inactivo con asignaciones activas) dejaría
clientes huérfanos en la vista de carga; la transacción garantiza que la vista de personal
(US-S3-07) siempre refleje la realidad.

**Alternativas consideradas**: cerrar las asignaciones desde un proceso nocturno (descartada:
requiere programación de tareas y retrasa el efecto visible).

## 7. Filtrado por asignación activa en el backend

**Decisión**: cada operación del módulo de entrenamiento resuelve primero la **asignación
activa** del cliente (cuando el actor es un entrenador) y responde `403` si no existe o si el
entrenador autenticado no es el dueño; el filtro se aplica en el modelo con JOIN sobre
`asignaciones_entrenador` con `estado = 'activa'`, nunca en el frontend (FR-015, RN-19;
clarificación 2026-10-19 sobre el entrenador anterior).

**Justificación**: cumple el principio V (ocultar opciones no es seguridad) y hace que la regla
"el entrenador solo gestiona su carga" sea una única comprobación centralizada, reutilizable
por rutinas, objetivos y progresos.

**Alternativas consideradas**: guardar el entrenador actual en la tabla `clientes` (descartada:
rompería el histórico de asignaciones que exige RN-17).

## 8. Vista propia del cliente ("Mi entrenamiento")

**Decisión**: endpoint único `GET /api/mi-entrenamiento` (rol cliente) que devuelve su rutina
activa con ejercicios, sus objetivos y su histórico de progresos, o los mensajes
`sin_rutina_asignada` / `sin_progreso_registrado` cuando no hay datos (FR-013, FR-014); se
añade como pestaña dentro de "Mi cuenta" existente en el frontend.

**Justificación**: mantiene el patrón de "solo lo propio" entregado en el Sprint 2
(`/api/mi-cuenta`), evita endpoints fragmentados y centraliza el filtrado por el cliente
autenticado.

**Alternativas consideradas**: endpoints separados `mi-rutina`, `mi-progreso` (más peticiones
sin ventaja); reutilizar `/api/mi-cuenta` del Sprint 2 (descartada: FR-029 pide no modificar el
comportamiento entregado, salvo ajustes mínimos).

## 9. Estrategia de pruebas

**Decisión**: las mismas herramientas de los sprints anteriores: `node:test` + `supertest`
contra la base de pruebas (tests de contrato por endpoint y tests de integración por historia,
con `--test-concurrency=1` para evitar interferencias de datos compartidos), más la validación
manual de extremo a extremo de `quickstart.md` para el dashboard y las vistas de rol.

**Justificación**: reutiliza `backend/tests/ayuda/base-pruebas.js` y el patrón ya probado en
los Sprints 1 y 2, cumpliendo el principio X sin agregar herramientas.

**Alternativas consideradas**: instalar un runner de pruebas adicional (jest, mocha):
descartado por el principio III (sin dependencias innecesarias).
