# Contrato de la API REST: Rostros, identificación y accesos (Sprint 2)

**Funcionalidad**: `002-membresias-pagos-acceso-facial`
**Fecha**: 2026-10-15

Convenciones y envelope de errores: idénticos al Sprint 1 (ver
`specs/001-base-usuarios-clientes/contracts/api.md`). El descriptor facial viaja como arreglo
JSON de 128 números y **nunca** se devuelve en ninguna respuesta (FR-017, principio V).

## Matriz de permisos

| Operación | admin | recepcionista | entrenador | cliente |
|-----------|:-----:|:-------------:|:----------:|:-------:|
| Registrar / actualizar rostro | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Consultar estado del registro facial | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Identificar en el punto de acceso | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Listar accesos (completo, con filtros y motivos) | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Listar accesos (vista básica: cliente, fecha, hora, resultado) | ✅ | ✅ | ✅ | ❌ 403 |
| Consultar mis accesos (propios) | ❌ | ❌ | ❌ | ✅ (solo los propios) |

## Endpoints

### `POST /api/rostros/:idCliente` 🔒 admin, recepcionista

Registra o **actualiza** la información facial (un registro por cliente, sin duplicados).
Cuerpo: `{ "descriptor": [ 0.012, -0.034, ... ] }` (128 valores numéricos).

- **201** si se creó, **200** si se actualizó el existente:

```json
{ "rostro": { "id_cliente": 1, "estado_registro": "completo", "fecha_registro": "2026-10-15T10:40:00" } }
```

- **400** `VALIDACION`: descriptor ausente o sin 128 valores numéricos.
- **404** `NO_ENCONTRADO`: cliente inexistente.
- **409** `CLIENTE_INACTIVO`: el cliente está inactivo (FR-009).

### `GET /api/rostros/:idCliente` 🔒 admin, recepcionista

Estado del registro facial (completo/pendiente) y metadatos; sin datos biométricos crudos
(FR-017, US-S2-06 esc. 5).

```json
{ "estado_registro": "completo", "fecha_registro": "2026-10-15T10:40:00" }
```

### `POST /api/accesos/identificar` 🔒 admin, recepcionista

Punto de acceso: recibe el descriptor capturado, lo compara con los registrados (umbral
`FACIAL_UMBRAL`, 0.5 por defecto), valida la membresía y **registra siempre** el intento en
`accesos` (RN-10). Cuerpo: `{ "descriptor": [ ...128 valores... ] }`.

Identificación exitosa con membresía vigente:

```json
{ "identificado": true, "autorizado": true, "cliente": { "id_cliente": 1, "nombre": "María", "apellido": "López" } }
```

Identificación exitosa sin membresía vigente:

```json
{ "identificado": true, "autorizado": false, "motivo": "membresia_vencida", "cliente": { "id_cliente": 1, "nombre": "María", "apellido": "López" } }
```

Rostro no reconocido:

```json
{ "identificado": false, "autorizado": false, "motivo": "identificacion_no_reconocida" }
```

- **400** `VALIDACION`: descriptor inválido.
- **500** `INTERNO`: fallo de procesamiento o de base de datos; en ningún caso queda un acceso
  registrado como autorizado (caso límite de la spec).

### `GET /api/accesos?fecha=2026-10-15&resultado=autorizado&cliente_id=1` 🔒 admin, recepcionista

Listado completo con filtros opcionales por fecha, resultado y cliente (FR-015). Cada registro
incluye cliente (cuando aplique), fecha, hora, resultado y motivo de rechazo.

### `GET /api/accesos/basicos` 🔒 entrenador

Vista básica (cliente, fecha, hora y resultado) sin motivos de rechazo, reconocida por el
principio VI de `docs/reglas.md`.

### `GET /api/accesos/mis-accesos` 🔒 cliente

Los accesos del propio cliente autenticado (FR-028, US-S2-10 esc. 4), siempre filtrados por el
token; cualquier intento de consultar accesos de otro cliente responde **403**.

### No incluidos en este contrato

- No existen rutas DELETE para `accesos` (ni para `pagos`): los historiales no se eliminan de
  manera ordinaria (RN-06, RN-10).
- Ningún endpoint público: toda operación facial requiere JWT (research.md §6).
