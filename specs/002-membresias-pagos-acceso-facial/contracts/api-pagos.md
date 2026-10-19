# Contrato de la API REST: Pagos y adeudos (Sprint 2)

**Funcionalidad**: `002-membresias-pagos-acceso-facial`
**Fecha**: 2026-10-15

Convenciones y envelope de errores: idénticos al Sprint 1 (ver
`specs/001-base-usuarios-clientes/contracts/api.md`).

## Matriz de permisos

| Operación | admin | recepcionista | entrenador | cliente |
|-----------|:-----:|:-------------:|:----------:|:-------:|
| Registrar pago | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Consultar pagos de un cliente | ✅ | ✅ | ❌ 403 | ❌ 403 (solo los propios, en `/api/mi-cuenta`) |
| Consultar adeudos | ✅ | ❌ 403 | ❌ 403 | ❌ 403 (solo el propio, en `/api/mi-cuenta`) |

## Endpoints

### `POST /api/pagos` 🔒 admin, recepcionista

Registra un pago. Cuerpo:

```json
{ "id_cliente": 1, "id_membresia": 7, "monto": 250, "metodo_pago": "efectivo" }
```

- **201** con el pago registrado (la fecha la pone el servidor):

```json
{ "pago": { "id_pago": 12, "id_cliente": 1, "id_membresia": 7, "monto": "250.00", "fecha_pago": "2026-10-15T10:30:00", "metodo_pago": "efectivo" } }
```

- **400** `VALIDACION`: monto ≤ 0 (RN-05) o método fuera del catálogo {efectivo, transferencia}
  (FR-020, clarificación Q2).
- **409** `PAGO_MEMBRESIA_AJENA`: la membresía no pertenece al cliente indicado (RN-05).
- **404** `NO_ENCONTRADO`: cliente o membresía inexistentes.

### `GET /api/pagos?cliente_id=1` 🔒 admin, recepcionista

Historial completo del cliente en orden cronológico. Respuesta:

```json
{ "pagos": [ { "id_pago": 12, "monto": "250.00", "fecha_pago": "...", "metodo_pago": "efectivo", "id_membresia": 7, "tipo_membresia": "Mensual" } ] }
```

### `GET /api/pagos/adeudos?cliente_id=1` 🔒 admin

Calcula el saldo pendiente: precio vigente del tipo de la membresía del cliente menos la suma
de sus pagos registrados (FR-007, clarificación Q2). Sin pagos, el adeudo es el precio completo
(US-S2-10 esc. 7).

```json
{ "adeudos": [ { "id_cliente": 1, "nombre_completo": "María López", "precio_membresia": "500.00", "total_pagado": "250.00", "saldo_pendiente": "250.00" } ] }
```

### No incluidos en este contrato

- No existe eliminación de pagos (RN-06, FR-007).
- No existe operación de anulación de pagos en este sprint (clarificación Q2).
- No hay integración con bancos ni plataformas externas (`docs/sprint-2.md` §8).
