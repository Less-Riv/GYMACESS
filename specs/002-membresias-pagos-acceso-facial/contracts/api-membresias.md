# Contrato de la API REST: Tipos de membresía y membresías (Sprint 2)

**Funcionalidad**: `002-membresias-pagos-acceso-facial`
**Fecha**: 2026-10-15

Base URL en desarrollo: `http://localhost:3000/api`. Todas las respuestas usan JSON y todas las
rutas marcadas con 🔒 requieren `Authorization: Bearer <token>`. Los errores usan el envelope
del Sprint 1: `{ "mensaje": "...", "codigo": "CODIGO_INTERNO" }` (ver
`specs/001-base-usuarios-clientes/contracts/api.md`).

## Matriz de permisos

| Operación | admin | recepcionista | entrenador | cliente |
|-----------|:-----:|:-------------:|:----------:|:-------:|
| Consultar tipos de membresía | ✅ (todos) | ✅ (solo los activos) | ❌ 403 | ❌ 403 |
| Crear / modificar tipos de membresía | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| Asignar membresía | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Renovar membresía | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Consultar membresías | ✅ (todas) | ✅ (todas) | ✅ (solo: cliente, tipo, fechas y estado) | ❌ 403 (solo la propia, en `/api/mi-cuenta`) |

## Endpoints

### Tipos de membresía

#### `GET /api/tipos-membresia` 🔒 admin, recepcionista

Lista los tipos de membresía. El administrador ve todos (incluidos los inactivos); el
recepcionista solo los activos, que necesita para asignar y renovar membresías (SC-001;
decisión 2026-10-15).

```json
{ "tipos": [ { "id_tipo_membresia": 1, "nombre": "Mensual", "descripcion": "...", "duracion": 30, "precio": "500.00", "estado": "activo" } ] }
```

#### `POST /api/tipos-membresia` 🔒 admin

Cuerpo: `{ "nombre": "Mensual", "descripcion": "...", "duracion": 30, "precio": 500 }`.

- **201** con el tipo creado.
- **400** `VALIDACION`: nombre vacío, duración ≤ 0 o precio negativo (FR-001).

#### `PUT /api/tipos-membresia/:id` 🔒 admin

Cuerpo con los campos a modificar (nombre, descripcion, duracion, precio, estado). Las
membresías existentes conservan su relación con el tipo (US-S2-01 esc. 4).

- **200** con el tipo actualizado.
- **404** `NO_ENCONTRADO` si el id no existe.
- **400** `VALIDACION` con los mismos criterios del alta.

### Membresías

#### `POST /api/membresias` 🔒 admin, recepcionista

Asigna una membresía. Cuerpo: `{ "id_cliente": 1, "id_tipo_membresia": 1, "fecha_inicio": "2026-10-15" }`.

Respuesta **201**:

```json
{ "membresia": { "id_membresia": 7, "id_cliente": 1, "tipo": "Mensual", "fecha_inicio": "2026-10-15", "fecha_fin": "2026-11-14", "estado": "activo" } }
```

- **400** `VALIDACION`: cliente o tipo inexistente (RN-01, RN-02), fechas inválidas (RN-03),
  cliente inactivo.
- **409** `CONFLICTO_MEMBRESIA_ACTIVA`: el cliente ya tiene una membresía activa (FR-005).

#### `PUT /api/membresias/:id/renovar` 🔒 admin, recepcionista

Cuerpo: `{ "id_tipo_membresia": 1 }` (el tipo cuya duración se suma a la vigencia actual).

- **200** con la membresía y su nueva fecha de finalización.
- **409** `MEMBRESIA_NO_RENOVABLE`: la membresía está suspendida o cancelada (FR-005).
- **404** `NO_ENCONTRADO` si no existe.

#### `GET /api/membresias?cliente_id=1` 🔒 admin, recepcionista, entrenador

Lista membresías (opcionalmente filtradas por cliente). El entrenador recibe solo: cliente,
tipo, fechas y estado (sin importes). Se expone el estado efectivo calculado al consultar
(`activo` con fecha vencida ⇒ `vencida`; FR-004).

#### `GET /api/membresias/:id` 🔒 admin, recepcionista

Detalle de una membresía con su estado efectivo. **404** `NO_ENCONTRADO` si no existe.

### No incluidos en este contrato

- No existe operación de suspender o cancelar una membresía en este sprint (FR-004).
- No existe eliminación de membresías.
