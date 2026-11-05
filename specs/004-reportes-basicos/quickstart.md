# Guía rápida de validación: Sprint 4 - Reportes básicos y cierre del MVP

**Fecha**: 2026-11-04 | **Plan**: [plan.md](./plan.md) | **Contrato**: [contracts/api-reportes.md](./contracts/api-reportes.md) | **Modelo de datos**: [data-model.md](./data-model.md)

Esta guía describe cómo comprobar de extremo a extremo que el sprint funciona. Es una guía de
ejecución, no un manual de implementación: las rutas, los campos y los códigos esperados están en
el contrato, y las reglas de cálculo en el modelo de datos.

## 1. Requisitos previos

- Node.js >= 20 y MySQL local en ejecución (motor InnoDB, `utf8mb4`).
- Base de datos creada y migraciones aplicadas:

```bash
node database/scripts/crear-base-de-datos.js
node database/scripts/ejecutar-migraciones.js
```

- Dependencias del backend instaladas, incluida la nueva dependencia de PDF:

```bash
cd backend
npm install
```

- Semilla del Sprint 4 cargada en la base de desarrollo (los reportes necesitan datos en varios
  periodos y estados):

```bash
mysql -u <usuario> -p <base> < database/seeds/seed-datos-sprint4.sql
```

## 2. Levantar el sistema

```bash
cd backend
npm start
```

En otra terminal:

```bash
cd frontend
npm run dev
```

## 3. Obtener un token de administrador

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"<correo_admin>","password":"<password>"}'
```

Guardar el valor de `token` de la respuesta en una variable para los pasos siguientes:

```bash
TOKEN="<token>"
```

## 4. Escenarios de validación

### 4.1 Reporte de clientes con filtro de periodo y estado (US-S4-01)

```bash
curl -s "http://localhost:3000/api/reportes/clientes?desde=2026-01-01&hasta=2026-12-31&estado=activo" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: `200` con `totales.total` igual a `paginacion.total`, `totales.por_estado` con el
desglose, y `filas` con el mismo `estado` y dentro del periodo. Contrastar el total con una
consulta directa:

```sql
SELECT COUNT(*) FROM clientes WHERE estado = 'activo';
```

### 4.2 Reporte de membresías con los cuatro grupos disjuntos (US-S4-02)

```bash
curl -s "http://localhost:3000/api/reportes/membresias" -H "Authorization: Bearer $TOKEN"
```

**Esperado**: `200` con los cuatro totales y con
`totales.activas + totales.proximas_a_vencer + totales.vencidas + totales.suspendidas_o_canceladas`
igual a `totales.total` (SC-014). Contrastar el grupo de cada fila contra la regla de
[data-model.md §5.1](./data-model.md).

### 4.3 Reporte de pagos e ingresos (US-S4-03)

```bash
curl -s "http://localhost:3000/api/reportes/pagos?desde=2026-10-01&hasta=2026-10-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: `200` con `totales.total_ingresos` igual a la suma de `monto` de las filas, y todas
las filas con `estado = "completado"` (FR-008).

### 4.4 Reporte de adeudos (US-S4-03)

```bash
curl -s "http://localhost:3000/api/reportes/adeudos" -H "Authorization: Bearer $TOKEN"
```

**Esperado**: `200` con una fila por cliente con saldo pendiente, `saldo_pendiente` nunca
negativo, y `estado_membresia` coherente con la última membresía registrada del cliente
(data-model.md §5.2). Contrastar un cliente con la pantalla de consulta de adeudos ya existente en
`/api/pagos/adeudos` y comprobar que, si difieren, la diferencia corresponde a los criterios
documentados en los Supuestos del spec.

### 4.5 Reporte de accesos con filtro por resultado (US-S4-04)

```bash
curl -s "http://localhost:3000/api/reportes/accesos?desde=2026-10-01&hasta=2026-10-31&estado=rechazado" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: `200` con todas las filas en `resultado = "rechazado"` y con `motivo` informado.

### 4.6 Exportación a PDF (US-S4-05)

```bash
curl -s -D - -o reporte.pdf \
  "http://localhost:3000/api/reportes/clientes/exportar?desde=2026-01-01&hasta=2026-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: `200`, `Content-Type: application/pdf` y `Content-Disposition: attachment` con el
nombre del archivo. Abrir el PDF y comprobar:

- contiene los mismos datos y el mismo filtro que el reporte de la pantalla;
- los acentos y la eñe se conservan (FR-021);
- no aparecen contraseñas, tokens ni datos biométricos (FR-020).

Verificar también los encabezados de control `X-Reporte-Total-Filas`,
`X-Reporte-Filas-Exportadas` y `X-Reporte-Truncado`.

### 4.7 Auditoría de generación y exportación (US-S4-06)

```bash
curl -s "http://localhost:3000/api/reportes/clientes" -H "Authorization: Bearer $TOKEN"
curl -s -o /dev/null "http://localhost:3000/api/reportes/clientes/exportar" \
  -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/api/auditoria?modulo=reportes" -H "Authorization: Bearer $TOKEN"
```

**Esperado**: los dos registros en la auditoría, con `accion` `generar_reporte` y
`exportar_reporte`, `modulo` `reportes`, `resultado` `exitoso` y la `descripcion` con el tipo y los
filtros (FR-023, FR-024).

### 4.8 Permisos y autenticación (FR-001, FR-002)

Con un token de recepcionista, entrenador o cliente:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/reportes/clientes" \
  -H "Authorization: Bearer $TOKEN_OTRO_ROL"
```

**Esperado**: `403`. Sin token:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/reportes/clientes"
```

**Esperado**: `401`.

### 4.9 Validaciones de entrada (FR-013, FR-016)

```bash
curl -s "http://localhost:3000/api/reportes/pagos?desde=2026-12-31&hasta=2026-01-01" \
  -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/api/reportes/clientes?estado=inexistente" \
  -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/api/reportes/pagos?desde=ayer" -H "Authorization: Bearer $TOKEN"
```

**Esperado**: `400` con código `VALIDACION` en los tres casos, con mensajes distintos según la
causa.

### 4.10 Resultado vacío (FR-015)

```bash
curl -s "http://localhost:3000/api/reportes/accesos?desde=1990-01-01&hasta=1990-01-02" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado**: `200` con `filas` vacío, totales en cero y sin error.

### 4.11 Interfaz de reportes (FR-032, principio XI)

1. Entrar como administrador y abrir la sección de reportes.
2. Recorrer las cuatro pestañas y comprobar que cada una muestra sus totales y su tabla paginada.
3. Cambiar el periodo y el estado, y verificar que la tabla y los totales se actualizan.
4. Exportar y comprobar que el archivo se descarga con el nombre esperado.
5. Entrar con un rol no administrador y comprobar que la sección no es accesible.

## 5. Pruebas automatizadas

```bash
cd backend
npm test
```

**Esperado**: la suite completa termina sin fallos, sin cancelaciones y sin omisiones (FR-027).
Las pruebas nuevas del sprint cubren el contrato de cada reporte, la integración de cada historia y
la auditoría de generación y exportación.

## 6. Cierre del MVP (US-S4-07)

1. Verificar que la migración 003 está aplicada y que sus pruebas se ejecutan sin omitirse (FR-026).
2. Ejecutar la suite completa del backend (FR-027).
3. Comprobar que los defectos detectados están corregidos o documentados (FR-028).
4. Validar de punta a punta los flujos principales de los cuatro sprints y registrar el resultado
   (FR-029).
5. Actualizar `docs/project-context.md` con las reglas RN-15 a RN-34 y `docs/reglas.md` y
   `docs/project-context.md` con el número real de sprints (FR-030, FR-031); también
   `docs/sprint-4.md` §6, para que RN-27 y RN-31 coincidan con su redacción provisional
   (research.md §D10).
6. Revisar que las pantallas mantienen un diseño y una navegación consistentes (FR-032).
7. Actualizar el reporte de pruebas del proyecto con los resultados reales (FR-033).

## 7. Registro de resultados

| Escenario | Resultado | Observaciones | Fecha |
| --------- | --------- | ------------- | ----- |
| 4.1 Reporte de clientes | | | |
| 4.2 Reporte de membresías | | | |
| 4.3 Reporte de pagos | | | |
| 4.4 Reporte de adeudos | | | |
| 4.5 Reporte de accesos | | | |
| 4.6 Exportación a PDF | | | |
| 4.7 Auditoría | | | |
| 4.8 Permisos | | | |
| 4.9 Validaciones | | | |
| 4.10 Resultado vacío | | | |
| 4.11 Interfaz | | | |
| 5. Suite completa | | | |
| 6. Cierre del MVP | | | |
