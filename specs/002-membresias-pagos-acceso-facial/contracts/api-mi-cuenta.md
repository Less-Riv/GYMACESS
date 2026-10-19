# Contrato de la API REST: Mi cuenta del cliente (Sprint 2)

**Funcionalidad**: `002-membresias-pagos-acceso-facial`
**Fecha**: 2026-10-15

Vistas propias del rol cliente (FR-028, US-S2-10, clarificación Q5). Convenciones y envelope
de errores: idénticos al Sprint 1. Todas las rutas 🔒 requieren token de un usuario con rol
**cliente** y devuelven **solo** datos del cliente autenticado; no hay parámetros para consultar
a terceros, y cualquier petición sobre datos de otro cliente responde **403** `AUTORIZACION`.

La ruta `GET /api/clientes/mi-cuenta` del Sprint 1 (perfil personal) se mantiene sin cambios;
estas rutas añaden la información financiera y de acceso.

## Endpoints

### `GET /api/mi-cuenta/membresia` 🔒 cliente

Membresía con vigencia y estado efectivo (FR-004, US-S2-10 esc. 1). Sin membresía:

```json
{ "membresia": null, "mensaje": "No tienes una membresía asignada" }
```

Con membresía:

```json
{ "membresia": { "tipo": "Mensual", "duracion": 30, "fecha_inicio": "2026-10-15", "fecha_fin": "2026-11-14", "dias_restantes": 30, "estado": "activo" } }
```

### `GET /api/mi-cuenta/pagos` 🔒 cliente

Historial propio con monto, fecha, método de pago y membresía asociada (FR-008, US-S2-10 esc. 2).

```json
{ "pagos": [ { "id_pago": 12, "monto": "250.00", "fecha_pago": "...", "metodo_pago": "efectivo", "tipo_membresia": "Mensual" } ] }
```

### `GET /api/mi-cuenta/adeudo` 🔒 cliente

Saldo pendiente con la fórmula de FR-007 (US-S2-10 esc. 3 y 7):

```json
{ "precio_membresia": "500.00", "total_pagado": "250.00", "saldo_pendiente": "250.00", "estado_cuenta": "pendiente" }
```

Cuando no hay adeudo, `saldo_pendiente` es `"0.00"` y `estado_cuenta` es `"al_corriente"`. Sin
membresía ni pagos, se informa con un mensaje claro en lugar de datos vacíos (US-S2-10 esc. 6).

### `GET /api/mi-cuenta/accesos` 🔒 cliente

Los propios intentos de acceso con fecha, hora, resultado y motivo cuando aplique (FR-014,
US-S2-10 esc. 4).

```json
{ "accesos": [ { "fecha": "2026-10-15", "hora": "10:55:00", "resultado": "autorizado", "motivo": null } ] }
```
