# Investigación técnica: Sprint 4 - Reportes básicos y cierre del MVP

**Fecha**: 2026-11-04 | **Plan**: [plan.md](./plan.md) | **Especificación**: [spec.md](./spec.md)

Este documento resuelve los puntos abiertos de la especificación. Cada decisión se apoya en
evidencia del propio repositorio: el código, el esquema y los contratos de los sprints anteriores
son la fuente primaria, y `docs/reglas.md` y `docs/project-context.md` fijan el marco.

## Resumen de decisiones

| ID | Punto resuelto | Decisión | Dónde aplica |
| -- | --------------- | -------- | ------------ |
| D1 | Librería de generación de PDF | `pdfkit` ^0.20 (MIT) | FR-022, FR-045 |
| D2 | Tamaño de página y forma del listado paginado | 20 registros, `pagina` en 1, envelope `{ coleccion, pagina, limite, total, totalPaginas }` | FR-014, FR-017, SC-002 |
| D3 | Zona horaria y formato de fecha | ISO `YYYY-MM-DD` en UTC, reutilizando `validarPeriodo` | FR-012, FR-016 |
| D4 | Totales y subtotales de cada reporte | Totales por reporte y subtotales solo donde el dato los aporta | FR-006, FR-007, FR-017, SC-014 |
| D5 | ¿Hace falta una migración `004_`? | No: la tabla `auditoria` existente basta | FR-044, RN-34 |
| D6 | Contenido del registro de auditoría de reportes | `descripcion` compacta con tipo y filtros | FR-023, FR-024, H-CL-03 |
| D7 | Forma de la API de reportes | Un recurso por reporte bajo `/api/reportes` | FR-001, FR-034 |
| D8 | Alcance de la exportación | Conjunto filtrado completo, no la página visible | FR-019, SC-003 |
| D9 | Estructura de la pantalla de reportes | Una página con cuatro pestañas | FR-032, principio XI |
| D10 | Documentos de origen que hay que actualizar | `docs/sprint-4.md` §6 | FR-030, H-CL-06 |

---

## D1. Librería de generación de PDF

**Decisión**: incorporar `pdfkit` ^0.20 (licencia MIT) como única dependencia nueva del sprint.

**Justificación**: FR-022 obliga a exportar en PDF y FR-045 exige justificar cualquier
dependencia nueva antes de incorporarla. `pdfkit` es la opción más ligera que cumple:

- Es JavaScript puro, sin binarios ni descarga de fuentes en tiempo de ejecución, y no abre
  conexiones de red: cumple el principio III (base local, sin servicios externos).
- Su licencia es MIT, compatible con un proyecto académico, y sus dependencias transitivas
  (`fontkit`, `linebreak`, `png-js`, `fflate`, `@noble/hashes`, `@noble/ciphers`) también son
  JavaScript puro.
- Permite escribir el PDF en un flujo (`pipe`), de modo que la exportación no requiere armar el
  archivo completo en memoria.
- Las fuentes estándar de PDF cubren el rango WinAnsi, que incluye `á é í ó ú ñ ü ¿ ¡` y los
  símbolos habituales de los nombres y comentarios del gimnasio, con lo que FR-021 se cumple para
  los datos del proyecto.

**Restricción documentada**: los caracteres fuera de WinAnsi no son representables con las fuentes
estándar. La exportación DEBE detectar esa situación y responder con un error de validación
claro, en lugar de generar un archivo corrupto. Si más adelante el project's datos exigieran
Unicode completo, la alternativa sería incrustar una fuente TTF con su licencia, lo que se
decidiría en una versión posterior.

**Alternativas consideradas**:

- **CSV u otro formato tabular**: descartado por la decisión del equipo del 2026-11-04 (PDF) y
  porque no cumple el propósito de "guardar, imprimir o compartir" tal como está redactada
  US-S4-05.
- **Generar el PDF en el navegador con `window.print()`**: descartado porque el backend debe
  devolver el archivo (FR-018, contrato) y porque dependería del agente del usuario.
- **`pdfmake`**: descartada porque su núcleo está pensado para el navegador y arrastra un motor de
  plantillas mayor del que el sprint necesita.
- **`puppeteer` o `playwright`**: descartada porque descarga un motor de navegador de cientos de
  megabytes y abre un proceso externo; es exactamente la dependencia innecesaria que el principio
  III prohíbe.
- **Escribir un generador de PDF propio**: descartada por coste y riesgo de errores en un
  formato binario.

**Verificación en la fase de tareas**: tras `npm install`, confirmar con `npm ls pdfkit` que solo
entran las dependencias transitivas Previstas y que `npm test` sigue en verde.

---

## D2. Tamaño de página y forma del listado paginado

**Decisión**: el tamaño de página es de **20 registros**, y el listado sigue el envelope ya
usado por el módulo de clientes: `{ <coleccion>, pagina, limite, total, totalPaginas }`, con
`pagina` como parámetro de consulta y `LIMIT ? OFFSET ?` en SQL.

**Justificación**: el repositorio ya tiene una convención consolidada y probada:

- `backend/src/services/cliente.service.js` declara `const LIMITE_PAGINA = 20;` y devuelve
  `{ clientes, pagina, limite, total, totalPaginas }`.
- `backend/src/models/cliente.model.js` aplica `LIMIT ? OFFSET ?` con los valores convertidos a
  número.

El valor de 20 que el spec recoge como supuesto queda así **confirmado por el código existente**,
lo que resuelve el punto diferido H-CL-05 sin inventar un número nuevo. Reutilizar la convención
además reduce el trabajo de implementación y el riesgo de que el frontend debo conocer dos
formatos de paginación.

**Totales sobre el conjunto completo**: los totales del reporte se calculan sobre el conjunto
filtrado completo, no sobre la página visible, y por eso se ejecutan dos consultas en paralelo:
una con `LIMIT/OFFSET` para las filas y otra de conteo para el total (el mismo patrón de
`obtenerListadoClientes`). FR-017 y SC-002 lo exigen y de ese modo la suma de las filas del
conjunto completo coincide con el total (research.md §D4).

**Alternativas consideradas**: paginación en el cliente (descartada: obligaría a traer el
conjunto completo y contradice FR-014); un tamaño de página configurable por el administrador
(descartada por ahora: no está en el alcance del sprint; el límite es una constante del servicio,
igual que `LIMITE_PAGINA`).

---

## D3. Zona horaria y formato de fecha

**Decisión**: las fechas se manejan en **UTC** y en formato **ISO `YYYY-MM-DD`**, reutilizando el
validador `validarPeriodo` de `backend/src/validators/dashboard.validator.js`.

**Justificación**: el proyecto ya fijó esta convención en el Sprint 3 y no hay razón para
inventar otra:

- `validarPeriodo` ya acepta `desde` y `hasta` opcionales en formato `YYYY-MM-DD`, calcula "hoy"
  con `new Date().toISOString().slice(0, 10)` (UTC) y responde **400 `VALIDACION`** con el
  mensaje "El periodo es inválido: desde no puede ser posterior a hasta" cuando el rango es
  inválido, más **400** si el formato no es ISO.
- `backend/src/utils/fechas.js` normaliza las columnas `DATE` de MySQL a texto `YYYY-MM-DD` en las
  respuestas, que es lo que exigen los contratos.
- `accesos` guarda `fecha` como `DATE` y `hora` como `TIME` en columnas separadas, mientras que
  `pagos.fecha_pago` es un `DATETIME`: para el reporte de accesos el filtro de periodo se aplica
  sobre `accesos.fecha`, y para el de pagos sobre `DATE(pagos.fecha_pago)`, de modo que un pago
  registrado a medianoche no se repartiría en dos periodos por la zona horaria.

Consecuencias ya resueltas por la convención existente:

- **Fechas iguales**: `desde = hasta` es un periodo válido de un solo día, porque la comparación
  `desde > hasta` solo rechaza el orden invertido. Es el comportamiento que el spec dejó como
  supuesto (H-SP-10).
- **Formato inválido**: se rechaza con **400 `VALIDACION`** y el mensaje "El parámetro X debe
  tener formato YYYY-MM-DD".
- **Ventana de "próxima a vencer"**: se evalúa contra la fecha de hoy en UTC, que es la "fecha de
  corte" que FR-007 usa y que la decisión 3 de la sesión de aclaraciones fijó.

**Alternativas consideradas**: zona horaria local del servidor (descartada: haría que el mismo
informe cambiara según dónde se ejecute y rompería la trazabilidad de los datos); formato
`DD/MM/YYYY` en las respuestas (descartada: los contratos del proyecto ya usan ISO y el frontend
los formatea si lo necesita).

---

## D4. Totales y subtotales de cada reporte

**Decisión**: cada reporte expone un bloque `totales` con los agregados que le corresponden, y
`subtotales` solo donde el dato aporta una agrupación natural.

**Justificación**: FR-006, FR-007, FR-008, FR-017 y SC-002 exigen que los totales coincidan con
el origen y con la suma de las filas del conjunto filtrado. El punto que quedó abierto (H-CL-04,
"totales, subtotales y su presentación") se cierra con esta tabla, que es la definición
verificable que necesitan las pruebas:

| Reporte | Totales | Subtotales | Origen |
| ------- | ------- | ---------- | ------ |
| Clientes | `total`, `por_estado` | No aplica | `clientes` |
| Membresías | `total`, `activas`, `proximas_a_vencer`, `vencidas`, `suspendidas_o_canceladas` | No aplica: los cuatro grupos son el total desglosado (SC-014) | `membresias` |
| Pagos | `total_pagos`, `total_ingresos` | No aplica: el filtro por periodo ya agrupa | `pagos` con `estado = 'completado'` |
| Adeudos | `total_clientes_con_adeudo`, `total_adeudo` | No aplica | `clientes`, `membresias`, `tipos_membresia`, `pagos` |
| Accesos | `total`, `autorizados`, `rechazados` | No aplica | `accesos` |

Las cuatro categorías de membresías son disjuntas y su suma es el total (FR-007, SC-014), de modo
que no hay un subtotal que se calcule sobre un total ya desglosado. Para los reportes de pagos y
accesos, el periodo es la única agrupaciónnatural del sprint y ya actúa como subtotal.

**Presentación**: los totales se muestran con el componente `TarjetaIndicador.jsx` que ya usa el
dashboard del Sprint 3, y el detalle en una tabla paginada con `TablaReporte.jsx`. La definición
precisa de la presentación visual corresponde a `/speckit.tasks` y a la maquetación del frontend.

**Alternativas consideradas**: un bloque `totales` común y genérico con todos los indicadores en
todos los reportes (descartada: obligaría a devolver ceros irrelevantes en cada reporte y
dificultaría las pruebas por endpoint); subtotales por grupo dentro del listado (descartada: el
listado es paginado y un subtotal por página contradice que los totales se calculen sobre el
conjunto completo).

---

## D5. ¿Hace falta una migración `004_`?

**Decisión**: **no**. El sprint no crea tablas ni Script de migración.

**Justificación**: FR-044 lo dejaba en condicional y el Sprint 3 lo dejó pendiente
correspondientemente (T068). Al revisar la tabla `auditoria` de la migración 002:

```sql
accion VARCHAR(60) NOT NULL,
modulo VARCHAR(40) NOT NULL,
fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
resultado VARCHAR(20) NOT NULL,
descripcion VARCHAR(255) NULL
```

Los cinco campos que FR-023 y FR-024 exigen (usuario, módulo, fecha, resultado y descripción) ya
existen, y `descripcion VARCHAR(255)` tiene espacio de sobra para el tipo de reporte y los filtros
aplicados (research.md §D6). No hace falta columna nueva, ni vista, ni índice adicional: el
índice `ix_auditoria_modulo` ya está y el filtro por módulo es el que usa la consulta de
auditoría existente.

**Consecuencia**: el Sprint 4 no toca `database/migrations/` y la verificación de la migración 003
que exige FR-026 se mantiene válida sin trabajo adicional.

**Alternativas consideradas**: crear una vista de MySQL con los reportes preagregados
(descartada: FR-044 y §D7 apuntan a consultas directas, y una vista añadiría un objeto que
mantener sin beneficio medible para el volumen de un gimnasio); añadir columnas
`id_reporte` o `filtros` a `auditoria` (descartada: exigiría la migración y aportaría poco frente
a una descripción estructurada de 255 caracteres).

---

## D6. Contenido del registro de auditoría de reportes

**Decisión**: las acciones de auditoría de reportes usan el servicio `auditoria.service.js`
existente, con `accion` `generar_reporte` o `exportar_reporte`, `modulo` `reportes`,
`resultado` `exitoso` o `rechazado`, y la `descripcion` con el tipo de reporte y los filtros
aplicados en formato compacto de pares `clave=valor`.

**Justificación**:

- El servicio ya expone `registrarAccion(idUsuario, accion, modulo, resultado, descripcion)` y
  guarda la convención de `accion` en `snake_case` y `modulo` en plural, usada por los módulos de
  los sprints anteriores (`asignar_entrenador`/`asignaciones`, `crear_rutina`/`rutinas`,
  `registrar_pago`/`pagos`).
- El valor `resultado = 'exitoso'` es el ya usado en el proyecto; para un intento denegado se
  reutiliza `'rechazado'`, que es el valor que ya emplea el módulo de accesos.
- Formato de la `descripcion` (cabe en 255 caracteres):
  `tipo=clientes; desde=2026-01-01; hasta=2026-12-31; estado=activo; pagina=1`.
  Es legible en la pantalla de auditoría, identifica el reporte y los filtros, y no contiene
  datos personales de clientes más allá de los identificadores que el propio registro de auditoría
  ya almacena.

**Casos límite resueltos con el comportamiento ya implementado** (esto cierra H-CL-03):

- **Petición sin token**: `registrarAccion` ya retorna sin registrar cuando no hay
  `idUsuario`, con el comentario "Sin usuario autenticado no hay a quién atribuir; no se registra".
  Un intento sin token o con token caducado, por tanto, **no** genera registro de auditoría.
- **Petición de un rol no administrador (403)**: sí hay usuario identificado, así que **sí** se
  registra con `resultado = 'rechazado'`, lo que satisface el escenario 5 de US-S4-06.
- **Fallo del propio registro de auditoría**: el servicio ya es *best-effort*; un fallo se
  registra en consola y no impide la operación principal, lo que evita que un reporte se niegue a
  mostrarse por un problema de auditoría.

**Alternativas consideradas**: columna dedicada con los filtros en JSON (descartada: exigiría la
migración de §D5); registrar solo la acción sin los filtros (descartada: el escenario 3 de
US-S4-06 exige identificar el reporte y sus filtros).

---

## D7. Forma de la API de reportes

**Decisión**: un recurso por reporte, montado en `/api/reportes`, con un endpoint de consulta y
otro de exportación por tipo.

**Justificación**: el proyecto usa rutas por recurso (`/api/entrenadores`, `/api/asignaciones`,
`/api/rutinas`, `/api/pagos`, `/api/dashboard`), y cada módulo tiene su propio validador. Un
endpoint único con un parámetro `tipo` obligaría a un validador que bifurcase por tipo en cada
caso, y haría que los filtros admitidos variaran dentro de la misma ruta.

Rutas resultantes (contrato completo en `contracts/api-reportes.md`):

```text
GET /api/reportes/clientes      GET /api/reportes/clientes/exportar
GET /api/reportes/membresias    GET /api/reportes/membresias/exportar
GET /api/reportes/pagos         GET /api/reportes/pagos/exportar
GET /api/reportes/adeudos       GET /api/reportes/adeudos/exportar
GET /api/reportes/accesos       GET /api/reportes/accesos/exportar
```

**Alternativas consideradas**: un endpoint único `/api/reportes?tipo=...` (descartada por el
argumento de bifurcación del validador); un endpoint con subrutas por tipo
`/api/reportes/clientes/totales` separadas (descartada: los totales van en la misma respuesta,
como ya hace el dashboard del Sprint 3).

---

## D8. Alcance de la exportación

**Decisión**: la exportación devuelve el **conjunto filtrado completo**, no la página visible, y
cuando supera el límite de 10.000 filas se trunca y se informa.

**Justificación**: FR-019 y SC-003 exigen que el archivo contenga las mismas filas y el mismo
filtro que el reporte, y FR-017 fija que los totales se calculan sobre el conjunto completo; si la
exportación tomara solo la página visible, el archivo no coincidiría con los totales que muestra
la pantalla. El parámetro `pagina` no aplica a la exportación: el contrato lo documenta
explícitamente para que el frontend no lo envíe por inercia.

El aviso de truncamiento viaja en dos sitios, para que el frontend pueda mostrarlo y el archivo
quede documentado por sí mismo: una cabecera `X-Reporte-Truncado: true` y
`X-Reporte-Filas-Exportadas` / `X-Reporte-Total-Filas`, y una línea de pie dentro del propio PDF.

**Alternativas consideradas**: exportar solo la página visible (descartada: contradice FR-019);
no poner límite y exportar siempre el conjunto completo (descartada: la decisión del equipo del
2026-11-04 fue limitar e informar).

---

## D9. Estructura de la pantalla de reportes

**Decisión**: una página `frontend/src/pages/Reportes.jsx` con cuatro pestañas, protegida para el
rol administrador.

**Justificación**: el spec aclaró que el reporte de pagos y el de adeudos pertenecen a la misma
historia (US-S4-03) y comparten pantalla, mientras que son dos reportes distintos en la API
(§D7). Cuatro pestañas cubren los cinco reportes. La página reutiliza `estilos.css`,
`TarjetaIndicador.jsx` (totales), `ModalConfirmacion.jsx` y los patrones de `Dashboard.jsx` y
`Personal.jsx`, de modo que la apariencia es consistente con los sprints anteriores (principio XI
y FR-032).

**Alternativas consideradas**: cinco páginas separadas (descartada: multiplicaría la navegación
sin ganar nada, ya que los reportes comparten filtros y totales); una tabla única con un selector
de tipo (descartada: los cinco reportes tienen columnas y totales distintos).

---

## D10. Documentos de origen que hay que actualizar

**Decisión**: `docs/sprint-4.md` §6 debe actualizarse para que RN-27 y RN-31 coincidan con su
redacción provisional en `spec.md`.

**Justificación**: el principio I exige que la documentación del proyecto se actualice cuando
cambia una regla de negocio, y RN-27 y RN-31 son reglas de negocio. La aclaración del equipo del
2026-11-04 amplió RN-27 al reporte de clientes y precisó RN-31 sobre los pagos completados, de
modo que el documento de origen y el spec han divergido. La tarea de actualizarlo pertenece a la
fase de cierre del MVP (FR-030 y FR-031), donde también corresponde registrar las reglas RN-15 a
RN-34 en `docs/project-context.md` §12.

**Alternativas consideradas**: no modificar `docs/sprint-4.md` y dar por buena la divergencia
(descartada: deja dos fuentes de verdad contradictorias sobre el filtrado por periodo y el cálculo
de adeudos).

---

## Puntos que quedan para `/speckit.tasks`

Estos puntos no bloquean la implementación y se resuelven al redactar las tareas:

1. El color exacto y la composición de las tarjetas de totales y de las tablas en el frontend.
2. El nombre exacto de los archivos PDF descargados (`reporte-<tipo>-<desde>-<hasta>.pdf`).
3. El texto literal de los mensajes de resultado vacío y de error, que deben ser claros y no
   revelar información interna (FR-015, principio IX).
4. El reparto de los casos de prueba de contrato entre los cinco endpoints de consulta y los cinco
   de exportación.
