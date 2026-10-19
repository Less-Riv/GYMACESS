# Lista de control de calidad de la especificación: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Propósito**: validar la completitud y la calidad de la especificación antes de pasar a la planificación
**Creada**: 2026-10-19
**Especificación**: [spec.md](../spec.md)

## Calidad del contenido

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs)
      *Únicos detalles técnicos presentes: restricciones heredadas y no negociables de `docs/reglas.md`
      (principios III y IV) y de `docs/sprint-3.md` §1 y §5; la especificación no elige tecnologías
      nuevas, reutiliza lo entregado en los Sprints 1 y 2 y describe el dashboard como vista o
      consultas consolidadas sin fijar su diseño definitivo (FR-017, FR-023).*
- [x] Enfocada en el valor de usuario y en las necesidades del negocio
- [x] Redactada para partes interesadas no técnicas
- [x] Secciones obligatorias completadas (escenarios, reglas de negocio, requisitos, criterios de éxito, supuestos)

## Completitud de los requisitos

- [x] Sin marcadores `[NEEDS CLARIFICATION]` restantes
      *Ninguna decisión quedó pendiente tras la sesión de clarificación del 2026-10-19, que resolvió
      las 5 preguntas registradas en la sección `Clarifications` y las integró en FR-001, FR-004,
      FR-011, FR-016, US-S3-01, US-S3-04, US-S3-06 y en los casos límite.*
- [x] Requisitos comprobables y sin ambigüedades
      *Las zonas abiertas en la revisión inicial (exclusividad del dashboard, acceso del entrenador
      tras la reasignación, campos del progreso, baja de entrenador con carga asignada y definición
      del progreso general del dashboard) quedaron cerradas.*
- [x] Criterios de éxito medibles
- [x] Criterios de éxito ajenos a la tecnología
      *SC-012 menciona los scripts versionados porque `docs/reglas.md` (principio IV) exige poder
      reconstruir la base desde cero: es un criterio heredado, no una decisión de diseño.*
- [x] Definidos todos los escenarios de aceptación (7 historias, de US-S3-01 a US-S3-07, con 41
      escenarios de aceptación)
- [x] Identificados los casos límite (13)
- [x] Alcance claramente delimitado (sección "Alcance heredado y no reabierto" + FR-029 y FR-030)
- [x] Dependencias y supuestos identificados (14 supuestos)

## Preparación de la funcionalidad

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros (FR-001 a FR-032
      vinculados a historias, casos límite o supuestos)
- [x] Los escenarios de usuario cubren los flujos principales (alta de entrenador, asignación y
      reasignación, rutinas con ejercicios, objetivos y progresos, vista propia del cliente,
      dashboard y carga del personal)
- [x] La funcionalidad cumple los resultados medibles definidos en Criterios de éxito
- [x] No se filtran decisiones de implementación propias de la especificación

## Notas

- Las reglas RN-15 a RN-24 son nuevas respecto de `docs/project-context.md` §12 (que llega hasta la
  RN-14). La especificación las define en su propia sección y condiciona su incorporación a
  `docs/project-context.md` y `docs/reglas.md` a la aprobación del equipo, conforme al principio I
  de la constitución. Punto a resolver en `/speckit.clarify` o en la revisión del equipo.
- Se respetó lo ya entregado: el alcance se limita a entrenadores, asignaciones, rutinas,
  ejercicios, objetivos, progresos, vista propia del cliente, carga del personal y dashboard; los
  módulos de autenticación, usuarios, clientes, membresías, pagos, rostros y accesos solo se
  consultan (FR-029), sin reabrirlos.
- Se mantuvo una única asignación activa por cliente y una única rutina activa por cliente, por
  analogía con la "una única membresía activa" del Sprint 2, para conservar la coherencia de las
  reglas de negocio del sistema.
- El dashboard se limita a agregados sobre información ya existente en el sistema (clientes,
  membresías, accesos) más los datos nuevos del sprint, evitando ampliar el alcance a reportes
  complejos excluidos en `docs/sprint-3.md` §1.
- Sesión de clarificación del 2026-10-19: 5 preguntas respondidas (A, A, B, A, A) que cerraron la
  exclusividad del dashboard por rol, el acceso del entrenador tras la reasignación, los campos del
  progreso, el efecto de la baja de un entrenador con carga asignada y la definición del indicador
  de progreso general del dashboard.
- Sin ítems pendientes de validación: la especificación está lista para `/speckit.plan`.
