# Modelo de Datos: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Fecha**: 2026-10-19
**Rama**: `003-entrenadores-rutinas-dashboard`
**Fuente**: [spec.md](./spec.md) (entidades clave) y `docs/project-context.md` §14

Todas las tablas usan motor InnoDB, codificación `utf8mb4` y claves foráneas con integridad
referencial. Las tablas de los Sprints 1 y 2 (`usuarios`, `clientes`, `tipos_membresia`,
`membresias`, `pagos`, `rostros`, `accesos`, `auditoria`) **no se modifican ni se duplican**;
solo se consultan (FR-022, FR-029).

## Tablas existentes reutilizadas (sin redefinir)

- **usuarios**: id_usuario, nombre, correo, password (bcrypt), rol (administrador, recepcionista,
  entrenador, cliente), estado, cliente_id (FK opcional a clientes), fecha_creacion. Se consulta
  para validar el rol de la cuenta asociada a un entrenador (RN-15) y para el filtro del rol
  autenticado.
- **clientes**: id_cliente, nombre, apellido, correo, telefono, direccion, fecha_registro,
  estado (activo, inactivo). Se consulta para asignar entrenadores (RN-01) y para los agregados
  del dashboard.
- **membresias**, **accesos**: solo se agregan en los indicadores del dashboard (membresías
  vigentes/vencidas, accesos recientes y rechazados).
- **auditoria**: recibe las acciones de este sprint (FR-020); su consulta sigue siendo exclusiva
  del administrador (FR-020, Sprint 2).

## Tablas nuevas (migración `003_crear_tablas_sprint3.sql`)

### entrenadores

Personal de coaching del gimnasio; uno por cuenta de usuario (RN-15).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id_entrenador | INT UNSIGNED | PK, autoincremento |
| id_usuario | INT UNSIGNED | FK NOT NULL → usuarios.id_usuario, **ÚNICO** |
| nombre | VARCHAR(80) | NOT NULL |
| telefono | VARCHAR(30) | NULL |
| correo_contacto | VARCHAR(120) | NULL |
| estado | ENUM('activo','inactivo') | DEFAULT 'activo' |
| fecha_registro | DATETIME | DEFAULT CURRENT_TIMESTAMP |

Validaciones (FR-001, FR-002): la cuenta debe existir, estar activa y tener rol `entrenador`, y
no estar ya asociada a otro entrenador; la baja lógica cierra sus asignaciones activas
(FR-001, investigación §6).

### asignaciones_entrenador

Vínculo entre un cliente y su entrenador principal en un periodo de seguimiento; una sola activa
por cliente (RN-16). El histórico nunca se elimina (RN-17).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id_asignacion | INT UNSIGNED | PK, autoincremento |
| id_cliente | INT UNSIGNED | FK NOT NULL → clientes.id_cliente |
| id_entrenador | INT UNSIGNED | FK NOT NULL → entrenadores.id_entrenador |
| fecha_asignacion | DATE | NOT NULL |
| fecha_fin | DATE | NULL (obligatoria al cerrar la asignación) |
| estado | ENUM('activa','cerrada') | DEFAULT 'activa' |

Índices: `ix_asignaciones_cliente_estado (id_cliente, estado)`,
`ix_asignaciones_entrenador (id_entrenador)`.

Validaciones (FR-003, FR-004): cliente existente y activo; entrenador existente y activo; una
única asignación `activa` por cliente (garantizada transaccionalmente, investigación §2); al
reasignar o dar de baja al entrenador, la asignación vigente pasa a `cerrada` con `fecha_fin`.

### rutinas

Plan de entrenamiento de un cliente; una sola activa por cliente (FR-009). El histórico nunca se
elimina.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id_rutina | INT UNSIGNED | PK, autoincremento |
| id_cliente | INT UNSIGNED | FK NOT NULL → clientes.id_cliente |
| id_entrenador | INT UNSIGNED | FK NOT NULL → entrenadores.id_entrenador (creador) |
| nombre | VARCHAR(80) | NOT NULL |
| descripcion | VARCHAR(255) | NULL |
| estado | ENUM('activa','finalizada') | DEFAULT 'activa' |
| fecha_creacion | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| fecha_actualizacion | DATETIME | NULL |

Índices: `ix_rutinas_cliente_estado (id_cliente, estado)`,
`ix_rutinas_entrenador (id_entrenador)`.

Validaciones (FR-007, FR-008): cliente con asignación activa del entrenador autenticado
(RN-19); al crear una rutina nueva, la rutina activa anterior pasa a `finalizada` (FR-009);
la modificación actualiza `fecha_actualizacion` y no altera los progresos ya registrados.

### ejercicios_rutina

Detalle de una rutina; cada ejercicio debe indicar series, repeticiones o instrucciones
(RN-18).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id_ejercicio_rutina | INT UNSIGNED | PK, autoincremento |
| id_rutina | INT UNSIGNED | FK NOT NULL → rutinas.id_rutina (ON DELETE CASCADE) |
| nombre | VARCHAR(80) | NOT NULL |
| series | SMALLINT UNSIGNED | NULL, > 0 |
| repeticiones | VARCHAR(30) | NULL (ej. "10-12", "al fallo") |
| carga | VARCHAR(40) | NULL (ej. "20 kg", "banda media") |
| instrucciones | VARCHAR(255) | NULL |
| orden | SMALLINT UNSIGNED | NOT NULL |

Validación (FR-008): al menos uno de `series`, `repeticiones` o `instrucciones` debe venir con
valor; la lista se reemplaza en su conjunto desde el frontend (PUT de ejercicios).

### objetivos_entrenamiento

Metas fijadas para un cliente (RN-21); el histórico se conserva (RN-17).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id_objetivo | INT UNSIGNED | PK, autoincremento |
| id_cliente | INT UNSIGNED | FK NOT NULL → clientes.id_cliente |
| id_entrenador | INT UNSIGNED | FK NOT NULL → entrenadores.id_entrenador |
| descripcion | VARCHAR(255) | NOT NULL |
| fecha_objetivo | DATE | NULL |
| estado | ENUM('pendiente','en_curso','cumplido','cancelado') | DEFAULT 'pendiente' |
| fecha_creacion | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| fecha_cierre | DATE | NULL (obligatoria al cumplir o cancelar) |

Validaciones (FR-010): solo el entrenador con asignación activa del cliente puede registrar o
modificar objetivos (RN-19, RN-21); los cambios de estado conservan la fecha de cierre para
poder comparar metas (US-S3-04 esc. 6).

### progresos_clientes

Histórico inmutable de evolución del cliente (FR-011; sesión 2026-10-19 fija los campos).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id_progreso | INT UNSIGNED | PK, autoincremento |
| id_cliente | INT UNSIGNED | FK NOT NULL → clientes.id_cliente |
| id_entrenador | INT UNSIGNED | FK NOT NULL → entrenadores.id_entrenador |
| id_objetivo | INT UNSIGNED | FK NULL → objetivos_entrenamiento.id_objetivo |
| fecha | DATE | NOT NULL |
| comentario | VARCHAR(500) | NOT NULL |
| peso | DECIMAL(5,2) | NULL, > 0 (kg) |
| pecho | DECIMAL(5,1) | NULL (cm) |
| cintura | DECIMAL(5,1) | NULL (cm) |
| cadera | DECIMAL(5,1) | NULL (cm) |
| muslos | DECIMAL(5,1) | NULL (cm) |

Índices: `ix_progresos_cliente_fecha (id_cliente, fecha)`.

Validaciones (FR-011, clarificación 2026-10-19): el peso y las medidas son opcionales, basta la
fecha y el comentario; `id_objetivo` es opcional y, si viene, debe pertenecer al mismo cliente;
**no existen endpoints de modificación ni eliminación** para esta tabla (histórico, RN-17).

### vista_dashboard (no es una tabla)

No se crea ninguna tabla de resumen: los indicadores se calculan con consultas consolidadas en
`dashboard.model.js` (FR-017, FR-023, investigación §3). Cada indicador y su definición exacta
están documentados en `contracts/api-dashboard.md`.

## Relaciones

- Un **usuario** con rol entrenador se asocia a **un entrenador** (1:1, índice único).
- Un **cliente** tiene varias **asignaciones** en su histórico; **una sola activa** (RN-16).
- Un **entrenador** tiene varias **asignaciones** (carga de trabajo).
- Un **cliente** tiene varias **rutinas**; **una sola activa** (FR-009); una **rutina** agrupa
  varios **ejercicios** (1:N).
- Un **entrenador** crea varias **rutinas** (solo para clientes de su carga).
- Un **cliente** tiene varios **objetivos** y varios **progresos**; un **progreso** puede
  apuntar a un **objetivo** del mismo cliente (opcional).
- Un **usuario** genera varios registros de **auditoría** (acciones del sprint: FR-020).

## Cálculos y reglas de validación

| Regla | Definición | Origen |
|-------|------------|--------|
| Cierre de asignación | fecha_fin = hoy, estado = 'cerrada' al reasignar o al dar de baja al entrenador | FR-001, FR-004 |
| Rutina activa única | al crear una rutina, la activa anterior del cliente pasa a 'finalizada' | FR-009 |
| Ejercicio válido | nombre no vacío y al menos uno de series (>0), repeticiones o instrucciones | RN-18, FR-008 |
| Objetivo cumplido | estado 'cumplido' o 'cancelado' ⇒ fecha_cierre informada | FR-010 |
| Progreso válido | fecha válida, comentario no vacío; peso > 0 si viene; medidas ≥ 0 si vienen | FR-011 |
| Progreso histórico | sin endpoints PUT/DELETE sobre `progresos_clientes` | FR-011, RN-17 |
| Filtro de entrenador | toda operación del módulo resuelve la asignación activa del cliente y exige que sea el entrenador autenticado, si el rol es entrenador | RN-19, investigación §7 |
| Baja de entrenador | estado 'inactivo' + cierre transaccional de sus asignaciones activas | FR-001 |
| Dashboard (por defecto) | periodo = primer día del mes anterior → hoy | investigación §4 |
| Objetivos cumplidos (%) | objetivos con estado 'cumplido' en el periodo ÷ total de objetivos del periodo × 100 (0 si no hay objetivos) | FR-016, clarificación 2026-10-19 |
