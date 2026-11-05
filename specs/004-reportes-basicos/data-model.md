# Modelo de datos: Sprint 4 - Reportes básicos y cierre del MVP

**Fecha**: 2026-11-04 | **Plan**: [plan.md](./plan.md) | **Especificación**: [spec.md](./spec.md) | **Investigación**: [research.md](./research.md)

Este sprint **no crea tablas nuevas** (research.md §D5). El modelo documenta las entidades
conceptuales del módulo de reportes y las tablas existentes que se leen, con sus reglas de
validación y sus estados.

## 1. Entidades conceptuales del módulo

### 1.1 `reporte`

Vista de solo lectura que el administrador solicita. No se almacena: se calcula en cada petición a
partir de las tablas de origen.

| Atributo | Tipo | Reglas |
| -------- | ---- | ------ |
| `tipo` | enumerated | Uno de `clientes`, `membresias`, `pagos`, `adeudos`, `accesos`. Determinada por la ruta. |
| `filtros` | objeto | Filtro aplicado: `desde`, `hasta`, `estado` (opcional). Ver §1.2. |
| `periodo_efectivo` | objeto | `{ desde, hasta }` con los valores realmente aplicados, tras aplicar los valores por defecto. |
| `totales` | objeto | Agregados del conjunto filtrado completo. Ver §1.4. |
| `subtotales` | objeto | Solo en los reportes donde el dato aporta agrupación natural. Ver §1.4. |
| `filas` | lista | Filas de la página solicitada del conjunto filtrado. |
| `paginacion` | objeto | `{ pagina, limite, total, totalPaginas }`. |

**Relaciones**: no se persiste; se calcula desde `cliente`, `membresia`, `tipo_de_membresia`,
`pago`, `acceso` y `usuario`.

### 1.2 `filtro_de_reporte`

| Atributo | Tipo | Reglas |
| -------- | ---- | ------ |
| `desde` | fecha ISO `YYYY-MM-DD` | Opcional. Por defecto, el primer día del mes anterior (research.md §D3). |
| `hasta` | fecha ISO `YYYY-MM-DD` | Opcional. Por defecto, hoy. |
| `estado` | enumerated | Opcional. Solo en los reportes que lo admiten (FR-013). |
| `pagina` | entero >= 1 | Opcional. Por defecto 1. No aplica a la exportación (research.md §D8). |

**Relaciones**: determina a la vez las filas, los totales y el contenido de la exportación del
reporte.

### 1.3 `archivo_exportado`

| Atributo | Tipo | Reglas |
| -------- | ---- | ------ |
| `reporte` | referencia | Reporte de origen, con sus mismos filtros. |
| `formato` | constante | `pdf` (FR-022). |
| `contenido` | flujo binario | PDF generado en memoria y devuelto como descarga. |
| `filas_exportadas` | entero | Filas incluidas en el archivo. |
| `total_filas` | entero | Filas del conjunto filtrado completo. |
| `truncado` | booleano | `true` cuando `filas_exportadas` < `total_filas` por el límite de 10.000 (FR-019). |

**Relaciones**: corresponde a un reporte y a la exportación registrada en la auditoría
(FR-024).

### 1.4 `registro_de_auditoria_de_reporte`

No es una tabla nueva: es un registro de la tabla `auditoria` existente (research.md §D5).

| Atributo | Tipo | Reglas |
| -------- | ---- | ------ |
| `accion` | `VARCHAR(60)` | `generar_reporte` o `exportar_reporte`. |
| `modulo` | `VARCHAR(40)` | `reportes`. |
| `resultado` | `VARCHAR(20)` | `exitoso` o `rechazado`. |
| `descripcion` | `VARCHAR(255)` | `tipo=<tipo>; desde=<fecha>; hasta=<fecha>; estado=<valor>; pagina=<n>` (research.md §D6). |

**Relaciones**: referencia al usuario que ejecutó la operación. Sin usuario identificado no se
registra, que es el comportamiento ya implementado en `auditoria.service.js`.

## 2. Tablas de origen (solo lectura)

### `clientes`

| Columna | Tipo | Uso en los reportes |
| ------- | ---- | ------------------- |
| `id_cliente` | `INT UNSIGNED` | Identificador; filtro y detalle del reporte de clientes y de adeudos. |
| `nombre`, `apellido` | `VARCHAR(100)` | Detalle. |
| `correo`, `telefono`, `direccion` | `VARCHAR` | No se exponen en los reportes: no intervienen en ningún cálculo y minimizan la exposición de datos personales. |
| `fecha_registro` | `DATETIME` | Fecha propia del filtro por periodo del reporte de clientes (FR-012). |
| `estado` | `ENUM('activo','inactivo')` | Filtro por estado y desglose de `totales.por_estado` (FR-006, FR-013). |

### `membresias`

| Columna | Tipo | Uso en los reportes |
| ------- | ---- | ------------------- |
| `id_membresia` | `INT UNSIGNED` | Identificador. |
| `id_cliente` | `INT UNSIGNED` | Agrupación de adeudos. |
| `id_tipo_membresia` | `INT UNSIGNED` | Precio de referencia del adeudo. |
| `fecha_inicio`, `fecha_fin` | `DATE` | Periodo de vigencia: base del filtro por periodo del reporte de membresías (FR-012) y de la ventana de "próxima a vencer" (FR-007). |
| `estado` | `ENUM('activo','vencida','suspendida','cancelada')` | Filtro por estado (FR-013) y clasificación en los cuatro grupos disjuntos (FR-007). |

### `tipos_membresia`

| Columna | Tipo | Uso en los reportes |
| ------- | ---- | ------------------- |
| `id_tipo_membresia` | `INT UNSIGNED` | Identificador. |
| `nombre`, `descripcion` | `VARCHAR` | Detalle del reporte de membresías. |
| `duracion` | `INT` | Detalle. |
| `precio` | `DECIMAL(10,2)` | Precio base del cálculo de adeudos (FR-011, RN-31). |

### `pagos`

| Columna | Tipo | Uso en los reportes |
| ------- | ---- | ------------------- |
| `id_pago` | `INT UNSIGNED` | Identificador. |
| `id_cliente` | `INT UNSIGNED` | Agrupación de adeudos. |
| `id_membresia` | `INT UNSIGNED` NULL | Referencia a la membresía que el pago cubre. |
| `monto` | `DECIMAL(10,2)` | Suma de ingresos (FR-008) y parte del cálculo de adeudos. |
| `fecha_pago` | `DATETIME` | Fecha propia del filtro por periodo; se filtra por `DATE(fecha_pago)` (research.md §D3). |
| `metodo_pago` | `VARCHAR(50)` | Detalle. |
| `estado` | `ENUM('completado','pendiente','cancelado')` | Solo se contabilizan los `completado`, en ingresos y en adeudo (FR-008, FR-011). |

### `accesos`

| Columna | Tipo | Uso en los reportes |
| ------- | ---- | ------------------- |
| `id_acceso` | `INT UNSIGNED` | Identificador. |
| `id_cliente` | `INT UNSIGNED` NULL | Detalle. |
| `fecha` | `DATE` | Fecha propia del filtro por periodo (FR-012). |
| `hora` | `TIME` | Detalle. |
| `resultado` | `ENUM('autorizado','rechazado')` | Filtro por estado y totales `autorizados` / `rechazados` (FR-010, FR-013). |
| `motivo` | `VARCHAR(80)` | Detalle del acceso rechazado (FR-010). |

### `auditoria`

Ver §1.4. No se modifica su estructura.

## 3. Reglas de validación

| Regla | Origen | Aplicación |
| ----- | ------ | ---------- |
| `desde` y `hasta` en formato ISO `YYYY-MM-DD` | FR-012, research.md §D3 | 400 `VALIDACION` con el mensaje del validador existente. |
| `desde` no posterior a `hasta` | FR-016 | 400 `VALIDACION` con el mensaje "El periodo es inválido: desde no puede ser posterior a hasta". |
| `desde = hasta` es válido | research.md §D3 | Periodo de un solo día. |
| `estado` dentro del listado del esquema de cada reporte | FR-013 | 400 `VALIDACION`; listado no previsto en el mensaje, sin revelar valores internos. |
| `pagina` entero mayor o igual que 1 | research.md §D2 | Si no es válido, se normaliza a 1, siguiendo el patrón de `cliente.service.js`. |
| `pagina` sin efecto en la exportación | FR-019, research.md §D8 | El endpoint de exportación la ignora. |
| Estados de pago | FR-008 | Solo `completado` entra en el listado, en el total de ingresos y en el descuento del adeudo. |
| Estados de membresía | FR-007 | Cuatro grupos disjuntos; la clasificación usa el estado y la `fecha_fin` frente a la fecha de hoy. |
| Datos no exportables | FR-021 | Caracteres fuera de WinAnsi: 400 `VALIDACION` con mensaje claro, sin generar un PDF corrupto (research.md §D1). |

## 4. Transiciones de estado

No aplican. Los reportes son de solo lectura y no producen ni modifican estados (FR-003, RN-26).
Los estados que los reportes consultan (`clientes.estado`, `membresias.estado`,
`pagos.estado`, `accesos.resultado`) los modifican los módulos de los sprints anteriores, que este
sprint no toca (FR-043).

## 5. Cálculos derivados

### 5.1 Clasificación de membresías (FR-007, SC-014)

Con `hoy` = fecha actual en UTC (research.md §D3):

| Grupo | Condición |
| ----- | --------- |
| `activas` | `estado = 'activo'` y `fecha_fin` a más de 7 días de `hoy` |
| `proximas_a_vencer` | `estado = 'activo'` y `fecha_fin` dentro de los 7 días siguientes a `hoy` |
| `vencidas` | `estado = 'vencida'` o `fecha_fin` ya pasada |
| `suspendidas_o_canceladas` | `estado = 'suspendida'` o `estado = 'cancelada'` |

Los cuatro grupos son disjuntos y su suma es el total de membresías del filtro.

### 5.2 Adeudo por cliente (FR-011, RN-31)

1. Membresía base: la de `fecha_inicio` más reciente del cliente y, a igualdad de fecha, la de
   `id_membresia` mayor.
2. Precio de referencia: `tipos_membresia.precio` de esa membresía.
3. Pagos computados: suma de `pagos.monto` de los pagos del cliente con `estado = 'completado'`.
4. Saldo: `max(0, precio - pagos)`.
5. El reporte muestra el `estado` de la membresía base, para distinguir una deuda vigente de una
   deuda que procede de una membresía vencida o cancelada.

Esta regla difiere de la de la pantalla de consulta de adeudos del Sprint 2, que filtra por
membresía activa y suma todos los pagos; la diferencia queda documentada en los Supuestos del
spec y en research.md.

### 5.3 Totales por reporte (research.md §D4)

| Reporte | Totales | Origen |
| ------- | ------- | ------ |
| Clientes | `total`, `por_estado` | `clientes` |
| Membresías | `total`, `activas`, `proximas_a_vencer`, `vencidas`, `suspendidas_o_canceladas` | `membresias` |
| Pagos | `total_pagos`, `total_ingresos` | `pagos` con `estado = 'completado'` |
| Adeudos | `total_clientes_con_adeudo`, `total_adeudo` | `clientes`, `membresias`, `tipos_membresia`, `pagos` |
| Accesos | `total`, `autorizados`, `rechazados` | `accesos` |

Todos los totales se calculan sobre el conjunto filtrado completo, nunca sobre la página visible
(FR-017, SC-002).
