# Contrato de la API REST: Dashboard administrativo (Sprint 3)

**Funcionalidad**: `003-entrenadores-rutinas-dashboard`
**Fecha**: 2026-10-19

Base URL en desarrollo: `http://localhost:3000/api`. Todas las respuestas usan JSON y todas las
rutas marcadas con 🔒 requieren `Authorization: Bearer <token>`. Los errores usan el envelope
del Sprint 1 (`{ "mensaje": "...", "codigo": "CODIGO_INTERNO" }`).

## Matriz de permisos

| Operación | admin | recepcionista | entrenador | cliente |
|-----------|:-----:|:-------------:|:----------:|:-------:|
| Consultar el dashboard | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| Consultar la auditoría | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |

El dashboard completo es exclusivo del administrador (FR-015, FR-019, sesión 2026-10-19); el
recepcionista y el entrenador usan sus propias vistas de carga del personal
(`api-entrenadores-asignaciones.md`).

## Filtro de periodo

`GET /api/dashboard?desde=2026-09-01&hasta=2026-10-19` 🔒 admin

- `desde` y `hasta` son fechas ISO `YYYY-MM-DD`, opcionales.
- Por defecto: del primer día del mes anterior a hoy, hasta hoy (investigación §4).
- **400** `VALIDACION` si `desde` > `hasta` o el formato no es válido.

## Respuesta

```json
{
  "periodo": { "desde": "2026-09-01", "hasta": "2026-10-19" },
  "clientes": { "activos": 120 },
  "membresias": { "vigentes": 95, "vencidas": 25 },
  "accesos": { "recientes": 340, "rechazados": 12 },
  "entrenadores": { "registrados": 4, "activos": 3 },
  "asignaciones": { "con_entrenador": 80, "sin_entrenador": 40 },
  "rutinas": { "activas": 62 },
  "objetivos": { "cumplidos": 18, "pendientes": 30, "porcentaje_cumplidos": "37.5" },
  "progresos": { "registrados": 45 }
}
```

## Definición de cada indicador (verificable en SC-009)

| Sección | Indicador | Definición | Fuente |
|---------|-----------|------------|--------|
| clientes | activos | clientes con `estado = 'activo'` | `clientes` |
| membresias | vigentes | membresías con `fecha_fin >= hoy` y estado `activo` | `membresias` |
| membresias | vencidas | membresías con `fecha_fin < hoy` y estado `activo` | `membresias` |
| accesos | recientes | accesos del periodo | `accesos` |
| accesos | rechazados | accesos del periodo con `resultado = 'rechazado'` | `accesos` |
| entrenadores | registrados / activos | total de `entrenadores` / con `estado = 'activo'` | `entrenadores` |
| asignaciones | con_entrenador | clientes con una asignación `activa` | `asignaciones_entrenador` |
| asignaciones | sin_entrenador | clientes `activos` sin asignación `activa` | `asignaciones_entrenador` |
| rutinas | activas | rutinas con `estado = 'activa'` | `rutinas` |
| objetivos | cumplidos / pendientes | objetivos del periodo con estado `cumplido` / `pendiente` o `en_curso` | `objetivos_entrenamiento` |
| objetivos | porcentaje_cumplidos | cumplidos ÷ total del periodo × 100, con un decimal; `0.0` si no hay objetivos | `objetivos_entrenamiento` |
| progresos | registrados | progresos con `fecha` dentro del periodo | `progresos_clientes` |

> Los indicadores se recalculan desde los módulos de origen en cada consulta, sin tablas de
> resumen: un cambio en cualquier módulo se refleja de inmediato (US-S3-06 esc. 6, FR-017).
> Cuando una sección no tiene datos, el indicador se devuelve en cero con su etiqueta
> correspondiente, sin errores (US-S3-06 esc. 2).

- **403** `AUTORIZACION` para cualquier rol distinto del administrador (US-S3-06 esc. 4,
  SC-010).

## Auditoría del sprint (FR-020)

El dashboard no modifica la auditoría existente; este sprint agrega estas acciones a la tabla
`auditoria`, con la misma consulta exclusiva del administrador documentada en
`specs/002-membresias-pagos-acceso-facial/contracts/api-auditoria.md`:

| modulo | accion |
|--------|--------|
| asignaciones | `asignar_entrenador` |
| asignaciones | `reasignar_entrenador` |
| rutinas | `crear_rutina` |
| rutinas | `modificar_rutina` |
| objetivos | `registrar_objetivo` |
| progresos | `registrar_progreso` |

`resultado` es `exitoso` o `rechazado`; `descripcion` resume la operación con identificadores
(nunca datos sensibles del cliente).
