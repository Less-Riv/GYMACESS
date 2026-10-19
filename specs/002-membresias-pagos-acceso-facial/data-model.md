# Modelo de Datos: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Fecha**: 2026-10-15
**Rama**: `002-membresias-pagos-acceso-facial`
**Fuente**: [spec.md](./spec.md) (entidades clave) y `docs/project-context.md` §14

Todas las tablas usan motor InnoDB, codificación `utf8mb4` y claves foráneas con integridad
referencial. Las tablas del Sprint 1 (`usuarios`, `clientes`) no se modifican; `tipos_membresia`,
`membresias` y `pagos` se reutilizan sin duplicarse y solo reciben el ajuste mínimo indicado.

## Tablas existentes (Sprint 1, sin redefinir)

- **usuarios**: id_usuario, nombre, correo, password (bcrypt), rol (administrador, recepcionista,
  entrenador, cliente), estado, cliente_id (FK opcional a clientes), fecha_creacion.
- **clientes**: id_cliente, nombre, apellido, correo, telefono, direccion, fecha_registro,
  estado (activo, inactivo).
- **tipos_membresia**: id_tipo_membresia, nombre, descripcion, duracion (días), precio
  DECIMAL(10,2), estado. En este sprint se vuelven funcionales (FR-001).
- **membresias**: id_membresia, id_cliente (FK), id_tipo_membresia (FK), fecha_inicio DATE,
  fecha_fin DATE, estado ENUM('activo','vencida','suspendida','cancelada'). Funcional en este
  sprint (FR-002 a FR-005).
- **pagos**: id_pago, id_cliente (FK), id_membresia (FK), monto DECIMAL(10,2), fecha_pago
  DATETIME, metodo_pago, estado. Funcional en este sprint (FR-006 a FR-008).

### Ajuste en una tabla existente

- **pagos.id_membresia**: pasa a `NOT NULL` mediante la migración `002`, porque la política de
  clarificación exige que todo pago esté asociado a una membresía del mismo cliente (RN-05,
  FR-006). La tabla no tiene datos funcionales (el Sprint 1 no registró pagos), por lo que el
  ajuste no afecta información existente.

## Tablas nuevas (migración `002_crear_tablas_sprint2.sql`)

### rostros

Información facial necesaria para identificar a un cliente; un solo registro por cliente.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id_rostro | BIGINT UNSIGNED | PK, autoincremento |
| id_cliente | BIGINT UNSIGNED | FK NOT NULL → clientes.id_cliente, **ÚNICO** (1:1) |
| descriptor | TEXT NOT NULL | Arreglo JSON de 128 números (descriptor facial) |
| fecha_registro | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| estado | ENUM('activo','inactivo') | DEFAULT 'activo' (permite desactivación lógica) |

Validaciones (FR-009, FR-017): el cliente debe existir y estar activo; el descriptor debe ser un
arreglo de 128 valores numéricos; el registro se actualiza (no se duplica) al volver a capturar;
la API jamás devuelve el descriptor.

### accesos

Registro de cada intento de entrada; no se eliminan de manera ordinaria (RN-10, FR-014).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id_acceso | BIGINT UNSIGNED | PK, autoincremento |
| id_cliente | BIGINT UNSIGNED | FK NULL → clientes.id_cliente (solo si hubo identificación exitosa) |
| fecha | DATE | NOT NULL |
| hora | TIME | NOT NULL |
| resultado | ENUM('autorizado','rechazado') | NOT NULL |
| motivo | VARCHAR(80) | NULL; obligatorio cuando resultado = 'rechazado' |

Catálogo de motivos: `identificacion_no_reconocida`, `membresia_vencida`,
`membresia_suspendida`, `membresia_cancelada`, `membresia_inexistente`.

### auditoria

Acciones importantes del sistema; consulta exclusiva del administrador (FR-016,
`docs/project-context.md` §7.10).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id_auditoria | BIGINT UNSIGNED | PK, autoincremento |
| id_usuario | BIGINT UNSIGNED | FK NOT NULL → usuarios.id_usuario |
| accion | VARCHAR(60) | NOT NULL (asignar membresía, renovar membresía, registrar pago, registrar rostro, resultado de acceso) |
| modulo | VARCHAR(40) | NOT NULL (membresias, pagos, rostros, accesos) |
| fecha | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| resultado | VARCHAR(20) | NOT NULL (exitoso / rechazado) |
| descripcion | VARCHAR(255) | Detalle claro sin datos biométricos |

## Relaciones

- Un **cliente** tiene una o varias **membresías** (1:N).
- Un **tipo de membresía** se relaciona con varias **membresías** (1:N).
- Un **cliente** tiene varios **pagos**; una **membresía** recibe varios **pagos** (el pago
  siempre pertenece al dueño de la membresía; RN-05).
- Un **cliente** tiene **un solo registro** en `rostros` (1:1, por índice único).
- Un **cliente** tiene varios **registros de acceso**; un acceso sin identificación exitosa
  queda con `id_cliente` NULL.
- Un **usuario** genera varios registros de **auditoría**.

## Cálculos y reglas de validación

| Regla | Definición | Origen |
|-------|------------|--------|
| Fecha de finalización | fecha_fin = fecha_inicio + duración del tipo | FR-002, RN-03 |
| Renovación | fecha_fin nueva = fecha_fin actual + duración del tipo elegido; solo en estados activo o vencido | FR-005, clarificación Q1 |
| Membresía única activa | No se crea una segunda membresía si ya hay una activa vigente | FR-005, clarificación Q1 |
| Estado efectivo | estado almacenado 'activo' + fecha_fin < hoy ⇒ vencida al consultar; sin tolerancia | FR-004, clarificación Q1 |
| Pago válido | monto > 0, método en {efectivo, transferencia}, membresía del mismo cliente | FR-006, FR-020, clarificación Q2 |
| Adeudo | precio vigente del tipo de la membresía − SUMA(pagos registrados del cliente); nunca negativo | FR-007, clarificación Q2 |
| Identificación | distancia euclidiana ponderada ≤ umbral (0.5 por defecto, variable `FACIAL_UMBRAL`) | FR-011, research.md |
| Validación de acceso | Solo tras identificación exitosa; autorizado si la membresía está activa y vigente | FR-012, RN-09 |
| Registro de acceso | Todo intento genera registro; rechazados con motivo; sin eliminación ordinaria | FR-014, RN-10, RN-11 |

## Transiciones de estado

```text
membresias.estado (almacenado)
 activo ──(fecha_fin < hoy)──▶ vencida (efectiva al consultar, no se reescribe)
 activo / vencido ──(renovar)──▶ activo con fecha_fin extendida
 activo ──(asignar otra)──▶ rechazada, sin cambio (una sola activa)
 suspendida / cancelada ──(cualquier operación)──▶ rechazada; solo se marcan fuera de la app

rostros.estado
  activo ──(desactivación lógica)──▶ inactivo (no identifica)
  activo ──(nueva captura del mismo cliente)──▶ actualiza descriptor, sigue 1:1

accesos.resultado (solo inserción, nunca UPDATE ni DELETE)
  autorizado ⇔ identificación exitosa + membresía activa y vigente
  rechazado  ⇔ cualquier otro caso, con motivo
```
