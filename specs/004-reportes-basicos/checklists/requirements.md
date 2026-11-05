# Checklist de calidad de la especificación: Reportes básicos y cierre del MVP

**Propósito**: validar la completitud y la calidad de la especificación antes de pasar a la
planificación.
**Creado**: 2026-11-04
**Funcionalidad**: [spec.md](../spec.md)

## Calidad del contenido

- [x] Sin detalles de implementación (lenguajes, frameworks, API)
- [x] Orientado al valor de usuario y a las necesidades del negocio
- [x] Redactado para stakeholders no técnicos
- [x] Todas las secciones obligatorias están completas

## Completitud de los requisitos

- [x] No quedan marcadores [NEEDS CLARIFICATION] pendientes
- [x] Los requisitos son verificables y no ambiguos
- [x] Los criterios de éxito son medibles
- [x] Los criterios de éxito son independientes de la tecnología (sin detalles de implementación)
- [x] Todos los escenarios de aceptación están definidos
- [x] Los casos límite están identificados
- [x] El alcance está claramente delimitado
- [x] Las dependencias y los supuestos están identificados

## Preparación de la funcionalidad

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros
- [x] Los escenarios de usuario cubren los flujos principales
- [x] La funcionalidad cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación a la especificación

## Notas

- Los elementos marcados como incompletos requieren actualizaciones de la especificación antes de
  `/speckit.clarify` o `/speckit.plan`.
- **Aclaraciones resueltas (2026-11-04)**: los 3 marcadores `[NEEDS CLARIFICATION]` de la
  especificación fueron resueltos por el equipo y ya no queda ninguno pendiente. Q1: la
  exportación se hace en formato PDF (FR-022). Q2: una membresía es "próxima a vencer" cuando
  vence dentro de los 7 días siguientes a la fecha de hoy (FR-007). Q3: cuando el conjunto
  filtrado excede el límite de filas exportables, la exportación se limita y se informa al
  administrador de forma explícita (FR-019).
- **Aclaraciones de `/speckit.clarify` (2026-11-04)**: 5 preguntas resueltas, todas incorporadas a
  `spec.md` y a su sección "Clarifications". Base del adeudo (FR-011): la última membresía
  registrada del cliente, con su estado visible, descontando solo los pagos completados, sin
  replicar el filtro de membresía activa de la pantalla del Sprint 2. Filtro por periodo
  (FR-012, RN-27): se amplía al reporte de clientes. Clasificación de membresías (FR-007): cuatro
  grupos disjuntos, con las suspendidas y canceladas en un grupo propio y la ventana de 7 días
  evaluada contra la fecha de hoy. Filtro por estado (FR-013): cada reporte con el estado de su
  propio dato y los valores del esquema, y rechazo por validación de los valores no previstos.
  Pagos que cuentan como ingreso (FR-008): solo los completados, tanto en ingresos como en el
  adeudo.
- **Excepción documentada sobre "Sin detalles de implementación"**: la especificación incluye en
  FR-034 a FR-041 las restricciones técnicas no negociables de `docs/reglas.md` (principios II a
  V) y los criterios de §7.5 de `docs/sprint-4.md` (API REST, ES Modules, consultas
  parametrizadas, JWT, bcrypt, variables de entorno). No son elecciones de diseño de esta
  funcionalidad, sino restricciones heredadas que el propio documento de origen exige como
  criterios de aceptación, y siguen la convención ya establecida en
  `specs/003-entrenadores-rutinas-dashboard/spec.md`. La elección concreta de rutas, servicios,
  modelos y consultas corresponde a `/speckit.plan`.
- La especificación no introduce ninguna tecnología ni dependencia nueva: FR-045 exige justificar
  cualquier dependencia antes de incorporarla. La decisión de exportar en PDF implica una
  dependencia que `/speckit.plan` debe elegir y justificar.
- Verificación adicional: la especificación no contiene marcadores `[P]` ni identificadores de
  tarea, porque esos elementos se generan en `/speckit.tasks`. Los identificadores FR-001 a FR-045,
  SC-001 a SC-016 y RN-25 a RN-34 están numerados de forma correlativa y sin saltos, y los 45 FR
  definidos se referencian desde algún escenario, criterio de éxito o supuesto.
