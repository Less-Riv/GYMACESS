# Contrato de la API REST: Reportes básicos (Sprint 4)

**Funcionalidad**: `004-reportes-basicos`
**Fecha**: 2026-11-04

Base URL en desarrollo: `http://localhost:3000/api`. Todas las respuestas usan JSON, salvo la
exportación, que devuelve un archivo PDF. Todas las rutas requieren `Authorization: Bearer
<token>`. Los errores usan el envelope del Sprint 1 (`{ "mensaje": "...", "codigo": "CODIGO_INTERNO" }`).

## Matriz de permisos

| Operación | admin | recepcionista | entrenador | cliente |
|-----------|:-----:|:-------------:|:----------:|:-------:|
| Consultar cualquier reporte | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| Exportar cualquier reporte a PDF | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| Consultar la auditoría de reportes | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |

Solo el administrador accede a los reportes (FR-001, RN-25). La auditoría de reportes también es
exclusiva del administrador (FR-025). Una petición sin token válido responde **401**
`AUTH_REQUERIDA`; con token de un rol no autorizado responde **403** `AUTORIZACION`.

## Filtros comunes

Todos los endpoints de consulta aceptan estos parámetros de consulta:

| Parámetro | Formato | Por defecto | Reglas |
| --------- | ------- | ----------- | ------ |
| `desde` | ISO `YYYY-MM-DD` | Primer día del mes anterior | 400 `VALIDACION` si el formato no es ISO |
| `hasta` | ISO `YYYY-MM-DD` | Hoy | 400 `VALIDACION` si el formato no es ISO |
| `estado` | enumerated | Sin filtro | Solo en los reportes que lo admiten; 400 `VALIDACION` si el valor no está en el listado |
| `pagina` | Entero >= 1 | 1 | Se normaliza a 1 si no es válida |

- **400** `VALIDACION` si `desde` > `hasta` (mensaje: "El periodo es inválido: desde no puede ser
  posterior a hasta") o si un formato no es ISO (mensaje: "El parámetro <campo> debe tener formato
  YYYY-MM-DD").
- `desde` = `hasta` es un periodo válido de un solo día.
- `estado` admitido por reporte:

| Reporte | Valores de `estado` | Fuente |
| ------- | -------------------- | ------ |
| Clientes | `activo`, `inactivo` | `clientes.estado` |
| Membresías | `activo`, `vencida`, `suspendida`, `cancelada` | `membresias.estado` |
| Accesos | `autorizado`, `rechazado` | `accesos.resultado` |
| Pagos y adeudos | No admiten filtro por estado | — |

## Envelope de la respuesta

Todos los endpoints de consulta devuelven la misma forma:

```json
{
  "tipo": "clientes",
  "periodo": { "desde": "2026-01-01", "hasta": "2026-11-04" },
  "totales": { },
  "subtotales": { },
  "filas": [],
  "paginacion": { "pagina": 1, "limite": 20, "total": 0, "totalPaginas": 0 }
}
```

- `totales` contiene los agregados del conjunto filtrado completo, nunca de la página visible
  (FR-017, SC-002).
- `subtotales` solo aparece en los reportes donde el dato aporta agrupación natural.
- `filas` vacío con `totales` en cero es el resultado vacío de un filtro sin coincidencias, y no un
  error (FR-015, RN-33).

---

## Reporte de clientes

`GET /api/reportes/clientes?desde=&hasta=&estado=&pagina=` 🔒 admin

Detalle: `id_cliente`, `nombre_completo`, `correo`, `telefono`, `fecha_registro`, `estado`.

```json
{
  "tipo": "clientes",
  "periodo": { "desde": "2026-10-01", "hasta": "2026-11-04" },
  "totales": {
    "total": 120,
    "por_estado": { "activo": 108, "inactivo": 12 }
  },
  "filas": [
    {
      "id_cliente": 1,
      "nombre_completo": "Ana Pérez",
      "correo": "ana@correo.com",
      "telefono": "5550100",
      "fecha_registro": "2026-10-03",
      "estado": "activo"
    }
  ],
  "paginacion": { "pagina": 1, "limite": 20, "total": 108, "totalPaginas": 6 }
}
```

- El filtro por periodo se aplica sobre `clientes.fecha_registro` (FR-012, RN-27).
- `totales.total` cuenta el conjunto filtrado completo; `paginacion.total` también.

## Reporte de membresías

`GET /api/reportes/membresias?desde=&hasta=&estado=&pagina=` 🔒 admin

Detalle: `id_membresia`, `id_cliente`, `nombre_compliente`, `tipo_membresia`, `fecha_inicio`,
`fecha_fin`, `estado`, `grupo`.

```json
{
  "tipo": "membresias",
  "periodo": { "desde": "2026-10-01", "hasta": "2026-11-04" },
  "totales": {
    "total": 95,
    "activas": 62,
    "proximas_a_vencer": 8,
    "vencidas": 19,
    "suspendidas_o_canceladas": 6
  },
  "filas": [
    {
      "id_membresia": 14,
      "id_cliente": 1,
      "nombre_compliente": "Ana Pérez",
      "tipo_membresia": "Mensual",
      "fecha_inicio": "2026-10-03",
      "fecha_fin": "2026-11-03",
      "estado": "activo",
      "grupo": "proximas_a_vencer"
    }
  ],
  "paginacion": { "pagina": 1, "limite": 20, "total": 95, "totalPaginas": 5 }
}
```

- El filtro por periodo se aplica sobre el periodo de vigencia de la membresía.
- `grupo` es uno de `activas`, `proximas_a_vencer`, `vencidas`, `suspendidas_o_canceladas`, con la
  clasificación disjunta de FR-007 y la ventana de 7 días evaluada contra la fecha de hoy.
- Los cuatro grupos son disjuntos y su suma es `totales.total` (SC-014).

## Reporte de pagos e ingresos

`GET /api/reportes/pagos?desde=&hasta=&pagina=` 🔒 admin

Detalle: `id_pago`, `id_cliente`, `nombre_compliente`, `membresia`, `monto`, `fecha_pago`,
`metodo_pago`, `estado`.

```json
{
  "tipo": "pagos",
  "periodo": { "desde": "2026-10-01", "hasta": "2026-11-04" },
  "totales": { "total_pagos": 40, "total_ingresos": "18400.00" },
  "filas": [
    {
      "id_pago": 88,
      "id_cliente": 1,
      "nombre_compliente": "Ana Pérez",
      "membresia": "Mensual",
      "monto": "450.00",
      "fecha_pago": "2026-10-03",
      "metodo_pago": "Efectivo",
      "estado": "completado"
    }
  ],
  "paginacion": { "pagina": 1, "limite": 20, "total": 40, "totalPaginas": 2 }
}
```

- Solo se listan y se contabilizan los pagos con `estado = 'completado'` (FR-008); el filtro por
  periodo se aplica sobre `DATE(fecha_pago)`.
- Los montos se devuelven como texto con dos decimales, igual que el resto del proyecto.

## Reporte de adeudos

`GET /api/reportes/adeudos?desde=&hasta=&pagina=` 🔒 admin

Detalle: `id_cliente`, `nombre_compliente`, `precio_membresia`, `total_pagado`,
`saldo_pendiente`, `estado_membresia`, `fecha_fin`.

```json
{
  "tipo": "adeudos",
  "periodo": { "desde": "2026-10-01", "hasta": "2026-11-04" },
  "totales": { "total_clientes_con_adeudo": 12, "total_adeudo": "3150.00" },
  "filas": [
    {
      "id_cliente": 7,
      "nombre_compliente": "Luis Gómez",
      "precio_membresia": "450.00",
      "total_pagado": "150.00",
      "saldo_pendiente": "300.00",
      "estado_membresia": "activo",
      "fecha_fin": "2026-11-30"
    }
  ],
  "paginacion": { "pagina": 1, "limite": 20, "total": 12, "totalPaginas": 1 }
}
```

- El adeudo se calcula sobre la **última membresía registrada** del cliente, sea cual sea su
  estado, descontando solo los pagos `completado`, y el saldo nunca es negativo (FR-011, RN-31).
- `estado_membresia` y `fecha_fin` son los de esa membresía base, para que el administrador
  distinga una deuda vigente de una deuda caducada.
- Se listan los clientes con saldo pendiente mayor que cero.

## Reporte de accesos

`GET /api/reportes/accesos?desde=&hasta=&estado=&pagina=` 🔒 admin

Detalle: `id_acceso`, `id_cliente`, `nombre_compliente`, `fecha`, `hora`, `resultado`, `motivo`.

```json
{
  "tipo": "accesos",
  "periodo": { "desde": "2026-10-01", "hasta": "2026-11-04" },
  "totales": { "total": 340, "autorizados": 328, "rechazados": 12 },
  "filas": [
    {
      "id_acceso": 900,
      "id_cliente": 1,
      "nombre_compliente": "Ana Pérez",
      "fecha": "2026-10-03",
      "hora": "07:12:00",
      "resultado": "autorizado",
      "motivo": null
    }
  ],
  "paginacion": { "pagina": 1, "limite": 20, "total": 340, "totalPaginas": 17 }
}
```

- El filtro por periodo se aplica sobre `accesos.fecha`; `motivo` viene en null cuando el acceso fue
  autorizado.

---

## Exportación a PDF

`GET /api/reportes/<tipo>/exportar?desde=&hasta=&estado=` 🔒 admin

Donde `<tipo>` es uno de `clientes`, `membresias`, `pagos`, `adeudos` y `accesos`.

**Respuesta**: `200` con `Content-Type: application/pdf` y
`Content-Disposition: attachment; filename="reporte-<tipo>-<desde>-<hasta>.pdf"`.

- El archivo contiene el **conjunto filtrado completo**, no la página visible; el parámetro
  `pagina` no aplica y se ignora (FR-019, research.md §D8).
- Los datos y los filtros del archivo son los mismos que los del reporte en pantalla (RN-29).
- El PDF no incluye contraseñas, tokens ni datos biométricos (FR-020, RN-30) ni datos del módulo de
  entrenamiento.
- Los caracteres fuera del conjunto WinAnsi producen **400** `VALIDACION` con un mensaje claro, en
  lugar de un archivo corrupto (FR-021, research.md §D1).

**Encabezados de control** (siempre presentes):

| Encabezado | Valor | Significado |
| ---------- | ----- | ----------- |
| `X-Reporte-Total-Filas` | entero | Filas del conjunto filtrado completo. |
| `X-Reporte-Filas-Exportadas` | entero | Filas incluidas en el archivo. |
| `X-Reporte-Truncado` | `true` / `false` | `true` cuando el archivo contiene solo una parte del conjunto. |

Cuando `X-Reporte-Truncado` es `true` el PDF incluye además una nota de pie visible que indica el
límite aplicado y que el archivo contiene una parte del conjunto filtrado, de modo que el aviso no
dependa solo de la interfaz (FR-019).

## Auditoría de los reportes

Cada generación y cada exportación deja un registro en la tabla `auditoria` (FR-023, FR-024,
RN-34):

| Campo | Valor |
| ----- | ----- |
| `accion` | `generar_reporte` o `exportar_reporte` |
| `modulo` | `reportes` |
| `resultado` | `exitoso` o `rechazado` |
| `descripcion` | `tipo=<tipo>; desde=<fecha>; hasta=<fecha>; estado=<valor>; pagina=<n>` |

- Un intento de un rol no administrador se registra con `resultado = 'rechazado'`, porque hay
  usuario identificado.
- Una petición sin token o con token caducado **no** se registra: no hay usuario al que atribuirla.
- Si el registro de auditoría falla, el reporte se muestra igual: la auditoría es *best-effort* y no
  bloquea la operación.

## Códigos de error

| HTTP | Código | Cuándo |
| ---- | ------ | ------ |
| 400 | `VALIDACION` | Formato de fecha inválido, `desde` > `hasta`, valor de `estado` no previsto, caracteres no exportables. |
| 401 | `AUTH_REQUERIDA` | Petición sin token o con token caducado. |
| 403 | `AUTORIZACION` | Rol distinto del administrador. |
| 500 | `INTERNO` | Error no previsto; el mensaje no revela detalles internos. |

## Verificación de este contrato

| Requisito | Evidencia en el contrato |
| --------- | ------------------------ |
| FR-001, FR-025 | Matriz de permisos: solo el administrador. |
| FR-002 | 401 `AUTH_REQUERIDA` sin token. |
| FR-012, FR-013, FR-016 | Filtros comunes y tabla de estados admitidos. |
| FR-014, FR-017 | Envelope `paginacion` y totales sobre el conjunto completo. |
| FR-015 | `filas` vacío con totales en cero, sin error. |
| FR-018, FR-019, FR-021, FR-022 | Sección de exportación. |
| FR-023, FR-024 | Sección de auditoría. |
| FR-039 | Todas las entradas por parámetro de consulta; el backend los valida antes de consultar. |
| FR-020, FR-040 | El detalle de los reportes no incluye datos biométricos ni credenciales. |
