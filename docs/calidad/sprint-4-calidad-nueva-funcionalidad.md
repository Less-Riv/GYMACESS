<!--

Plantilla del informe de calidad aplicada a una nueva funcionalidad.

Se llena DURANTE la ejecución de los comandos de Spec Kit
(/speckit.specify, /speckit.clarify, /speckit.plan, /speckit.tasks, /speckit.analyze)
y debe quedar COMPLETO y REVISADO antes de ejecutar /speckit.implement.

Este archivo NO es una checklist de Spec Kit: no usa casillas marcadas para
certificar implementación. Aquí [ ] significa "punto de control pendiente de
revisar por el equipo de calidad".

-->

# CALIDAD APLICADA A UNA NUEVA FUNCIONALIDAD

> **Funcionalidad evaluada:** Reportes básicos (Sprint 4)
>
> **Propósito de este documento:** registrar el plan de aseguramiento de calidad de la
> nueva funcionalidad, dejando constancia de qué se revisó en cada fase de Spec Kit,
> qué hallazgos surgieron, cómo se mitigan los riesgos y con qué criterios se autoriza
> el inicio de `/speckit.implement`.
>
> **Cómo se llena:** se completa de forma progresiva. Al terminar cada comando de Spec Kit
> se actualiza la sección 3 correspondiente a la fase ejecutada, y la sección 4 (matriz de
> trazabilidad) se completa cuando `/speckit.tasks` haya generado `tasks.md` con los
> identificadores de tarea. La sección 7 se cierra al final, como puerta de entrada a
> `/speckit.implement`.
>
> **Documentos de referencia:**
>
> * `docs/sprint-4.md` — alcance, historias, reglas de negocio y criterios de aceptación del sprint.
> * `docs/reglas.md` — constitución del proyecto (principios I a XI).
> * `docs/project-context.md` — contexto maestro, reglas RN-01 a RN-14 y criterios de cierre del MVP.
> * `specs/004-reportes-basicos/` — artefactos generados por Spec Kit (se completan al avanzar).

---

## 1. Datos generales

| Dato | Valor |
| ---- | ----- |
| Funcionalidad | Reportes básicos (US-G17 del MVP, Sprints 4) |
| Sprint | 4 |
| Rama de trabajo | *Ejemplo: `feature/004-reportes-basicos`* |
| Fecha de apertura del informe | *Ejemplo: 2026-11-04* |
| Fecha de cierre del informe | *Ejemplo: 2026-11-12* |
| Responsable de calidad | *Ejemplo: nombre del responsable de revisar el informe* |
| Equipo de desarrollo | *Ejemplo: nombres de quienes implementan* |
| Versión del documento | *Ejemplo: 0.1.0 (borrador inicial)* |
| Versión de la constitución aplicada | *Ejemplo: `docs/reglas.md` v1.1.0* |

**Documentos SPEC Kit relacionados** *(se completan conforme se generen)*:

| Artefacto | Ruta | Fecha | Estado |
| --------- | ---- | ----- | ------ |
| Especificación | `specs/004-reportes-basicos/spec.md` | *Ejemplo: 2026-11-04* | *Ejemplo: borrador* |
| Plan | `specs/004-reportes-basicos/plan.md` | *Ejemplo: 2026-11-05* | *Ejemplo: borrador* |
| Tareas | `specs/004-reportes-basicos/tasks.md` | *Ejemplo: 2026-11-07* | *Ejemplo: borrador* |
| Investigación | `specs/004-reportes-basicos/research.md` | *Ejemplo: 2026-11-05* | *Ejemplo: borrador* |
| Modelo de datos | `specs/004-reportes-basicos/data-model.md` | *Ejemplo: 2026-11-05* | *Ejemplo: borrador* |
| Contratos | `specs/004-reportes-basicos/contracts/` | *Ejemplo: 2026-11-05* | *Ejemplo: borrador* |
| Guía rápida | `specs/004-reportes-basicos/quickstart.md` | *Ejemplo: 2026-11-06* | *Ejemplo: borrador* |
| Análisis de consistencia | `specs/004-reportes-basicos/` | *Ejemplo: 2026-11-07* | *Ejemplo: borrador* |

---

## 2. Descripción de la nueva funcionalidad y objetivos de calidad

### 2.1 Descripción de la funcionalidad

*Ejemplo de cómo llenar esta sección: «Reportes básicos de solo lectura para el administrador,
que consultan clientes, membresías, pagos, adeudos y accesos ya registrados, con filtros por
periodo y estado, paginación, exportación a archivo y registro de la generación y la
exportación en la tabla de auditoría. No se crean tablas nuevas salvo que una migración
`004_...` sea necesaria para ampliar las acciones de auditoría o crear vistas.»*

**Resumen de la funcionalidad:**

**Alcance incluido:**

**Alcance excluido:**

**Usuarios y permisos involucrados:**

**Tablas y entidades consultadas:** `usuarios`, `clientes`, `tipos_membresia`, `membresias`, `pagos`, `accesos`, `auditoria` *(según `docs/sprint-4.md` §5)*.

### 2.2 Objetivo del sprint

> *"Implementar los reportes básicos del gimnasio para el administrador, con filtros y
> exportación, y cerrar el MVP con pruebas completas, documentación actualizada y una
> interfaz consistente."*
> — `docs/sprint-4.md` §2

### 2.3 Historias de usuario del sprint

| Historia | Enunciado | Prioridad |
| -------- | --------- | --------- |
| US-S4-01 | Como administrador, quiero generar un reporte de clientes para conocer cuántos hay, su estado y su situación general. | *Por definir* |
| US-S4-02 | Como administrador, quiero generar un reporte de membresías activas, vencidas y próximas a vencer para planear renovaciones. | *Por definir* |
| US-S4-03 | Como administrador, quiero generar un reporte de pagos e ingresos por periodo y de adeudos pendientes para controlar la parte económica del gimnasio. | *Por definir* |
| US-S4-04 | Como administrador, quiero generar un reporte de accesos autorizados y rechazados por periodo para supervisar el uso del gimnasio. | *Por definir* |
| US-S4-05 | Como administrador, quiero exportar un reporte a un archivo para guardarlo, imprimirlo o compartirlo. | *Por definir* |
| US-S4-06 | Como administrador, quiero que el sistema registre quién generó o exportó un reporte para mantener trazabilidad. | *Por definir* |
| US-S4-07 | Como equipo, queremos verificar y documentar todo el MVP para entregar un sistema estable y coherente con la documentación. | *Por definir* |

### 2.4 Objetivos de calidad

*Objetivos medibles, alineados con los criterios de aceptación de `docs/sprint-4.md` §7 y con
el principio X de `docs/reglas.md` (las funciones principales deben probarse antes de
considerarse terminadas).*

| ID | Objetivo de calidad | Métrica / criterio de verificación | Origen |
| -- | ------------------- | ---------------------------------- | ------ |
| QO-01 | *Ejemplo: cobertura de pruebas de contrato para cada endpoint de reportes* | *Ejemplo: 5 endpoints con prueba de contrato en verde* | `docs/reglas.md` principio X |
| QO-02 | *Ejemplo: exactitud de los totales del reporte frente a la base de datos* | *Ejemplo: 0 discrepancias en las pruebas de integración* | `docs/sprint-4.md` §7.1 |
| QO-03 | *Ejemplo: la exportación reproduce exactamente lo mostrado en pantalla* | *Ejemplo: comparación automática archivo vs. respuesta de la API* | `docs/sprint-4.md` §6 |
| QO-04 | *Ejemplo: los datos sensibles no aparecen en reportes ni exportaciones* | *Ejemplo: 0 coincidencias de contraseñas, tokens o datos biométricos* | `docs/reglas.md` principio V |
| QO-05 | *Ejemplo: la suite completa del backend se ejecuta sin fallos, cancelaciones ni omisiones* | *Ejemplo: 0 fail, 0 cancelled, 0 skipped* | `docs/sprint-4.md` §7.4 |
| QO-06 | *Por definir* | *Por definir* | *Por definir* |

### 2.5 Restricciones y riesgos heredados que condicionan la calidad

| Restricción | Implicación para el aseguramiento de calidad | Origen |
| ----------- | ------------------------------------------ | ------ |
| Reportes de solo lectura | Ninguna prueba puede escribir en `clientes`, `membresias`, `pagos` ni `accesos` | `docs/sprint-4.md` §1, §6 |
| Solo el administrador accede a los reportes | Debe probarse el rechazo de recepcionista, entrenador y cliente, y la respuesta sin token | `docs/sprint-4.md` §6, §7.3 |
| Frontend sin acceso directo a MySQL | Toda verificación de datos se hace contra la API REST | `docs/reglas.md` principio III |
| ES Modules y consultas parametrizadas | Revisión estática del código generado en la fase de plan y de tareas | `docs/reglas.md` principios III y IV |
| Sin dependencias nuevas sin justificación | Toda dependencia para exportar debe justificarse antes de incorporarse | `docs/reglas.md` principio III, `docs/sprint-4.md` §9 |

---

## 3. Aseguramiento de calidad por fase

Escala de severidad de hallazgos: **Alta** (bloquea la implementación o contradice la
constitución), **Media** (degrada la calidad pero tiene alternativa), **Baja** (mejora
opcional). Estados de hallazgo: `Abierto`, `En curso`, `Cerrado`, `Descartado`.

Decisión por fase: **Aprobado**, **Aprobado con observaciones** o **Rechazado**.

### 3.1 Fase `/speckit.specify`

**Qué se revisa:**

- Que la especificación cubra el alcance de `docs/sprint-4.md` sin ampliarlo.
- Que las historias US-S4-01 a US-S4-07 estén completas, priorizadas y sean verificables de forma independiente.
- Que los requisitos funcionales (FR) y los criterios de éxito (SC) sean medibles y sin ambigüedad.
- Que los casos límite de la sección "Edge Cases" de la plantilla de especificación estén definidos.
- Que el requisito transversal "requisito → historia → sprint → implementación" se respete (principio I).
- Pregunta central de esta fase: **¿los requisitos son claros, medibles y probables?**

**Artefactos revisados** (evidencia de esta sección):

| Artefacto | Contenido | Volumen |
| --------- | --------- | ------- |
| `specs/004-reportes-basicos/spec.md` | Especificación del Sprint 4 | 586 líneas, 45 FR, 13 SC, 10 RN, 36 escenarios |
| `specs/004-reportes-basicos/checklists/requirements.md` | Checklist de calidad de Spec Kit | 16 ítems, 16 aprobados |

**Checklist de verificación:**

- [x] `spec.md` incluye las siete historias del sprint con su enunciado y prioridad.
  - Evidencia: los siete encabezados `### Historia de usuario N - ... (Prioridad: PX) [US-S4-0N]`, con prioridades P1, P1, P1, P2, P2, P3 y P3. Los enunciados coinciden con `docs/sprint-4.md` §3.
- [x] Cada historia declara su prueba independiente (`Independent Test`).
  - Evidencia: las siete historias contienen el párrafo `**Prueba independiente**:` con su procedimiento de verificación.
- [x] Cada historia incluye escenarios de aceptación en formato Dado / Cuando / Entonces.
  - Evidencia: 36 escenarios numerados de forma correlativa (5, 5, 5, 5, 5, 5 y 6 por historia), todos con `**Dado**`, `**Cuando**` y `**Entonces**`.
- [x] Los FR cubren generación, filtrado, paginación, exportación y auditoría de reportes.
  - Evidencia: generación en FR-006 a FR-011, filtrado en FR-012 y FR-013, paginación en FR-014, exportación en FR-018 a FR-022 y auditoría en FR-023 a FR-025. Salvedad: el alcance del filtro por periodo del reporte de clientes es contradictorio entre la historia y el requisito (H-SP-01).
- [x] Los FR cubren permisos y la respuesta ante peticiones sin token.
  - Evidencia: FR-001 (HTTP 403 a recepcionista, entrenador y cliente), FR-002 (petición sin token → se requiere autenticación), FR-025 (consulta de auditoría solo del administrador) y RN-25.
- [x] Los FR excluyen datos biométricos, contraseñas y tokens.
  - Evidencia: FR-004 (respuesta del reporte), FR-020 (archivo exportado), FR-040 (datos biométricos) y RN-30.
- [ ] Los SC son medibles y verificables con las pruebas automatizadas.
  - Evidencia: los 13 SC fijan una métrica (12 de 13 se comprueban con pruebas automatizadas), pero SC-001 ("cada uno de los cinco reportes ... en menos de 2 minutos desde la pantalla de reportes") exige una medición de tiempo en la interfaz que ningún requisito define cómo se mide ni quién la verifica, y FR-027 solo cubre la ejecución de la suite de pruebas. Se registra como H-SP-11.
- [x] Los casos límite incluyen periodo sin datos, fecha inicial posterior a la final y reporte muy grande.
  - Evidencia: los casos límite "el filtro de periodo no contiene ningún dato" (FR-015), "la fecha inicial del periodo es posterior a la fecha final" (FR-016) y "el conjunto filtrado de un reporte es muy grande" (FR-019).
- [x] No se introducen funcionalidades del apartado "Fuera de alcance" de `docs/sprint-4.md`.
  - Evidencia: FR-042 reproduce el apartado §8 completo de `docs/sprint-4.md` y la sección "Alcance heredado y no reabierto" delimita el mismo perímetro. No se identifica ninguna función fuera de ese apartado.
- [x] No quedan marcadores `[NEEDS CLARIFICATION]` sin resolver o sin justificar.
  - Evidencia: 0 marcadores en el archivo. Los tres que existían (FR-007, FR-019 y FR-022) constan resueltos y con fecha en la sección "Clarifications → Sesión 2026-11-04".

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| H-SP-01 | US-S4-01, escenario de aceptación 2, indica "genera el reporte de clientes con un filtro de periodo o estado", pero FR-012 y RN-27 limitan el filtro por periodo a los reportes "de pagos, accesos y membresías"; FR-013 tampoco precisa si el reporte de clientes admite periodo. El alcance del filtro por periodo de los clientes queda indeterminado. | Alta | Abierto | Unificar en `/speckit.clarify`: ampliar FR-012 y RN-27 para incluir el reporte de clientes, o corregir el escenario 2 de US-S4-01. |
| H-SP-02 | FR-011 y RN-31 calculan el adeudo sobre "el precio de su tipo de membresía" sin indicar qué membresía se toma cuando el cliente tiene más de una (historial y vigente). La Suposición correspondiente remite al criterio del Sprint 2, que no forma parte de los artefactos revisados, de modo que la cifra del reporte de adeudos no es unívoca ni reproducible desde la especificación. | Alta | Abierto | Fijar en `/speckit.clarify` la membresía base del cálculo y dejar el criterio explícito en FR-011 y RN-31. |
| H-SP-03 | FR-013 condiciona el filtro por estado a "cuando la naturaleza del dato lo permita", criterio no verificable, y no enumera qué reportes admiten ese filtro ni qué valores de estado son válidos en cada uno, pese a que SC-006 exige verificar el 100% de los casos sin datos. | Media | Abierto | Enumerar en `/speckit.clarify` los filtros por estado admitidos por reporte y sus valores válidos. |
| H-SP-04 | FR-023 y FR-024 exigen registrar usuario, módulo, fecha, resultado y descripción, pero el escenario 3 de US-S4-06 exige además identificar el reporte y los filtros usados en cada registro, y el escenario 5 exige registrar los intentos rechazados; ningún FR lo exige. El caso de una petición sin token (FR-002) no tiene usuario atribuible para el registro. | Media | Abierto | Ampliar FR-023 y FR-024 en `/speckit.clarify` para exigir el tipo de reporte y los filtros en la descripción, el registro de los intentos rechazados y el tratamiento de las peticiones sin token. |
| H-SP-05 | RN-29 ("La exportación debe reflejar exactamente los mismos datos y filtros que el reporte mostrado en pantalla") contradice FR-019, que admite una exportación parcial con aviso cuando se alcanza el límite de filas exportables. La regla de negocio no incorpora la decisión registrada en la aclaración del 2026-11-04. | Media | Abierto | Reformular RN-29 en `/speckit.clarify` para que contemple el límite con aviso, conservando la trazabilidad con `docs/sprint-4.md` §6. |
| H-SP-06 | FR-014 y FR-019 no fijan valores numéricos: el tamaño de página (20 registros) y el límite de filas exportables (10.000) solo constan en Supuestos, sin trazabilidad a un requisito. FR-017 exige que los totales coincidan con "la suma de las filas que los componen" sin precisar si se trata de la página visible o del conjunto filtrado completo, aunque la Suposición correspondiente afirma lo segundo. | Media | Abierto | Incorporar los valores por defecto a FR-014, FR-017 y FR-019 en `/speckit.clarify`, o declararlos como parámetros a confirmar en `/speckit.plan`. |
| H-SP-07 | FR-007 usa la "fecha de corte del reporte" para la ventana de 7 días de "próxima a vencer" sin que esa fecha de corte esté definida en ningún requisito; con un filtro de periodo cuyo final sea anterior al día actual, el resultado cambia según se tome el final del periodo o la fecha actual. | Media | Abierto | Definir la fecha de corte en FR-007 y FR-012 en `/speckit.clarify`. |
| H-SP-08 | La especificación define cinco requisitos de reporte (FR-006 a FR-010), pero US-S4-03 agrupa pagos y adeudos en una sola historia y SC-001 habla de "cada uno de los cinco reportes del sprint". No queda definido si el administrador ve cuatro o cinco tipos de reporte en la pantalla. | Media | Abierto | Unificar el recuento en `/speckit.clarify` y alinearlo con SC-001, las historias y los criterios de aceptación. |
| H-SP-09 | FR-031 solo exige que la documentación refleje "el número real de sprints"; ningún requisito registra la autorización del equipo para el cuarto sprint, que la sección "Alcance heredado y no reabierto" toma de `docs/sprint-4.md` §1. | Media | Abierto | Añadir en `/speckit.clarify` un requisito de registro de la autorización y su fecha. |
| H-SP-10 | FR-016 solo cubre el caso "fecha inicial posterior a la fecha final"; no se especifica el tratamiento de fechas iguales, de fechas en formato inválido ni de un filtro sin fechas, aunque SC-006 exige verificar el 100% de los casos de validación. | Baja | Abierto | Ampliar FR-016 y los casos límite en `/speckit.clarify`. |
| H-SP-11 | SC-001 exige generar "cada uno de los cinco reportes" en menos de 2 minutos, métrica que ningún requisito define cómo se mide ni quién la verifica; FR-027 exige que la suite de pruebas se ejecute sin fallos, cancelaciones ni omisiones, lo que no cubre una medición de tiempo en la interfaz. | Baja | Abierto | Definir en `/speckit.clarify` el método y el responsable de la medición, o asimilar el criterio a la validación de extremo a extremo. |

**Decisión de la fase:** Aprobado con observaciones

**Observaciones:**

- La numeración es consistente y completa: FR-001 a FR-045, SC-001 a SC-013 y RN-25 a RN-34, sin saltos. Los 45 identificadores FR definidos están referenciados en el texto y los 45 referenciados están definidos; no hay ninguna referencia colgante.
- Las siete historias reproducen los enunciados de `docs/sprint-4.md` §3 sin alterarlos, y cada una es verificable de forma independiente como exige el principio I.
- La especificación no incorpora decisiones técnicas nuevas: FR-034 a FR-041 reproducen las restricciones no negociables de `docs/reglas.md` y del apartado §7.5 de `docs/sprint-4.md`, y la única dependencia prevista (librería de PDF) queda sujeta a justificación por FR-045.
- Los criterios de aceptación de `docs/sprint-4.md` §7.1 a §7.5 tienen respaldo en la especificación: los diez de §7.1 en FR-006 a FR-017, los cuatro de §7.2 en FR-018 a FR-022, los cinco de §7.3 en FR-001, FR-002 y FR-023 a FR-025, los ocho de §7.4 en FR-026 a FR-033 y los doce de §7.5 en FR-034 a FR-041.
- **Pendiente de verificar**: la coincidencia entre FR-011 y el cálculo de adeudo realmente implementado en el Sprint 2 no puede comprobarse con los artefactos de `specs/004-reportes-basicos/`, porque la implementación del Sprint 2 no forma parte de este conjunto. Debe confrontarse con el código del Sprint 2 en `/speckit.clarify`.
- **Pendiente de verificar**: los valores de estado válidos del cliente, de la membresía y del resultado del acceso no constan en la especificación; deben contrastarse con `database/migrations/` y con `docs/project-context.md` §12 en `/speckit.plan`, junto con el tamaño de página y el límite de exportación (H-SP-03, H-SP-06).
- **Pendiente de verificar**: la unicidad de la cifra de adeudo por cliente y la correspondencia de los totales con el origen solo se pueden comprobar sobre la base de datos real; corresponde a las pruebas de integración del Sprint 4.
- Los 11 hallazgos se trasladan a `/speckit.clarify`. H-SP-01 y H-SP-02 deben resolverse antes de `/speckit.plan` porque cambian el comportamiento que hay que construir; los 9 restantes pueden resolverse o aceptarse de forma explícita dentro de la misma fase.
- Corrección aplicada durante esta revisión: al comprobar la numeración de los escenarios se detectó que el escenario 4 de US-S4-06 había perdido su línea de inicio por una edición previa del archivo. Se restauró y la numeración quedó correlativa en los 36 escenarios de las siete historias.

### 3.2 Fase `/speckit.clarify`

**Qué se revisa:**

- Que las decisiones pendientes de `docs/sprint-4.md` §9 estén resueltas o explícitamente aplazadas con responsable.
- Que el formato de exportación y su zona horaria queden definidos antes de implementar.
- Que las decisiones no contradigan `docs/reglas.md` ni `docs/project-context.md`.
- Que las clarificaciones queden incorporadas en `spec.md` (no solo en la conversación).
- Que ninguna decisión nueva contradiga la constitución ni el contexto maestro, y que el número de preguntas no supere el cupo de la fase.

**Artefactos revisados** (evidencia de esta sección):

| Artefacto | Contenido | Volumen |
| --------- | --------- | ------- |
| `specs/004-reportes-basicos/spec.md` | Especificación tras el clarify | 678 líneas, 45 FR, 16 SC, 10 RN, 36 escenarios, 18 casos límite, 9 bullets de aclaración |
| `specs/004-reportes-basicos/checklists/requirements.md` | Checklist de calidad de Spec Kit revalidado | 16 ítems, 16 aprobados |

**Preguntas hechas y decisiones tomadas** (5 preguntas, 6 respuestas; el cupo de la fase es 5):

| # | Pregunta planteada | Respuesta del equipo | Dónde quedó registrada | Hallazgo que cierra |
| - | ------------------ | --------------------- | ---------------------- | ------------------- |
| 1 | ¿Sobre qué membresía se calcula el adeudo de cada cliente? | La última membresía registrada, aunque esté vencida o cancelada, con su estado visible y descontando solo los pagos completados. | FR-011, RN-31, US-S4-03 esc. 2, Supuestos | H-SP-02 (Alta) |
| 1b | *(aclaración dentro de la pregunta 1)* ¿Coincide con la pantalla de consulta de adeudos del Sprint 2? | No: el reporte aplica su propia regla, la pantalla del Sprint 2 no se modifica y la diferencia queda documentada. | FR-011, FR-043, Supuestos | H-SP-02 (Alta) |
| 2 | ¿El reporte de clientes admite filtro por periodo? | Sí, con el filtro aplicado sobre la fecha de registro del cliente. | FR-012, RN-27, Supuestos | H-SP-01 (Alta) |
| 3 | ¿Los grupos de membresías son excluyentes entre sí y dónde quedan suspendidas y canceladas? | Cuatro grupos disjuntos, con las suspendidas y canceladas en grupo propio, y la ventana de 7 días evaluada contra la fecha de hoy. | FR-007, US-S4-02 esc. 1, SC-014, casos límite | H-SP-07 (Media) |
| 4 | ¿Qué reportes admiten filtro por estado y con qué valores? | Cada reporte con el estado de su propio dato y los valores del esquema; los pagos y adeudos solo por periodo; un valor no previsto se rechaza con error de validación. | FR-013, SC-015, casos límite | H-SP-03 (Media) |
| 5 | ¿Qué pagos cuentan como ingreso y el adeudo descuenta el mismo conjunto? | Solo los completados, tanto en el total de ingresos como en el descuento del adeudo. | FR-008, FR-011, RN-31, US-S4-03 esc. 2, SC-016, casos límite | Nueva ambigüedad detectada en el escaneo |

**Checklist de verificación:**

- [x] Formato de exportación decidido y documentado (CSV, PDF u otro).
  - Evidencia: FR-022 fija el formato PDF y remite a FR-045 para la dependencia que lo genera.
- [x] Definido si el reporte se genera en el servidor, en la pantalla o en ambos.
  - Evidencia: la paginación se resuelve en el servidor, el reporte se muestra en pantalla y FR-017 exige que los totales correspondan al conjunto filtrado completo, con independencia de la página visible.
- [x] Definidos los periodos predefinidos ofrecidos (hoy, semana, mes, personalizado).
  - Evidencia: los Supuestos fijan hoy, semana, mes y personalizado, más un rango libre de fecha inicial y fecha final (FR-012).
- [x] Definidos los días de anticipación para "próxima a vencer".
  - Evidencia: FR-007 fija 7 días, evaluados contra la fecha de hoy y no contra el final del periodo filtrado.
- [ ] Definido el tamaño de página de los listados.
  - Evidencia: el spec propone 20 registros, pero su propio Supuesto lo marca como valor que `/speckit.plan` confirma o ajusta. El punto de decisión de `docs/sprint-4.md` §9 sigue abierto y se difiere con responsable.
- [ ] Definidos los totales, subtotales y su presentación.
  - Evidencia: los totales sí están definidos (FR-006, FR-007, FR-008, FR-017, SC-002 y SC-014), pero los subtotales solo aparecen enunciados como atributo de la entidad `reporte` y su presentación no está decidida. Se difiere a `/speckit.plan` junto con el frontend.
- [ ] Decidido entre vista de MySQL y consultas directas.
  - Evidencia: el spec no menciona ni vista ni consulta directa; es una decisión de método técnico, excluida del alcance del clarify y que se resuelve en `/speckit.plan`.
- [ ] Decidido si se requiere migración `004_...` para las acciones de auditoría.
  - Evidencia: FR-044 deja la decisión en condicional ("si se requiere una migración nueva"), sin resolverla. Se difiere a `/speckit.plan`.
- [x] Definido el límite de filas exportables para reportes muy grandes.
  - Evidencia: FR-019 y RN-29 fijan que la exportación se limita y que el administrador recibe el aviso explícito de que el archivo contiene solo una parte del conjunto filtrado. El valor numérico (10.000 filas) queda como parámetro a confirmar en `/speckit.plan`.
- [ ] Definidos zona horaria y formato de fecha.
  - Evidencia: la expresión "zona horaria" no aparece en el spec y el "formato de fecha" solo se nombra entre los valores por defecto pendientes de registrar en `docs/project-context.md` §18. Sin resolver; se difiere.
- [x] Justificada o descartada toda dependencia nueva de exportación.
  - Evidencia: FR-022 y FR-045 obligan a justificar la dependencia antes de incorporarla, y los Supuestos fijan una única librería de PDF, sin servicio externo ni conexión a la red, cuya elección y licencia se resuelven en `/speckit.plan`.
- [x] `spec.md` refleja todas las decisiones tomadas.
  - Evidencia: los 6 bullets de esta sesión están en la sección "Clarifications → Sesión 2026-11-04", que acumula 9 bullets; 0 marcadores `[NEEDS CLARIFICATION]`, 0 referencias a identificadores inexistentes y ninguna decisión contradicha por un enunciado anterior.

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| H-CL-01 | RN-29 seguía afirmando que la exportación refleja "exactamente los mismos datos y filtros" del reporte en pantalla, lo que contradecía FR-019 desde la decisión de limitar la exportación con aviso. | Alta | Cerrado | RN-29 reescrito en esta fase para incorporar el límite con aviso, sin cambiar la decisión ya tomada. |
| H-CL-02 | La entidad `reporte` enumeraba cuatro tipos (clientes, membresías, "pagos y adeudos", accesos) mientras SC-001 y los requisitos FR-006 a FR-010 definen cinco reportes; el conteo no era unívoco. | Media | Cerrado | La entidad enumera los cinco tipos y aclara que pagos y adeudos comparten pantalla pero son dos reportes distintos, en línea con la prueba independiente de US-S4-03. |
| H-CL-03 | El contenido exacto del registro de auditoría de reportes sigue sin definirse: FR-023 y FR-024 exigen usuario, módulo, fecha, resultado y descripción, pero el escenario 3 de US-S4-06 exige además identificar el reporte y los filtros usados, y el escenario 5 exige registrar los intentos rechazados. Una petición sin token no tiene usuario atribuible. | Media | Cerrado en `/speckit.plan` | Resuelto por research.md §D6: `accion` `generar_reporte`/`exportar_reporte`, `modulo` `reportes`, `resultado` `exitoso`/`rechazado` y `descripcion` con el tipo y los filtros; sin usuario no se registra y la auditoría es *best-effort*. |
| H-CL-04 | El spec no fija la zona horaria ni el formato de fecha de los reportes, y los subtotales quedan enunciados sin definir. | Media | Cerrado en `/speckit.plan` | Resuelto por research.md §D3 (fechas ISO `YYYY-MM-DD` en UTC, reutilizando `validarPeriodo`) y §D4 (tabla de totales y subtotales de cada reporte). Queda pendiente su registro en `docs/project-context.md` §18. |
| H-CL-05 | Los valores numéricos del tamaño de página (20) y del límite de exportación (10.000) constan solo en Supuestos y como parámetros a confirmar. | Baja | En curso | El valor de 20 queda confirmado por la constante `LIMITE_PAGINA` que ya usa `backend/src/services/cliente.service.js` (research.md §D2) y el límite por el comportamiento de truncamiento (research.md §D8), pero todavía no están fijados en un requisito del spec. Trasladarlos en `/speckit.tasks`. |
| H-CL-06 | RN-27 y RN-31 se apartan de la redacción de `docs/sprint-4.md` §6, que es su documento de origen. | Media | Abierto | Actualizar `docs/sprint-4.md` §6 en la fase de cierre del MVP para que la regla y su fuente coincidan (FR-030, principio I). |

**Decisión de la fase:** Aprobado con observaciones

**Observaciones:**

- El cupo de la fase se respetó: 5 preguntas (la primera con una aclaración que no cuenta como pregunta nueva) y ninguna por encima del máximo. Se priorizaron los puntos con mayor impacto sobre arquitectura, modelo de datos, diseño de pruebas y comportamiento observable.
- Las dos ambigüedades de severidad alta detectadas en la revisión de `/speckit.specify` (H-SP-01 y H-SP-02) quedaron resueltas, junto con H-SP-03 y H-SP-07. Los hallazgos abiertos pasaron de 11 a 6: 2 se cerraron en esta fase, 1 quedó resuelto por normalización y 3 siguen abiertos.
- La decisión 5 (solo los pagos completados) se detectó como ambigüedad nueva durante el escaneo, al contrastar el esquema `pagos.estado ENUM('completado','pendiente','cancelado')` con el hecho de que ningún cálculo del proyecto filtra por estado. Se verificó que el `INSERT INTO pagos` no fija esa columna, de modo que hoy todo pago creado queda en `completado`.
- **Riesgo 1 — divergencia con el Sprint 2 en el cálculo de adeudos**: el reporte usa la última membresía registrada y solo descuenta pagos completados, mientras la pantalla existente filtra por membresía activa y suma todos los pagos. Hoy ambas cifras coinciden, porque el sistema solo crea pagos en estado `completado` y la última membresía registrada suele ser la activa, pero la diferencia está documentada en los Supuestos para que el administrador sepa qué criterio produce cada monto.
- **Riesgo 2 — apartarse del documento de origen**: RN-27 y RN-31 se apartan de `docs/sprint-4.md` §6. Mientras ese documento no se actualice, existe una fuente de verdad divergente sobre las reglas de filtrado y de adeudo (H-CL-06).
- **Riesgo 3 — especificación más exigente que el comportamiento entregado**: las decisiones 1 y 5 elevan el listón de la especificación frente al Sprint 2, lo que puede generar la impresión de un defecto donde solo cambia el criterio. La mitigación es la divergencia documentada del riesgo 1.
- **Riesgo 4 — deuda pendiente en la auditoría**: FR-023 y FR-024 no cubren lo que US-S4-06 exige en sus escenarios 3 y 5, de modo que la implementación podría entregar un registro de auditoría que no permite distinguir un reporte de otro (H-CL-03). Era el punto con mayor riesgo de los que quedaban abiertos y quedó resuelto en `/speckit.plan` por research.md §D6.
- Lo que quedó pendiente, con responsable: H-CL-03, H-CL-04 y H-CL-05 se resuelven en `/speckit.plan` (contrato de auditoría, zona horaria y formato de fecha, subtotales, tamaño de página y límite de exportación); H-CL-06 se resuelve en la fase de cierre del MVP, junto con FR-030 y FR-031; y H-SP-10 (fechas iguales o con formato inválido, con criterio por defecto asumido: periodo de un día y error de validación) queda con criterio documentado y sin decisión pendiente.
- Ningún hallazgo abierto cambia la arquitectura ni el modelo de datos, de modo que la fase puede darse por cerrada y el plan puede empezar.
- Revalidación del checklist de Spec Kit: los 16 ítems siguen aprobados, sin ningún cambio de estado. Solo se corrigió una nota que quedó obsoleta: describía "próxima a vencer" contra la *fecha de corte del reporte*, término eliminado por la decisión 3, y se añadió el registro de las 5 aclaraciones.

### 3.3 Fase `/speckit.plan`

**Qué se revisa:**

- Que el plan respete la arquitectura de los sprints anteriores y los principios II, III, IV y V.
- Que el contexto técnico declare ES Modules, API REST, MySQL local con InnoDB y `utf8mb4`, y variables de entorno.
- Que la estructura del plan siga el modelo de los sprints anteriores (rutas, controladores, servicios, modelos, validadores, middlewares).
- Que los artefactos del plan (research, data-model, contracts, quickstart) cubran los contratos de la API de reportes.
- Que los contratos respeten la convención de los contratos de los sprints anteriores.
- Que la estrategia de pruebas declarada sea coherente con la infraestructura existente.

**Artefactos revisados** (evidencia de esta sección):

| Artefacto | Contenido | Volumen |
| --------- | --------- | ------- |
| `specs/004-reportes-basicos/plan.md` | Plan de implementación | 156 líneas: resumen, contexto técnico, verificación de los 11 principios, estructura y complejidad |
| `specs/004-reportes-basicos/research.md` | Fase 0 | 334 líneas, decisiones D1 a D10 |
| `specs/004-reportes-basicos/data-model.md` | Fase 1 | 188 líneas: entidades, tablas de origen, validaciones y cálculos |
| `specs/004-reportes-basicos/contracts/api-reportes.md` | Fase 1 | 303 líneas: 10 endpoints, matriz de permisos, exportación y auditoría |
| `specs/004-reportes-basicos/quickstart.md` | Fase 1 | 239 líneas: 11 escenarios, suite y cierre del MVP |

**Checklist de verificación:**

- [x] El plan no contradice ninguna restricción técnica heredada de `docs/sprint-4.md` §10.
  - Evidencia: el Contexto Técnico declara React + JavaScript, Node.js + Express con ES Modules, API REST, MySQL local InnoDB `utf8mb4`, consultas parametrizadas, scripts SQL versionados en `database/`, credenciales en variables de entorno y separación modular; la Estructura del Proyecto conserva las carpetas `frontend/`, `backend/` y `database/` sin crear `dataBase/`; la revisión visual comparada con la de `docs/sprint-4.md` §10 no encontró ninguna contradicción.
- [x] El contexto técnico mantiene `"type": "module"` en `backend/package.json`.
  - Evidencia: el Contexto Técnico declara "JavaScript (ES Modules)" y FR-038 lo exige; `backend/package.json` conserva `"type": "module"` y `backend/package.json` declara `engines.node >= 20`.
- [x] El plan declara que el frontend no accede a MySQL y que el backend es el único con acceso.
  - Evidencia: **se detectó ausente y se corrigió en esta fase**. Las Restricciones del Contexto Técnico y la fila del principio III de la Verificación de la Constitución ahora lo declaran de forma expresa (FR-035).
- [x] El plan define la estructura de rutas, controladores, servicios, modelos y validadores para el módulo de reportes.
  - Evidencia: la Estructura del Proyecto declara `routes/reportes.routes.js`, `controllers/reportes.controller.js`, `services/reporte.service.js` y `services/reporte-pdf.service.js`, `models/reporte.model.js` y `validators/reporte.validator.js`, reutilizando `middlewares/`, `utils/respuestas.js` y `utils/fechas.js`.
- [x] El plan contempla la auditoría de la generación y la exportación con usuario, módulo, fecha, resultado y descripción.
  - Evidencia: research.md §D6 fija `accion` (`generar_reporte`, `exportar_reporte`), `modulo` (`reportes`), `resultado` (`exitoso`, `rechazado`) y la `descripcion` con el tipo y los filtros; el usuario se toma del token autenticado y la fecha la pone `DEFAULT CURRENT_TIMESTAMP` de la tabla; data-model.md §1.4 y el contrato repiten la misma definición.
- [x] El plan no crea tablas nuevas salvo justificación explícita de la migración `004_...`.
  - Evidencia: research.md §D5 demuestra que la tabla `auditoria` existente ya tiene los cinco campos necesarios y que `descripcion VARCHAR(255)` basta, de modo que **no hay migración `004_`**; el plan lo refleja en el Contexto Técnico, en la Estructura del Proyecto (`migrations/` sin 004) y en el seguimiento de complejidad.
- [x] Los contratos de la API de reportes están definidos y son consistentes entre sí.
  - Evidencia: `contracts/api-reportes.md` define los 10 endpoints (5 de consulta y 5 de exportación), la matriz de permisos, los filtros comunes con sus estados admitidos, el envelope de respuesta, los encabezados de control de la exportación, la sección de auditoría y los códigos de error. Los nombres de los totales coinciden en el contrato, en research.md §D4 y en data-model.md §5.3, y el contrato remite al modelo de datos para la clasificación de membresías y el cálculo de adeudos.
- [x] El plan define la estrategia de pruebas con la infraestructura existente (`node:test` + `supertest`).
  - Evidencia: el Contexto Técnico declara "`node:test` nativo + `supertest` (contrato e integración), misma estrategia de los Sprints 1 a 3", y el plan declara `backend/tests/contract/reportes.test.js` más un archivo de integración por historia.
- [x] El plan identifica las dependencias nuevas y su justificación, si las hay.
  - Evidencia: el Contexto Técnico declara `pdfkit ^0.20 (MIT, nueva)` y research.md §D1 justifica la elección, sus dependencias transitivas, la ausencia de binarios y de red, la restricción de WinAnsi y las alternativas descartadas (`pdfmake`, `puppeteer`, generador propio, CSV).
- [x] El plan reconoce el prerrequisito de verificar el Sprint 3 con base de datos real.
  - Evidencia: **se detectó ausente y se corrigió en esta fase**. Las Restricciones del Contexto Técnico ahora incluyen "el Sprint 3 verificado con base de datos real como prerrequisito de este sprint (FR-026, `docs/sprint-4.md` §1)", y quickstart.md §6.1 recoge la verificación de la migración 003.

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| H-PL-01 | El plan declaraba CUMPLE el principio III sin cubrir la cláusula de que el frontend nunca accede a MySQL y el backend es el único componente con acceso al motor, que exigen `docs/sprint-4.md` §10 y la constitución. | Media | Cerrado | Añadido a las Restricciones del Contexto Técnico y a la fila del principio III (FR-035). |
| H-PL-02 | El plan no reconocía el prerrequisito de verificar el Sprint 3 con base de datos real (FR-026, `docs/sprint-4.md` §1), pese a que el sprint lo condiciona. | Media | Cerrado | Añadido a las Restricciones del Contexto Técnico y recogido en quickstart.md §6.1. |
| H-PL-03 | La comparación entre el archivo exportado y los datos mostrados en pantalla (SC-003) no es automatizable con la infraestructura actual: no hay lector de PDF en el proyecto, de modo que una prueba solo puede verificar el código de respuesta, los encabezados `X-Reporte-*` y el tamaño del archivo. | Baja | Abierto | Verificar el contenido del PDF de forma manual en quickstart.md §4.6 y, si se quiere automatizar, incorporar un lector de PDF como dependencia justificada en una versión posterior. |
| H-PL-04 | El encabezado del plan declara la rama `004-reportes-basicos`, que es la que reporta `setup-plan.ps1`, pero la rama de trabajo real del repositorio es `sprint-4-reportes`. | Baja | Abierto | Fijar la rama antes de implementar y alinear el encabezado del plan con ella, para que los commits del sprint no acabó en la rama equivocada. |

**Decisión de la fase:** Aprobado con observaciones

**Observaciones:**

- Los once principios de `docs/reglas.md` v1.1.0 se evaluaron uno a uno en la Verificación de la Constitución del plan, con evidencia concreta en cada fila, y el resultado es "TODAS CUMPLEN". La compuerta se reevaluó después del diseño y se vuelve a superar: el diseño no crea tablas ni vistas, no incorpora almacenes duplicados y no añade dependencias sin justificar.
- El plan cierra los tres puntos que la fase de aclaraciones había diferido: H-CL-03 (contenido del registro de auditoría) en research.md §D6, H-CL-04 (zona horaria, formato de fecha y subtotales) en §D3 y §D4, y H-CL-05 (tamaño de página y límite de exportación) en §D2 y §D8, donde el valor de 20 queda confirmado por la constante `LIMITE_PAGINA` que ya usa `backend/src/services/cliente.service.js`.
- La estrategia de pruebas se apoya en la infraestructura que ya existe y funciona: `node --test` con `supertest`, ejecutada en serie (`--test-concurrency=1`), con el helper `backend/tests/ayuda/base-pruebas.js` que recrea la base `gym_test` bajo un bloqueo en disco. No se propone ninguna carpeta de pruebas unitarias, porque el proyecto no tiene esa infraestructura y el plan no la introduce.
- La dependencia nueva está acotada y verificada: `pdfkit` ^0.20, licencia MIT, seis dependencias transitivas de JavaScript puro, sin binarios, sin red y sin servicio externo, lo que satisface el principio III y FR-045.
- Quedan dos observaciones de baja intensidad sin cerrar en esta fase: H-PL-03 (la comparación del contenido del PDF es manual) y H-PL-04 (la rama declarada en el plan no coincide con la rama de trabajo real). Ninguna bloquea la generación de las tareas.
- El plan reconoce que el Sprint 4 no crea ninguna tabla y que la única ampliación del Sprint 2 es un par de acciones nuevas dentro de la tabla `auditoria` ya existente, lo que mantiene válida la verificación de la migración 003 exigida por FR-026.

### 3.4 Fase `/speckit.tasks`

**Qué se revisa:**

- Que las tareas cubran todas las historias y que cada historia incluya sus tareas de pruebas antes de las de implementación.
- Que las rutas de los archivos mentioned en cada tarea existan en el árbol real del proyecto.
- Que exista una tarea explícita de ejecución de `npm test` al cerrar cada historia y una de suite completa.
- Que existan tareas de documentación y de actualización del reporte de pruebas.
- Que las dependencias entre tareas respeten el orden de las historias.

**Artefactos revisados** (evidencia de esta sección):

| Artefacto | Contenido | Volumen |
| --------- | --------- | ------- |
| `specs/004-reportes-basicos/tasks.md` | Lista de tareas del sprint | 62 tareas, 538 líneas, 10 fases |
| `specs/004-reportes-basicos/spec.md` | Origen de historias, FR, SC y RN | 7 historias, 45 FR, 16 SC, 10 RN |
| `specs/004-reportes-basicos/contracts/api-reportes.md` | Contrato que las tareas implementan | 10 endpoints |

**Checklist de verificación:**

- [x] Cada historia US-S4-01 a US-S4-07 tiene tareas de pruebas (contrato e integración) antes que las de implementación.
  - Evidencia: cada fase de historia abre con la sección "### Tests for User Story N" antes de "### Implementation", con una prueba de contrato y una de integración: T012 y T013, T019 y T020, T026 y T027, T033 y T034, T040 y T041, T046 y T047, y T051 para el cierre. Cada historia cierra además con su tarea de `npm test` en verde (T018, T025, T032, T039, T045, T050).
- [x] Cada tarea indica la ruta exacta del archivo que crea o modifica.
  - Evidencia: 62 de 62 tareas incluyen al menos una ruta entrecomillada de archivo, verificado con script sobre el archivo completo.
- [x] El modelo, el validador, el servicio, el controlador, las rutas y el frontend están contemplados por historia.
  - Evidencia: la fase Foundational crea el validador (T005), el modelo (T006), el servicio (T007), el controlador (T008), las rutas (T009) y los componentes y la página (T010, T011); cada historia añade después su consulta al modelo, su lógica al servicio, su manejador y ruta, y su pestaña en `frontend/src/pages/Reportes.jsx`.
- [x] Existe una tarea de pruebas de la suite completa del backend al cierre del sprint.
  - Evidencia: T060 ejecuta `npm test` en `backend/` completo y corrige regresiones de los Sprints 1, 2 y 3.
- [x] Existe una tarea de validación de extremo a extremo con base de datos real (prerrequisito de `docs/sprint-4.md` §1).
  - Evidencia: T052 verifica el prerrequisito FR-026 (migración 003 aplicada y pruebas del Sprint 3 sin omitirse) y T056 ejecuta la validación de punta a punta siguiendo los 11 escenarios de `quickstart.md` y registra los resultados.
- [x] Existe una tarea de actualización de `docs/project-context.md` y `docs/reglas.md` con las reglas RN-25 a RN-34.
  - Evidencia: T054 actualiza la sección 12 de `docs/project-context.md` con RN-15 a RN-34 y el número real de sprints, y `docs/reglas.md` con el número real de sprints; T061 revisa la consistencia entre ambos.
- [x] Existe una tarea de actualización del reporte de pruebas del proyecto.
  - Evidencia: T057 actualiza `resultados-pruebas.txt` y `resultados-pruebas.csv`, que son los archivos de reporte que ya existen en la raíz del repositorio.
- [x] Existe una tarea para el cierre y la verificación integral del MVP (US-S4-07).
  - Evidencia: la fase completa T051 a T058 cubre la prueba de cierre, el prerrequisito, los defectos del Sprint 3, la documentación, la validación de punta a punta, el reporte de pruebas y la revisión de la interfaz.
- [x] Las tareas paralelas `[P]` no comparten archivos.
  - Evidencia: verificado con script sobre las 28 tareas `[P]`, agrupadas por fase: no hay dos tareas paralelas de una misma fase que modifiquen el mismo archivo. El único aviso del script era la misma tarea T061 citando `docs/project-context.md` dos veces, no un conflicto real.
- [x] La numeración de las tareas es correlativa y cada tarea cita los requisitos que satisface.
  - Evidencia: T001 a T062 sin saltos ni duplicados, y los 45 FR y los 16 SC del spec están referenciados en al menos una tarea.
- [x] Cada criterio de aceptación de `docs/sprint-4.md` §7 tiene al menos una tarea o prueba asociada.
  - Evidencia: los 39 criterios de §7.1 a §7.5 tienen requisito y tarea; 20 se verifican con prueba automatizada, 3 tienen verificación automatizada parcial más comprobación manual en `quickstart.md` (los criterios 12, 14 y 39 de §7.2 y §7.5) y 16 dependen de verificación manual, por lo que la matriz de la sección 4 los marca de forma explícita.

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| H-TK-01 | T051 atribuía a una prueba de integración **dentro** de la suite la verificación de que "la suite completa se ejecuta sin fallos, cancelaciones ni omisiones", lo que es circular: una prueba no puede certificar el resultado de la suite que la contiene. | Media | Cerrado | T051 reescrita para verificar solo lo que sí es comprobable desde dentro de la suite: las seis acciones de auditoría del Sprint 3, las reglas RN-25 a RN-34 en `docs/project-context.md` §12 y la respuesta de los diez endpoints. La comprobación de la suite completa con 0 fallos, 0 cancelaciones y 0 omisiones queda en T060, que ya la tenía. |
| H-TK-02 | Toda la capa de frontend del sprint (T004, T010, T011, T017, T024, T031, T038, T049 y la parte de frontend de T044) queda sin ninguna prueba automatizada, porque el proyecto no tiene infraestructura de pruebas de frontend y el script `npm test` solo recoge `backend/tests/contract/*.test.js` y `backend/tests/integration/*.test.js`. | Alta | Abierto | Verificar con los escenarios manuales `quickstart.md` §4.11 (T058 y T062) y con el recorrido de las cuatro pestañas; evaluar en una versión posterior una infraestructura de pruebas de frontend, que.require una dependencia nueva justificada conforme a FR-045. |
| H-TK-03 | 21 de los 45 FR no tienen ninguna prueba automatizada que los verifique. 13 de ellos (FR-004, FR-005, FR-034 a FR-044) quedan cubiertos solo por la revisión transversal manual de T059, que es una puerta de revisión y no una prueba. | Media | Abierto | Tratar T059 como revisión manual obligatoria con registro del resultado, y evaluar pruebas estáticas para lo comprobable por análisis (consultas parametrizadas, ES Modules, ausencia de `require()`, frontend sin `mysql2`). |
| H-TK-04 | T055, que actualiza `docs/sprint-4.md` §6 para que RN-27 y RN-31 coincidan con su redacción provisional, no tiene ninguna tarea que verifique el cambio: T051 solo comprueba `docs/project-context.md` §12. | Media | Abierto | Añadir a T051 o a T061 la comprobación de que `docs/sprint-4.md` §6 contiene la redacción de RN-27 y RN-31 acordada. |
| H-TK-05 | T052 (verificar el prerrequisito FR-026) y T057 (actualizar el reporte de pruebas) no tienen verificación asociada: el primero es una comprobación manual de la migración 003, y el segundo solo tiene como evidencia indirecta la ejecución de `npm test` de T060. | Baja | Abierto | Registrar el resultado de T052 en el informe de calidad y una fila de T060 en `resultados-pruebas.txt` y `resultados-pruebas.csv` como evidencia de T057. |
| H-TK-06 | El contenido del PDF (filas exportadas, acentos y caracteres especiales) no es verificable de forma automatizada porque el proyecto no tiene un lector de PDF, de modo que FR-021 y SC-009 solo quedan cubiertos en su parte automatizable. | Baja | Abierto | Coherente con H-PL-03: la comprobación del contenido del archivo se realiza en `quickstart.md` §4.6 de forma manual. |

**Decisión de la fase:** Aprobado con observaciones

**Observaciones:**

- La lista cubre las siete historias del spec con la secuencia pruebas → modelo → servicio → endpoint → frontend → `npm test`, y cada historia queda como un incremento verificable por separado.
- La trazabilidad es completa en un extremo y parcial en el otro: los **45 FR** y los **16 SC** están citados en al menos una tarea, pero solo **24 de los 45 FR** tienen una prueba automatizada que los verifique. La matriz de la sección 4 deja constancia tarea por tarea de cuáles son.
- Las tareas que quedan sin prueba automatizada se concentran en tres bloques: la capa de frontend completa (H-TK-02), las restricciones transversales de arquitectura y seguridad que solo revisa T059 (H-TK-03), y las tareas documentales del cierre del MVP (H-TK-04, H-TK-05).
- Las tareas `[P]` respetan el criterio de archivos distintos: las que amplían `reporte.model.js`, `reporte.service.js`, `reportes.controller.js`, `reportes.routes.js` o `Reportes.jsx` no están marcadas como paralelas porque tocarían el mismo archivo que la historia anterior.
- El sprint no crea tareas de pruebas unitarias porque el proyecto no tiene esa carpeta y el plan no la introduce; toda la verificación automatizada se apoya en `node:test` con `supertest` y en el helper que recrea la base `gym_test`.
- La corrección de H-TK-01 se aplicó a `specs/004-reportes-basicos/tasks.md` y no altera ni el número de tareas ni la numeración: T051 mantiene su identificador y su fase.

### 3.5 Fase `/speckit.analyze`

**Qué se revisa:**

- Que el análisis de consistencia no reporte contradicciones entre `spec.md`, `plan.md` y `tasks.md`.
- Que los identificadores FR, SC y de tareas sean consistentes en los tres artefactos.
- Que no queden requisitos sin cobertura de pruebas.
- Que no queden tareas huérfanas sin requisito asociado.

**Artefactos analizados** (evidencia de esta sección):

| Artefacto | Contenido verificado |
| --------- | --------------------- |
| `spec.md` | 7 historias, 45 FR, 16 SC, 10 RN, 18 casos límite |
| `plan.md` | Contexto técnico, verificación de los 11 principios, estructura de archivos |
| `tasks.md` | 62 tareas, 10 fases, 28 marcas `[P]` |
| `contracts/api-reportes.md` | 10 endpoints, matriz de permisos, envelope, exportación y auditoría |
| `.specify/memory/constitution.md` | Principios I a XI con sus cláusulas DEBE |

**Checklist de verificación:**

- [ ] No hay contradicciones graves reportadas por `/speckit.analyze`.
  - Evidencia: **hay una**. El principio I de la constitución, marcado como NO NEGOCIABLE, establece "El desarrollo DEBE realizarse en tres sprints" y el Sprint 4 es un cuarto. La fila del principio I en `plan.md` lo declara CUMPLE sin evaluar esa cláusula: `plan.md` no contiene ninguna mención de "tres sprints" ni de la autorización pendiente. Se registra como H-AN-01, con severidad Alta por contradecir la constitución.
- [x] Cada FR de `spec.md` tiene al menos una historia y una tarea que lo implementa.
  - Evidencia: los 45 FR están citados en al menos una de las 62 tareas. Trece de ellos (FR-004, FR-034 a FR-045) son de alcance transversal y se asignan a todas las historias, no a una sola; los 32 restantes se asignan a la historia que los implementa.
- [ ] Cada SC de `spec.md` tiene al menos una prueba que lo verifica.
  - Evidencia: 15 de los 16 SC tienen tarea de prueba. SC-013 (documentación actualizada) no tiene ninguna: T051 solo comprueba `docs/project-context.md` §12 y ni `docs/reglas.md` ni `docs/sprint-4.md` §6 se verifican (H-AN-15).
- [ ] Cada tarea de `tasks.md` es trazable a un FR o a un SC.
  - Evidencia: 61 de las 62 tareas citan al menos un FR o un SC. T003, que amplía el helper de pruebas para cargar la semilla del Sprint 4, no cita ninguno (H-AN-17).
- [ ] Los contratos de la API son consistentes con las tareas de modelos, servicios y rutas.
  - Evidencia: cada uno de los 10 endpoints del contrato tiene tarea que lo implementa, y los nombres de los totales coinciden entre el contrato, `research.md` §D4 y `data-model.md` §5.3. Pero hay dos incoherencias de contenido: el contrato nunca enuncia el límite de 10.000 filas que sí fijan los otros cinco artefactos (H-AN-13) y usa dos nombres distintos para el nombre del cliente, `nombre_completo` en el reporte de clientes y `nombre_compliente` en los otros cuatro, sin que ninguno coincida con las columnas que enumeran las tareas (H-AN-04).
- [ ] Los casos límite de la especificación tienen tarea y prueba asignadas.
  - Evidencia: 14 de los 18 casos límite tienen tarea y prueba que los verifica. Quedan sin prueba completa: el cambio de periodo tras cargar un reporte, la exportación de un filtro sin filas (cubierto solo parcialmente por T041), el bloqueo cuando un rol no autorizado oculta la pantalla (sin pruebas de frontend) y la ausencia de datos biométricos (cubierto solo por la revisión manual T059). Se agrupan en H-AN-06, H-AN-07 y H-AN-14.
- [ ] No hay requisitos duplicados ni contradictorios entre historias.
  - Evidencia: no hay requisitos contradictorios entre historias. Sí hay dos pares duplicados: FR-023 y FR-024 son idénticos salvo el verbo, y FR-020 es un subconjunto estricto de FR-004 sin que el contrato diga cuál prevalece (H-AN-08 y H-AN-09).

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| H-AN-01 | El principio I de la constitución, marcado NO NEGOCIABLE, exige que el desarrollo se realice en tres sprints, y el Sprint 4 es un cuarto. La fila del principio I de `plan.md` lo declara CUMPLE sin evaluar esa cláusula, y la autorización del equipo para un cuarto sprint sigue pendiente (es el riesgo R-02 de la sección 5). | Alta | Abierto | Enmendar la constitución de forma explícita y separada, fuera de `/speckit.analyze`, y registrar la autorización del equipo. Después, corregir la fila del principio I de `plan.md` con la evidencia de la enmienda. |
| H-AN-02 | Seis tareas marcadas `[P]` de pruebas de contrato (T012, T019, T026, T033, T040, T046) escriben todas en el mismo archivo `backend/tests/contract/reportes.test.js`, en fases distintas. La estrategia de equipo en paralelo del propio plan (A: US-S4-01 y 02, B: US-S4-03 y 04, C: US-S4-05 y 06) hace que tres personas editen ese archivo a la vez. | Alta | Abierto | Dividir el archivo de contrato por reporte (`reportes-clientes.test.js`, `reportes-membresias.test.js`, etc.) o retirar las marcas `[P]` de esas tareas y serializarlas. |
| H-AN-03 | SC-008 exige que "el 100 % de los listados de reporte son paginados", pero la paginación solo se afirma en T013 y T020: los reportes de pagos, adeudos y accesos (T027 y T034) no la verifican. | Alta | Abierto | Añadir a T027 y T034 la comprobación de que el recorrido completo de la paginación no omite ni duplica filas. |
| H-AN-04 | El contrato expone el nombre del cliente con dos nombres distintos: `nombre_completo` en el reporte de clientes y `nombre_compliente` en los otros cuatro. Ninguno coincide con las columnas que enumeran las tareas, que proyectan `nombre` y `apellido` en T014 y `nombre` en T021. | Alta | Abierto | Unificar el nombre del campo en los cinco reportes del contrato y alinear la lista de columnas de T014, T021, T028 y T035. |
| H-AN-05 | El caso de resultado vacío (FR-015 y SC-006) solo se afirma en T013 y T020. Falta para los reportes de pagos, adeudos y accesos, pese a que ambos requisitos lo exigen para todos los reportes. | Alta | Abierto | Añadir a T027 y T034 el escenario de un filtro sin coincidencias que devuelve resultado vacío con totales en cero y ningún error. |
| H-AN-06 | FR-015 exige "un resultado vacío con un mensaje claro" y la expresión "claro" aparece nueve veces en el spec sin criterio verificable. | Media | Abierto | Fijar un criterio comprobable en FR-015, por ejemplo mensaje no vacío, sin código de error y con mención del filtro aplicado. |
| H-AN-07 | FR-032 exige "diseño y navegación consistentes" y "mensajes claros" sin remitir a un patrón verificable. | Media | Abierto | Referenciar en FR-032 las páginas existentes que sirven de patrón de comparación, para que la revisión visual de T058 y T062 tenga un criterio objetivo. |
| H-AN-08 | FR-023 y FR-024 son idénticos salvo el verbo ("generación" por "exportación"), con 0,85 de similitud. | Media | Abierto | Consolidar en un único requisito con el objeto parametrizado, o mantener ambos indicando de forma expresa que la única diferencia es el verbo. |
| H-AN-09 | FR-020 (el archivo exportado no incluye datos sensibles) es un subconjunto estricto de FR-004 (los reportes no incluyen datos sensibles), sin que el contrato indique cuál prevalece si divergen. | Media | Abierto | Declarar en FR-020 que especializa a FR-004, o unificar la formulación. |
| H-AN-10 | Ocho archivos de prueba se nombran como destino ("Prueba de integración ... en `<archivo>`") pero ninguna tarea dice de forma explícita **Crear** ese archivo; un ejecutor puede suponer que ya existen. | Media | Abierto | Añadir "Crear el archivo ..." a la primera tarea que lo usa: T012 para el contrato y T013, T020, T027, T034, T041, T047 y T051 para cada integración. |
| H-AN-11 | Doce referencias de ruta no son resolubles desde la raíz del repositorio: `contracts/api-reportes.md` (real: `specs/004-reportes-basicos/contracts/api-reportes.md`) y `seed-administrador.sql`, `seed-datos-sprint2.sql` y `seed-datos-sprint3.sql` (real: `database/seeds/...`). | Media | Abierto | Escribir las rutas completas desde la raíz del repositorio, como ya se hace en el resto del archivo. |
| H-AN-12 | El contrato define el encabezado `X-Reporte-Truncado` y dice "el límite aplicado", pero nunca enuncia el límite: 10.000 aparece en el spec, el plan, las tareas, `research.md` y `data-model.md`, y cero veces en el contrato, que es lo que consume el frontend. | Media | Abierto | Declarar el límite de 10.000 filas en la sección de exportación del contrato. |
| H-AN-13 | SC-013 no tiene ninguna tarea de prueba automatizada: T051 solo comprueba `docs/project-context.md` §12, y ni `docs/reglas.md` ni `docs/sprint-4.md` §6 se verifican, siendo esta última la que cierra la divergencia de RN-27 y RN-31 (H-AN-16). | Media | Abierto | Ampliar T051 para que compruebe las tres fuentes documentales y deje SC-013 cubierto de forma automatizada. |
| H-AN-14 | Veintiún de los 45 FR (47 %) no tienen ninguna prueba automatizada que los verifique. Trece de ellos dependen únicamente de la revisión transversal manual T059, que cubre FR-004, FR-005 y FR-034 a FR-044. | Media | Abierto | Tratar T059 como puerta manual con resultado registrado, y añadir pruebas estáticas para lo comprobable por análisis: consultas parametrizadas, ES Modules, ausencia de `require()` y frontend sin `mysql2`. |
| H-AN-15 | `plan.md` declara la rama `004-reportes-basicos` y el repositorio está en la rama `sprint-4-reportes`. | Media | Abierto | Alinear el encabezado del plan con la rama real antes de implementar, para que los commits del sprint no acaben en la rama equivocada. |
| H-AN-16 | RN-27 y RN-31 divergen de su documento de origen, `docs/sprint-4.md` §6. El plan lo anota, pero el spec no declara la divergencia como estado transitorio. | Media | Abierto | Declarar en el spec que ambas redacciones prevalecen hasta la actualización de `docs/sprint-4.md` §6 que corresponde a la tarea T055. |
| H-AN-17 | T003 es la única tarea que no cita ningún FR ni SC: amplía el helper de pruebas para cargar la semilla del Sprint 4. | Baja | Abierto | Citar FR-027 en T003, o declarar de forma expresa que es infraestructura de la suite de pruebas. |
| H-AN-18 | SC-001 mide "menos de 2 minutos" sin método de medición, instrumento ni responsable, y no es automatizable. | Baja | Abierto | Definir el método y el responsable, o declarar que se verifica de forma manual en `quickstart.md` §4.11, junto con T058. |
| H-AN-19 | FR-022 (el formato de exportación es PDF) no está citado en la prueba de contrato T040, que es justamente la que verifica el `Content-Type: application/pdf`. | Baja | Abierto | Añadir FR-022 a la cita de T040. |
| H-AN-20 | Una instancia en prosa de "auditoria" sin tilde en la sección de alcance del spec; el resto de apariciones son el nombre real de la tabla y del archivo, que son correctos. | Baja | Abierto | Corregir la instancia en prosa. |
| H-AN-21 | El contrato enuncia el tamaño de página (20 registros) solo dentro del ejemplo del envelope, no como regla declarada en los filtros comunes. | Baja | Abierto | Declarar el valor por defecto junto al resto de los filtros comunes. |
| H-AN-22 | FR-030 y FR-031 comparten los mismos documentos como objeto, con alcances distintos, y no queda claro cuál de los dos gobierna cada archivo. | Baja | Abierto | Unificar la redacción de ambos requisitos en una sola línea documental por archivo. |

**Decisión de la fase:** Aprobado con observaciones — con un hallazgo crítico (H-AN-01) que bloquea el inicio de `/speckit.implement` hasta que se enmiende la constitución y se registre la autorización del equipo

**Observaciones:**

- El análisis de consistencia se ejecutó sobre los tres artefactos centrales más el contrato de la API y la constitución, y no encontró contradicciones entre historias: la ampliación del filtro por periodo al reporte de clientes, acordada en la fase de aclaraciones, quedó coherente en US-S4-01, FR-012 y RN-27.
- La cobertura nominal es completa: los 45 FR y los 16 SC tienen al menos una tarea, y los 62 identificadores de tarea son correlativos sin saltos. El problema no es de cobertura declarada sino de cobertura efectiva: solo 24 de los 45 FR (53 %) y 15 de los 16 SC (94 %) tienen una prueba automatizada que los verifique, y dos de los criterios de éxito que exigen un porcentaje ("el 100 % de...") no se comprueban en dos de los cuatro reportes de negocio (H-AN-03 y H-AN-05).
- Los hallazgos de severidad Alta se concentran en tres bloques: la constitución (H-AN-01), la coherencia del contrato con el trabajo en paralelo y con las tareas (H-AN-02 y H-AN-04) y la verificación de los criterios de éxito (H-AN-03 y H-AN-05). Los cuatro affects a la fase de implementación y pueden resolverse antes de empezar.
- Los hallazgos H-AN-06 a H-AN-16 son de severidad Media y admiten alternativa sin rediseño: la mayoría se resuelve con dos o tres líneas por archivo. H-AN-14 tiene un matiz que conviene no perder: la revisión manual T059 no es un sustituto de una prueba, sino el único control que existe hoy sobre 19 requisitos transversales.
- No se detectaron marcadores sin resolver en ninguno de los tres artefactos: ni `TODO`, ni `[NEEDS CLARIFICATION]`, ni marcadores de plantilla. Las coincidencias aparentes de "TODO" eran la palabra "todo" en minúsculas.
- La deriva terminológica es mínima: el uso de "auditoria" sin tilde corresponde al nombre real de la tabla de MySQL y del archivo `auditoria.service.js`, y no a error en la prosa, salvo la instancia registrada en H-AN-20.
- Los identificadores de esta tabla conservan los del informe de análisis de consistencia para que ambos documentos sean trazables entre sí.
- Al no haber modificación de los artefactos, el estado de los hallazgos es "Abierto" en todos los casos. Ninguno se da por cerrado, porque el cierre corresponde a una edición posterior de `spec.md`, `plan.md`, `tasks.md` o `contracts/api-reportes.md` que requiere aprobación del equipo.
### 3.6 Resumen de decisiones por fase

| Fase | Fecha | Decisión | Hallazgos abiertos | Responsable |
| ---- | ----- | -------- | ------------------ | ------------ |
| `/speckit.specify` | | *Por definir* | | |
| `/speckit.clarify` | | *Por definir* | | |
| `/speckit.plan` | | *Por definir* | | |
| `/speckit.tasks` | | *Por definir* | | |
| `/speckit.analyze` | | *Por definir* | | |

*Ejemplo de cómo llenar esta tabla: «/speckit.analyze | 2026-11-07 | Aprobado con observaciones | 1 | Nombre del responsable».*

---

## 4. Matriz de trazabilidad

*Requisito → historia → tarea → prueba. La columna de pruebas recoge el archivo de
`backend/tests/` que verifica el requisito; cuando no existe prueba automatizada se indica la
verificación manual que lo cubre, y así queda constancia de la brecha.*

### 4.1 Requisitos funcionales

| Requisito | Historia | Tarea | Prueba | Estado |
| --------- | -------- | ----- | ------ | ------ |
| FR-001 Solo el administrador accede a los reportes | US-S4-01 a US-S4-06 | T009, T011 | `contract/reportes.test.js` (T012, T019, T026, T033, T040, T046) | Verificado |
| FR-002 Petición sin token: autenticación requerida | US-S4-01 a US-S4-06 | T009 | `contract/reportes.test.js` (T012, T019, T026, T033, T040) | Verificado |
| FR-003 Reportes de solo lectura | US-S4-03, US-S4-04 | T006, T014, T021, T028, T035 | `integration/reportes-pagos-adeudos-us-s4-03.test.js`, `integration/reportes-accesos-us-s4-04.test.js` | Verificado |
| FR-004 Sin datos sensibles en las respuestas | Transversal | T059 | Sin prueba automatizada; revisión manual de T059 | Sin prueba automatizada |
| FR-005 Pagos y accesos no se modifican ni se eliminan | US-S4-03, US-S4-04 | T028, T035 | `integration/reportes-pagos-adeudos-us-s4-03.test.js`, `integration/reportes-accesos-us-s4-04.test.js` | Verificado |
| FR-006 Reporte de clientes con totales por estado | US-S4-01 | T014, T015, T016, T017 | `contract/reportes.test.js`, `integration/reportes-clientes-us-s4-01.test.js` | Verificado |
| FR-007 Reporte de membresías en cuatro grupos disjuntos | US-S4-02 | T021, T022, T023, T024 | `contract/reportes.test.js`, `integration/reportes-membresias-us-s4-02.test.js` | Verificado |
| FR-008 Reporte de pagos e ingresos por periodo | US-S4-03 | T028, T029, T030, T031 | `contract/reportes.test.js`, `integration/reportes-pagos-adeudos-us-s4-03.test.js` | Verificado |
| FR-009 Reporte de adeudos pendientes por cliente | US-S4-03 | T028, T029, T030, T031 | `contract/reportes.test.js`, `integration/reportes-pagos-adeudos-us-s4-03.test.js` | Verificado |
| FR-010 Reporte de accesos autorizados y rechazados | US-S4-04 | T035, T036, T037, T038 | `contract/reportes.test.js`, `integration/reportes-accesos-us-s4-04.test.js` | Verificado |
| FR-011 Adeudo sobre la última membresía registrada | US-S4-03 | T029 | `integration/reportes-pagos-adeudos-us-s4-03.test.js` | Verificado |
| FR-012 Filtro por periodo | US-S4-01 a US-S4-04 | T005 | `contract/reportes.test.js` (T012, T019, T026, T033) | Verificado |
| FR-013 Filtro por estado con valores del esquema | US-S4-01, US-S4-02, US-S4-04 | T005, T010 | `contract/reportes.test.js` (T012, T019, T033) | Verificado |
| FR-014 Listados paginados | US-S4-01 a US-S4-04 | T006, T007 | `integration/reportes-*-us-s4-0*.test.js` (T013, T020, T027, T034) | Verificado |
| FR-015 Resultado vacío con mensaje claro | US-S4-01 a US-S4-04 | T010 | `integration/reportes-*-us-s4-0*.test.js` (T013, T020, T027, T034) | Verificado |
| FR-016 Error de validación si `desde` es posterior a `hasta` | US-S4-01 a US-S4-05 | T005 | `contract/reportes.test.js` (T012, T019, T026, T033, T040) | Verificado |
| FR-017 Totales sobre el conjunto filtrado completo | US-S4-01 a US-S4-04 | T007 | `integration/reportes-*-us-s4-0*.test.js` (T013, T020, T027, T034) | Verificado |
| FR-018 Exportar cada reporte a un archivo | US-S4-05 | T042, T043 | `contract/reportes.test.js` (T040) | Verificado |
| FR-019 La exportación reproduce los filtros de la pantalla | US-S4-05 | T043, T044 | `integration/reportes-exportacion-us-s4-05.test.js` (parcial) y `quickstart.md` §4.6 | Verificado parcialmente |
| FR-020 El archivo no incluye datos sensibles | US-S4-05 | T042 | `integration/reportes-exportacion-us-s4-05.test.js` (T041) | Verificado |
| FR-021 El archivo conserva acentos y caracteres especiales | US-S4-05 | T042 | `contract/reportes.test.js` (parcial) y `quickstart.md` §4.6 | Verificado parcialmente |
| FR-022 El formato de exportación es PDF | US-S4-05 | T001, T042 | `contract/reportes.test.js` (T040, `Content-Type: application/pdf`) | Verificado |
| FR-023 La generación queda registrada en la auditoría | US-S4-06 | T007, T008, T048 | `integration/reportes-auditoria-us-s4-06.test.js` (T047) | Verificado |
| FR-024 La exportación queda registrada en la auditoría | US-S4-06 | T044, T048 | `integration/reportes-auditoria-us-s4-06.test.js` (T047) | Verificado |
| FR-025 Solo el administrador consulta la auditoría | US-S4-06 | T046, T048, T049 | `contract/reportes.test.js` (T046) | Verificado |
| FR-026 Prerrequisito: Sprint 3 verificado con base real | US-S4-07 | T052 | Sin prueba automatizada; comprobación manual de la migración 003 | Sin prueba automatizada |
| FR-027 La suite completa se ejecuta sin fallos ni omisiones | US-S4-07 | T060 | Ejecución de `npm test` en `backend/` | Verificado |
| FR-028 Los defectos del Sprint 3 se corrigen o se documentan | US-S4-07 | T053 | Condicional; sin prueba automatizada | Sin prueba automatizada |
| FR-029 Validación de punta a punta de los cuatro sprints | US-S4-07 | T056 | `quickstart.md` §4, con registro de resultados | Verificado manualmente |
| FR-030 Las reglas de los sprints 3 y 4 llegan a la documentación | US-S4-07 | T054, T055, T061 | `integration/cierre-mvp-us-s4-07.test.js` (T051, solo `docs/project-context.md` §12) | Verificado parcialmente |
| FR-031 La documentación refleja el número real de sprints | US-S4-07 | T054, T061 | Sin prueba automatizada; revisión de T061 | Sin prueba automatizada |
| FR-032 Consistencia de diseño y navegación del frontend | US-S4-01 a US-S4-06 | T011, T017, T024, T031, T038, T044, T049, T058, T062 | Sin prueba automatizada; `quickstart.md` §4.11 y revisión visual de T058 y T062 | Sin prueba automatizada |
| FR-033 El reporte de pruebas queda actualizado | US-S4-07 | T057 | Sin prueba automatizada; evidencia indirecta de T060 | Sin prueba automatizada |
| FR-034 Comunicación por API REST | Transversal | T004 | Sin prueba automatizada; revisión de T059 | Sin prueba automatizada |
| FR-035 El frontend no accede a MySQL | Transversal | T059 | Sin prueba automatizada; revisión estática de T059 | Sin prueba automatizada |
| FR-036 Los permisos se validan en el backend | Transversal | T009 | `contract/reportes.test.js` (T012, T019, T026, T033, T040, T046) | Verificado |
| FR-037 Se mantienen JWT y bcrypt | Transversal | T059 | Sin prueba automatizada; revisión de T059 | Sin prueba automatizada |
| FR-038 El backend continúa con ES Modules | Transversal | T059 | Sin prueba automatizada; revisión estática de T059 | Sin prueba automatizada |
| FR-039 Las consultas están parametrizadas | Transversal | T005, T006, T059 | Sin prueba automatizada específica; revisión de T059 | Sin prueba automatizada |
| FR-040 Datos sensibles por variables de entorno y sin biométricos | Transversal | T059 | Parcial en `integration/reportes-exportacion-us-s4-05.test.js` (T041) | Verificado parcialmente |
| FR-041 Separación modular del backend | Transversal | T059 | Sin prueba automatizada; revisión de T059 | Sin prueba automatizada |
| FR-042 Nada fuera del alcance del MVP | Transversal | T059 | Sin prueba automatizada; revisión de T059 | Sin prueba automatizada |
| FR-043 No se reimplementa lo de los sprints anteriores | Transversal | T059 | Sin prueba automatizada; revisión de T059 | Sin prueba automatizada |
| FR-044 No se crean tablas ni migración nuevas | Transversal | T059 | Sin prueba automatizada; revisión de T059 | Sin prueba automatizada |
| FR-045 Toda dependencia nueva está justificada | Transversal | T001 | Sin prueba automatizada; `npm ls pdfkit` y research.md §D1 | Sin prueba automatizada |

### 4.2 Cobertura de criterios de aceptación de `docs/sprint-4.md` §7

| Criterio (§7.1 a §7.5) | Requisito | Historia | Tarea | Prueba | Estado |
| ------------------------ | --------- | -------- | ----- | ------ | ------ |
| 7.1 Reporte de clientes con totales por estado | FR-006 | US-S4-01 | T014, T015 | T012, T013 | Verificado |
| 7.1 Reporte de membresías activas, vencidas y próximas a vencer | FR-007 | US-S4-02 | T021, T022 | T019, T020 | Verificado |
| 7.1 Reporte de pagos e ingresos por periodo | FR-008 | US-S4-03 | T028, T029 | T026, T027 | Verificado |
| 7.1 Reporte de adeudos pendientes por cliente | FR-009 | US-S4-03 | T028, T029 | T026, T027 | Verificado |
| 7.1 Reporte de accesos autorizados y rechazados | FR-010 | US-S4-04 | T035, T036 | T033, T034 | Verificado |
| 7.1 Filtrado por fechas y, cuando aplique, por estado | FR-012, FR-013 | US-S4-01 a US-S4-04 | T005 | T012, T019, T026, T033 | Verificado |
| 7.1 Listados paginados | FR-014 | US-S4-01 a US-S4-04 | T006, T007 | T013, T020, T027, T034 | Verificado |
| 7.1 Periodo sin datos con resultado vacío | FR-015 | US-S4-01 a US-S4-04 | T010 | T013, T020, T027, T034 | Verificado |
| 7.1 Fecha inicial posterior a la final con error de validación | FR-016 | US-S4-01 a US-S4-05 | T005 | T012, T019, T026, T033, T040 | Verificado |
| 7.1 Totales coincidentes con los datos reales | FR-017 | US-S4-01 a US-S4-04 | T007 | T013, T020, T027, T034 | Verificado |
| 7.2 Exportar cada reporte a un archivo | FR-018 | US-S4-05 | T042, T043 | T040 | Verificado |
| 7.2 El archivo contiene los mismos datos y filtros | FR-019 | US-S4-05 | T043 | T041 parcial, quickstart §4.6 | Verificado parcialmente |
| 7.2 El archivo no incluye contraseñas, tokens ni biométricos | FR-020 | US-S4-05 | T042 | T041 | Verificado |
| 7.2 El archivo se abre con acentos y caracteres especiales | FR-021 | US-S4-05 | T042 | T040 parcial, quickstart §4.6 | Verificado parcialmente |
| 7.3 Los tres roles no autorizados reciben acceso denegado | FR-001 | US-S4-01 a US-S4-06 | T009 | T012, T019, T026, T033, T040, T046 | Verificado |
| 7.3 Una petición sin token responde que se requiere autenticación | FR-002 | US-S4-01 a US-S4-05 | T009 | T012, T019, T026, T033, T040 | Verificado |
| 7.3 La generación queda registrada en la auditoría | FR-023 | US-S4-06 | T007, T008, T048 | T047 | Verificado |
| 7.3 La exportación queda registrada en la auditoría | FR-024 | US-S4-06 | T044, T048 | T047 | Verificado |
| 7.3 Solo el administrador consulta esos registros | FR-025 | US-S4-06 | T046, T048 | T046, T047 | Verificado |
| 7.4 El Sprint 3 está verificado | FR-026 | US-S4-07 | T052 | Comprobación manual de la migración 003 | Sin prueba automatizada |
| 7.4 La suite completa se ejecuta sin fallos ni omisiones | FR-027 | US-S4-07 | T060 | Ejecución de `npm test` | Verificado |
| 7.4 Los defectos del Sprint 3 están corregidos o documentados | FR-028 | US-S4-07 | T053 | Condicional; sin prueba automatizada | Sin prueba automatizada |
| 7.4 Existe una validación de punta a punta de los cuatro sprints | FR-029 | US-S4-07 | T056 | quickstart §4 con registro | Verificado manualmente |
| 7.4 `docs/project-context.md` incluye las reglas de los sprints 3 y 4 | FR-030 | US-S4-07 | T054, T055 | T051 (solo project-context §12) | Verificado parcialmente |
| 7.4 `docs/reglas.md` y `docs/project-context.md` reflejan el número de sprints | FR-031 | US-S4-07 | T054, T061 | Revisión de T061 | Sin prueba automatizada |
| 7.4 Las pantallas mantienen diseño y navegación consistentes | FR-032 | US-S4-01 a US-S4-06 | T011, T017, T024, T031, T038, T049, T058, T062 | quickstart §4.11 | Sin prueba automatizada |
| 7.4 El reporte de pruebas está actualizado | FR-033 | US-S4-07 | T057 | Evidencia indirecta de T060 | Sin prueba automatizada |
| 7.5 El frontend se comunica mediante API REST | FR-034 | Transversal | T004 | Revisión de T059 | Sin prueba automatizada |
| 7.5 El frontend no accede directamente a MySQL | FR-035 | Transversal | T059 | Revisión estática de T059 | Sin prueba automatizada |
| 7.5 El backend es el único con acceso a MySQL | FR-035 | Transversal | T059 | Revisión estática de T059 | Sin prueba automatizada |
| 7.5 Los permisos se validan en el backend | FR-036 | Transversal | T009 | T012, T019, T026, T033, T040, T046 | Verificado |
| 7.5 Se mantiene la autenticación con JWT | FR-037 | Transversal | T059 | Revisión de T059 | Sin prueba automatizada |
| 7.5 Las contraseñas siguen protegidas con bcrypt | FR-037 | Transversal | T059 | Revisión de T059 | Sin prueba automatizada |
| 7.5 El backend continúa con ES Modules | FR-038 | Transversal | T059 | Revisión estática de T059 | Sin prueba automatizada |
| 7.5 Los archivos usan `import` y `export` | FR-038 | Transversal | T059 | Revisión estática de T059 | Sin prueba automatizada |
| 7.5 No se usa `require()` ni `module.exports` | FR-038 | Transversal | T059 | Revisión estática de T059 | Sin prueba automatizada |
| 7.5 Las consultas son parametrizadas | FR-039 | Transversal | T005, T006, T059 | Revisión estática de T059 | Sin prueba automatizada |
| 7.5 Los datos sensibles usan variables de entorno | FR-040 | Transversal | T059 | Revisión de T059 | Sin prueba automatizada |
| 7.5 Los datos biométricos no aparecen en reportes ni exportaciones | FR-040, FR-020 | US-S4-05 | T042 | T041 parcial | Verificado parcialmente |

### 4.3 Cobertura de reglas de negocio RN-25 a RN-34

*(numeración prevista en `docs/sprint-4.md` §6; aún no incorporadas a `docs/project-context.md` §12,
tarea T054)*

| Regla | Descripción resumida | Historia | Tarea | Prueba | Estado |
| ----- | -------------------- | -------- | ----- | ------ | ------ |
| RN-25 | Solo el administrador accede a los reportes | US-S4-01 a US-S4-06 | T009 | T012, T019, T026, T033, T040, T046 | Verificado |
| RN-26 | Los reportes son de solo lectura | US-S4-03, US-S4-04 | T006, T014, T021, T028, T035 | T027, T034 | Verificado |
| RN-27 | Filtro por periodo en los cuatro reportes | US-S4-01 a US-S4-04 | T005 | T012, T019, T026, T033 | Verificado |
| RN-28 | Los listados van paginados | US-S4-01 a US-S4-04 | T006, T007 | T013, T020, T027, T034 | Verificado |
| RN-29 | La exportación refleja los datos y filtros de la pantalla | US-S4-05 | T043, T044 | T041 parcial, quickstart §4.6 | Verificado parcialmente |
| RN-30 | Sin contraseñas, tokens ni datos biométricos | US-S4-05 | T042 | T041 | Verificado |
| RN-31 | Adeudo = precio del tipo de la última membresía registrada menos los pagos completados | US-S4-03 | T029 | T027 | Verificado |
| RN-32 | Pagos y accesos son historial y no se modifican | US-S4-03, US-S4-04 | T028, T035 | T027, T034 | Verificado |
| RN-33 | Sin datos, resultado vacío con mensaje claro | US-S4-01 a US-S4-04 | T010 | T013, T020, T027, T034 | Verificado |
| RN-34 | La generación y la exportación quedan en la auditoría | US-S4-06 | T007, T008, T044, T048 | T047 | Verificado |

### 4.4 Tareas importantes sin prueba automatizada asociada

*Resultado del cruce entre las 62 tareas de `tasks.md` y las 21 tareas que crean o ejecutan pruebas.
Ninguna de estas tareas es trivial: todas producen código o documentación que se entrega.*

| Tarea | Qué produce | Por qué no hay prueba automatizada | Verificación alternativa | Riesgo |
| ----- | ----------- | ---------------------------------- | ------------------------- | ------ |
| T004 | Los consumos de reportes en `frontend/src/services/api.js` | El proyecto no tiene infraestructura de pruebas de frontend | `quickstart.md` §4.11 (recorrido manual de la pantalla) | Medio: un error en la ruta o en el método HTTP rompe la pantalla sin que ninguna prueba lo detecte |
| T010 | `FiltroReporte.jsx` y `TablaReporte.jsx` | Ídem | Ídem | Medio: una tabla que no pagina o un filtro que no se aplica pasarían inadvertidos |
| T011 | `Reportes.jsx` y su ruta protegida en `App.jsx` | Ídem | Ídem | Alto: es la pantalla que entrega las cuatro historias de reportes |
| T017, T024, T031, T038 | Las cuatro pestañas de la pantalla | Ídem | Ídem | Medio: cada pestaña es la implementación visible de su historia |
| T049 | La sección de auditoría dentro de la pantalla | Ídem | Ídem | Bajo: es la capa de presentación de US-S4-06 |
| T044 (parte de frontend) | El botón de exportar y el aviso de truncamiento | Ídem | Ídem | Medio: el aviso de truncamiento es el mecanismo que hace honesto a FR-019 |
| T052 | La verificación del prerrequisito FR-026 | Es una comprobación del estado de la base de datos, no del código | Comprobación manual de `esquema_migraciones` | Alto: es la condición de entrada del sprint |
| T053 | La corrección o documentación de los defectos del Sprint 3 | Condicional: solo actúa si se detectan defectos | Revisión de T059 | Bajo |
| T055 | La actualización de `docs/sprint-4.md` §6 | Es un cambio documental y ninguna prueba comprueba documentos | Revisión de T061 | Medio: sin ella conviven dos redacciones de RN-27 y RN-31 |
| T057 | La actualización de `resultados-pruebas.txt` y `.csv` | Es un cambio documental | La ejecución de `npm test` de T060 | Bajo |
| T058, T062 | La revisión visual y de consistencia de la interfaz | Es una revisión manual por definición | quickstart §4.11 | Medio |
| T059 | La revisión transversal de 19 FR de arquitectura, seguridad y alcance | Es una revisión, no una prueba | Registro del resultado de la revisión | Alto: es la única cobertura de FR-034 a FR-044 |
| T001 | La incorporación de `pdfkit` | `npm ls pdfkit` no es una prueba | Verificación manual de dependencias | Bajo |
| T003 | La carga de la semilla del Sprint 4 en el helper | Se verifica de forma indirecta: si la semilla no cargara, las pruebas de integración fallarían | Las pruebas de integración de cada historia | Bajo |
| T042 (parcial) | El contenido del PDF: filas exportadas, acentos y caracteres | El proyecto no tiene un lector de PDF | quickstart §4.6 | Medio: FR-021 y SC-009 solo quedan cubiertos en su parte automatizable |

**Lectura del resultado**: 21 de los 45 FR tienen prueba automatizada (47 %); 3 la tienen parcial y 21 no
la tienen. El bloque más importante sin cobertura automática es la capa de frontend completa, porque
el proyecto no tiene pruebas de frontend, y el segundo es el conjunto de restricciones
transversales que solo cubre la revisión manual de T059.

**Verificación de cobertura**: los 45 FR, los 16 SC y las 10 RN quedan trazados a al menos una tarea;
de los 39 criterios de aceptación de `docs/sprint-4.md` §7, 20 tienen prueba automatizada, 3 la
tienen parcial con comprobación manual y 16 dependen de verificación manual, todos señalados en las
tablas anteriores. No hay requisitos huérfanos: ningún FR del spec carece de tarea asociada.
## 5. Análisis de riesgos y acciones de mitigación

*Escala de probabilidad e impacto: Alta / Media / Baja. El riesgo se acepta de forma
explícita cuando la mitigación no depende del equipo.*

| ID | Riesgo | Probabilidad | Impacto | Mitigación prevista | Responsable | Estado |
| -- | ------ | ------------ | ------- | ------------------- | ------------ | ------ |
| R-01 | El Sprint 3 no está verificado con base de datos real (prerrequisito de `docs/sprint-4.md` §1, FR-026) | Media | Alta | La migración 003 está aplicada y registrada en la base local y la suite del Sprint 3 se ejecutó en verde; FR-026 y las Restricciones del plan lo exigen, y quickstart.md §6.1 recoge la verificación antes de empezar. | *Por definir* | Abierto |
| R-02 | La constitución vigente fija tres sprints y el contexto maestro menciona dos, de modo que el Sprint 4 exige autorización del equipo | Alta | Alta | FR-031 obliga a que ambos documentos reflejen el número real de sprints; research.md §D10 y quickstart.md §6.5 recogen la actualización documental. | *Por definir* | Abierto |
| R-03 | El formato de exportación sigue sin definirse y condiciona la implementación | Baja | Media | Resuelto: FR-022 fija PDF y research.md §D1 justifica la dependencia que lo genera. | *Por definir* | Cerrado |
| R-04 | Dependencia nueva de exportación sin justificar | Baja | Alta | Resuelto: research.md §D1 justifica `pdfkit` ^0.20 (MIT, sin binarios ni red) y enumera las alternativas descartadas, con FR-045 como exigencia. | *Por definir* | Cerrado |
| R-05 | Los totales del reporte no coinciden con los datos reales | Media | Alta | FR-017 y SC-002 exigen que los totales se calculen sobre el conjunto filtrado completo; el modelo de datos §5.3 fija los totales de cada reporte y el contrato fija su forma; la prueba de integración los contrasta contra la base de datos. | *Por definir* | Abierto |
| R-06 | La exportación no reproduce exactamente los filtros de la pantalla | Media | Alta | research.md §D8: la exportación devuelve el conjunto filtrado completo, ignora `pagina` y expone `X-Reporte-Total-Filas`, `X-Reporte-Filas-Exportadas` y `X-Reporte-Truncado`, más un aviso de pie dentro del PDF. | *Por definir* | Abierto |
| R-07 | Se filtran datos sensibles o biométricos en las respuestas o archivos | Baja | Alta | FR-004, FR-020 y FR-040; el detalle de los cinco reportes del contrato no incluye datos biométricos ni credenciales, y la tabla `rostros` está excluida de forma expresa en el spec. | *Por definir* | Abierto |
| R-08 | Los reportes permiten el acceso a roles no autorizados | Baja | Alta | FR-001 con los middlewares `autenticar` y `autorizar` existentes; la matriz de permisos del contrato y quickstart.md §4.8 cubren los tres roles no autorizados y la petición sin token. | *Por definir* | Abierto |
| R-09 | Las consultas de los reportes no están parametrizadas y permiten inyección SQL | Baja | Alta | FR-039 y la convención del proyecto, en la que todas las consultas del backend usan parámetros posicionales; el modelo de datos §3 lista los parámetros admitidos y sus validaciones. | *Por definir* | Abierto |
| R-10 | Reportes muy grandes agotan memoria o el tiempo de respuesta | Media | Media | Paginación en servidor de 20 registros (research.md §D2) y límite de 10.000 filas exportables con aviso (research.md §D8); la meta del plan es generar el PDF de ese volumen en menos de 3 segundos. | *Por definir* | Abierto |
| R-11 | La auditoría de la generación y la exportación no registra todos los campos esperados | Baja | Media | Resuelto en el plan: research.md §D6 fija los cinco campos, el formato de la descripción y los dos casos límite, que el servicio `auditoria.service.js` ya resuelve (sin usuario no se registra; la auditoría es *best-effort*). | *Por definir* | Cerrado |
| R-12 | La documentación de reglas RN-15 a RN-34 y el número real de sprints no se actualizan | Alta | Media | FR-030 y FR-031, research.md §D10 y quickstart.md §6.5; el Sprint 3 dejó el mismo punto pendiente, de modo que depende de que el equipo apruebe las reglas. | *Por definir* | Abierto |
| R-13 | El frontend queda inconsistente con el diseño de los sprints anteriores | Media | Baja | research.md §D9: la pantalla de reportes reutiliza `estilos.css`, `TarjetaIndicador.jsx`, `ModalConfirmacion.jsx` y los patrones de `Dashboard.jsx` y `Personal.jsx`; FR-032 y quickstart.md §4.11. | *Por definir* | Abierto |
| R-14 | La base de pruebas no refleja datos representativos para los reportes | Media | Alta | El plan declara `database/seeds/seed-datos-sprint4.sql` y su carga en `backend/tests/ayuda/base-pruebas.js`, con clientes de varias fechas de registro, membresías en los cuatro estados, pagos completados en varios periodos y accesos autorizados y rechazados. | *Por definir* | Abierto |
| R-15 | El PDF no puede representar caracteres fuera de WinAnsi y la exportación fallaría con datos que los contengan | Baja | Media | research.md §D1: la exportación responde 400 `VALIDACION` con un mensaje claro en vez de generar un archivo corrupto; el contrato lo documenta. | *Por definir* | Abierto |
| R-16 | El encabezado del plan declara una rama (`004-reportes-basicos`) distinta de la rama de trabajo real (`sprint-4-reportes`), y los commits del sprint acaban en la rama equivocada | Media | Media | Fijar la rama antes de implementar y alinear el encabezado del plan con ella (H-PL-04). | *Por definir* | Abierto |

---

## 6. Estrategia de pruebas

### 6.1 Tipos de prueba

| Tipo | Alcance | Ubicación sugerida | Responsable | Estado |
| ---- | ------- | ------------------ | ------------ | ------ |
| Unitarias | No se contemplan. El proyecto no tiene infraestructura de pruebas unitarias y el plan no la introduce: el script `npm test` solo ejecuta `tests/contract/*.test.js` y `tests/integration/*.test.js`. | — | — | No aplica |
| Contrato | Códigos HTTP, forma de la respuesta, matriz de permisos y validaciones de los 10 endpoints de reportes (5 de consulta y 5 de exportación). | `backend/tests/contract/reportes.test.js` | *Por definir* | Planificado en el plan |
| Integración | Totales contra los datos reales de la base, clasificación de membresías, cálculo de adeudos, paginación, auditoría y truncamiento de la exportación, una historia por cada US-S4-01 a US-S4-07. | `backend/tests/integration/` (un archivo por historia) | *Por definir* | Planificado en el plan |
| Extremo a extremo | Los 11 escenarios de quickstart.md §4: generación de los cinco reportes, exportación a PDF, verificación de la auditoría, permisos, validaciones, resultado vacío e interfaz. | `specs/004-reportes-basicos/quickstart.md` | *Por definir* | Planificado en el plan |
| Manuales / validación de interfaz | Recorrido de las cuatro pestañas, filtros, paginación, mensajes y consistencia visual; además, la verificación del contenido real del PDF, que no es automatizable sin un lector de PDF (H-PL-03). | quickstart.md §4.6 y §4.11 | *Por definir* | Planificado en el plan |
| Regresión | Suite completa del backend, que incluye los 41 archivos de prueba existentes (16 de contrato y 25 de integración) de los sprints anteriores. | `backend/` con `npm test` | *Por definir* | Planificado en el plan |

### 6.2 Datos de prueba

| Aspecto | Definición |
| ------- | ---------- |
| Origen de los datos | Base de pruebas `gym_test`, destruida y recreada en cada ejecución por `backend/tests/ayuda/base-pruebas.js` a partir de `database/migrations/`, bajo un bloqueo en disco que serializa los procesos de prueba. |
| Semilla utilizada | `database/seeds/seed-administrador.sql`, `database/seeds/seed-datos-sprint2.sql` y `database/seeds/seed-datos-sprint3.sql`, más el nuevo `database/seeds/seed-datos-sprint4.sql` que el plan declara y que el helper deberá cargar. |
| Cobertura de datos | Clientes activos e inactivos con distintas fechas de registro; membresías en los cuatro estados, incluidas las que vencen dentro de los 7 días; pagos completados en varios periodos; accesos autorizados y rechazados con su motivo. |
| Datos de vacío | Periodos sin pagos ni accesos para validar el resultado vacío con mensaje claro y totales en cero (FR-015, RN-33). |
| Datos límite | Fecha inicial posterior a la final; estado fuera del listado del esquema; periodo de un solo día con `desde` igual a `hasta`; caracteres fuera de WinAnsi; conjunto filtrado que supera las 10.000 filas exportables. |
| Datos sensibles | Verificación de que ninguna respuesta ni archivo contiene contraseñas, tokens ni datos biométricos (FR-004, FR-020, FR-040). |
| Aislamiento | La base `gym_test` se recrea en cada ejecución y nunca se usa la base local de desarrollo; el backend toma sus credenciales de `backend/.env`. |

### 6.3 Entorno

| Aspecto | Definición |
| ------- | ---------- |
| Motores y versiones | Node.js >= 20 (`engines` de `backend/package.json`), MySQL local con InnoDB y `utf8mb4`, React 18.3 y Vite 5.4 para el frontend. |
| Variables de entorno | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_NAME_TEST`, `JWT_SECRET`, `JWT_EXPIRACION`, `PORT` y `NODE_ENV`, según `backend/.env`; `.env` está en `.gitignore` y `backend/.env.example` existe sin secretos. |
| Comando de pruebas | `npm test` en `backend/`, que ejecuta `node --test --test-concurrency=1 --test-timeout=30000 tests/contract/*.test.js tests/integration/*.test.js`. Los archivos nuevos deben ir en esas dos carpetas con sufijo `.test.js` para que el script los recoja. |
| Base de datos de pruebas | `gym_test`, creada y destruida por el helper de pruebas; el plan no requiere migración nueva para este sprint. |
| Dependencias | Las de los sprints anteriores más `pdfkit` ^0.20 (MIT), única incorporación del sprint, justificada en research.md §D1. |
| Consideraciones de red | Ninguna: la generación del PDF es local y `pdfkit` no accede a servicios externos ni descarga recursos en tiempo de ejecución. |

### 6.4 Criterios de aceptación de las pruebas

*Los criterios están definidos y localizados; las pruebas se escriben en `/speckit.tasks`, de modo que
cada casilla permanece sin marcar hasta que exista la prueba correspondiente y pase.*

- [ ] Cada historia US-S4-01 a US-S4-07 cuenta con al menos una prueba de contrato y una de integración.
  - *Planificado: un archivo de integración por historia en `backend/tests/integration/` y `backend/tests/contract/reportes.test.js`.*
- [ ] Existe prueba para el rechazo de cada rol no autorizado (recepcionista, entrenador, cliente) y para la petición sin token.
  - *Planificado: contrato, contra la matriz de permisos del contrato; 403 `AUTORIZACION` y 401 `AUTH_REQUERIDA`.*
- [ ] Existe prueba del resultado vacío con mensaje claro cuando el filtro no tiene datos.
  - *Planificado: integración, con `filas` vacío y totales en cero, sin error (FR-015).*
- [ ] Existe prueba del error de validación cuando la fecha inicial es posterior a la final.
  - *Planificado: contrato, 400 `VALIDACION` con el mensaje del validador existente.*
- [ ] Existe prueba que compara los totales del reporte con los datos reales de la base de datos.
  - *Planificado: integración, contrastando `totales` contra una consulta directa sobre la base de pruebas (SC-002).*
- [ ] Existe prueba que verifica la paginación del listado.
  - *Planificado: integración, con `paginacion` completo y recorrido sin filas repetidas ni omitidas.*
- [ ] Existe prueba que compara el archivo exportado con los datos y filtros mostrados en pantalla.
  - *Planificado: integración sobre los encabezados `X-Reporte-Total-Filas`, `X-Reporte-Filas-Exportadas` y `X-Reporte-Truncado`, más la comparación manual de quickstart.md §4.6 (H-PL-03).*
- [ ] Existe prueba que verifica la apertura correcta del archivo exportado con acentos y caracteres especiales.
  - *Planificado: integración sobre la respuesta 200 con `Content-Type: application/pdf` y la verificación manual del contenido en quickstart.md §4.6.*
- [ ] Existe prueba que verifica la ausencia de contraseñas, tokens y datos biométricos en respuestas y archivos.
  - *Planificado: contrato, recorriendo las respuestas de los cinco reportes y el detalle del PDF.*
- [ ] Existe prueba que verifica el registro de auditoría de la generación y de la exportación con usuario, módulo, fecha, resultado y descripción.
  - *Planificado: integración, con las acciones `generar_reporte` y `exportar_reporte`, el módulo `reportes` y la descripción con el tipo y los filtros.*
- [ ] Existe prueba que verifica que solo el administrador consulta los registros de auditoría.
  - *Planificado: contrato, con 403 para los tres roles no autorizados.*
- [ ] Existe prueba que verifica que los reportes no modifican datos de clientes, membresías, pagos ni accesos.
  - *Planificado: integración, comparando el estado de las tablas antes y después de generar cada reporte (FR-003).*
- [ ] Existe prueba de regresión que cubre los flujos de los sprints anteriores.
  - *Planificado: la suite completa existente, con 41 archivos de prueba, que deben seguir en verde.*
- [ ] La suite completa se ejecuta sin fallos, sin cancelaciones y sin omisiones.
  - *Planificado: `npm test` en `backend/` con 0 fallos, 0 cancelaciones y 0 omisiones (FR-027).*

### 6.5 Responsables de las pruebas

| Ámbito | Responsable | Contacto / rol en el equipo | Estado |
| ------ | ----------- | --------------------------- | ------ |
| Pruebas de contrato | | | *Pendiente* |
| Pruebas de integración | | | *Pendiente* |
| Pruebas de extremo a extremo | | | *Pendiente* |
| Validación manual de interfaz | | | *Pendiente* |
| Revisión de la auditoría de reportes | | | *Pendiente* |
| Actualización del reporte de pruebas | | | *Pendiente* |

---

## 7. Criterios de entrada y de salida para `/speckit.implement`

### 7.1 Criterios de entrada (deben cumplirse antes de implementar)

- [x] `spec.md` existe, está completo y no contiene marcadores `[NEEDS CLARIFICATION]` sin justificar.
  - Evidencia: `spec.md` tiene 678 líneas con las secciones obligatorias completas (Escenarios de usuario y pruebas, Requisitos, Criterios de éxito) y 45 FR, 16 SC y 10 RN. La búsqueda de `[NEEDS CLARIFICATION]` en el archivo devuelve 0 coincidencias, y los tres que existieron están resueltos en la sesión de aclaraciones del 2026-11-04.
- [x] Las siete historias del sprint están definidas, priorizadas y con escenarios de aceptación.
  - Evidencia: US-S4-01 a US-S4-07 con prioridades P1, P1, P1, P2, P2, P3 y P3, cada una con su motivo de prioridad, su prueba independiente y 36 escenarios en formato Dado / Cuando / Entonces repartidos 5, 5, 5, 5, 5, 5 y 6.
- [x] Las decisiones pendientes de `docs/sprint-4.md` §9 están resueltas.
  - Evidencia: las once decisiones tienen resolución documentada: formato PDF (FR-022), generación en servidor con visualización en pantalla (research.md §D2), periodos predefinidos de hoy, semana, mes y personalizado (Supuestos del spec), 7 días de anticipación (FR-007), tamaño de página de 20 registros (research.md §D2, confirmado por la constante `LIMITE_PAGINA` que ya usa `backend/src/services/cliente.service.js`), totales y subtotales por reporte (research.md §D4), consultas directas en lugar de vista (research.md §D5 y §D7), no hace falta migración `004_` (research.md §D5), límite de exportación con aviso (FR-019 y RN-29), UTC con formato ISO `YYYY-MM-DD` (research.md §D3) y `pdfkit` como única dependencia nueva, justificada (research.md §D1). Dos salvedades: el tamaño de página y el límite siguen enunciados en los Supuestos del spec y no como requisitos (H-CL-05 en curso), y la presentación visual de los totales se decide en la fase de tareas.
- [ ] `plan.md` existe y respeta las restricciones técnicas heredadas y los principios de `docs/reglas.md`.
  - Evidencia: el plan declara los once principios CUMPLE y reevalúa la compuerta después del diseño, pero H-AN-01 detecta que la cláusula del principio I "El desarrollo DEBE realizarse en tres sprints" no se evaluó en absoluto: `plan.md` no menciona "tres sprints" en ninguna línea y el Sprint 4 es un cuarto. Falla hasta que la constitución se enmiende y se registre la autorización del equipo.
- [x] `tasks.md` existe, cubre todas las historias y respeta el orden pruebas → implementación.
  - Evidencia: 62 tareas en 10 fases; cada una de las siete historias tiene fase propia y abre con sus pruebas de contrato e integración antes de la implementación (T012 y T013, T019 y T020, T026 y T027, T033 y T034, T040 y T041, T046 y T047, y T051 para el cierre), y cada historia termina con su tarea de `npm test` en verde. Salvedad: H-AN-02 es un problema de concurrencia entre tareas, no de orden.
- [ ] `/speckit.analyze` no reporta contradicciones graves pendientes.
  - Evidencia: hay cinco hallazgos de severidad Alta abiertos: H-AN-01 (contradicción con el principio I de la constitución), H-AN-02 (seis tareas `[P]` escriben en el mismo archivo de contrato), H-AN-03 (SC-008 sin verificar en dos de los cuatro reportes de negocio), H-AN-04 (el contrato usa `nombre_completo` en un reporte y `nombre_compliente` en los otros cuatro) y H-AN-05 (FR-015 y SC-006 sin verificar en dos de los cuatro reportes).
- [x] La matriz de trazabilidad de la sección 4 está completa, sin requisitos huérfanos.
  - Evidencia: la sección 4.1 traza los 45 FR, la 4.2 los 39 criterios de `docs/sprint-4.md` §7 y la 4.3 las 10 RN, cada uno con historia, tarea y prueba. Ningún FR carece de tarea. Salvedad: T003 es la única tarea sin FR ni SC citados, y 21 de los 45 FR no tienen prueba automatizada, según consta en la sección 4.4.
- [ ] Los objetivos de calidad de la sección 2.4 están asociados a pruebas identificables.
  - Evidencia: la sección 2.4 conserva las seis filas de ejemplo de la plantilla, con QO-01 a QO-05 marcadas como "*Ejemplo*" y QO-06 como "*Por definir*". No hay objetivos de calidad reales que asociar a pruebas, y es la única sección de esta plantilla que quedó sin llenar.
- [x] El análisis de riesgos de la sección 5 no tiene riesgos de impacto alto sin mitigación asignada.
  - Evidencia: los 16 riesgos de la sección 5 tienen probabilidad, impacto y mitigación prevista, y los nueve de impacto Alto la tienen asignada. Salvedad: la columna "Responsable" está en "*Por definir*" en los dieciséis, y R-02 sigue abierto a la espera de la autorización del equipo.
- [x] Todas las fases de la sección 3 tienen decisión registrada y no queda ninguna en «rechazado».
  - Evidencia: 3.1, 3.2, 3.3 y 3.4 registran "Aprobado con observaciones" y 3.5 registra "Aprobado con observaciones" con un hallazgo crítico señalado. Ninguna fase queda en "rechazado". Salvedad: la sección 3.6, que resume las decisiones por fase, conserva todavía su tabla de ejemplo.
- [ ] El prerrequisito del Sprint 3 está verificado con base de datos real.
  - Evidencia: la migración 003 está aplicada y registrada en `esquema_migraciones` de la base local `gimnasio`, y las seis tablas del Sprint 3 existen en `gimnasio` y en `gym_test`. Lo que no consta es lo demás: no se ha vuelto a ejecutar la suite en esta sesión ni existe un registro de la verificación en el repositorio, y la tarea T052 que produciría ese registro está en la fase 9 del propio sprint, por lo que no puede cerrar este criterio de entrada.
- [ ] La autorización del Sprint 4 y el número real de sprints están confirmados por el equipo.
  - Evidencia: `docs/reglas.md` declara tres sprints y `docs/project-context.md` §16 declara dos, mientras que la nota de alcance de `docs/sprint-4.md` condiciona el sprint a la autorización del equipo o del profesor. No hay ningún registro de esa autorización en el repositorio. Es el hallazgo H-AN-01 y el riesgo R-02.

### 7.2 Criterios de salida (deben cumplirse al terminar de implementar)

- [ ] Todas las tareas de `tasks.md` están completadas.
- [ ] La suite completa del backend se ejecuta sin fallos, sin cancelaciones y sin omisiones.
- [ ] Todas las pruebas de la sección 6.4 pasan.
- [ ] La validación de extremo a extremo del flujo de `docs/sprint-4.md` §4 está registrada.
- [ ] Los criterios de aceptación de `docs/sprint-4.md` §7 están verificados y registrados.
- [ ] `docs/project-context.md` §12 incorpora las reglas RN-25 a RN-34.
- [ ] `docs/reglas.md` refleja el número real de sprints.
- [ ] El reporte de pruebas del proyecto está actualizado con los resultados reales.
- [ ] La pantalla de reportes mantiene consistencia de diseño y navegación con los sprints anteriores.
- [ ] No se introdujeron dependencias no justificadas ni tecnologías fuera del alcance.
- [ ] La sección 8 (Conclusiones) y la sección 9 (Registro de cambios) están completas.

### 7.3 Puerta de entrada: veredicto

| Campo | Valor |
| ----- | ----- |
| ¿Se autoriza iniciar `/speckit.implement`? | **No.** De los doce criterios de entrada se cumplen siete y fallan cinco, y uno de los que fallan es crítico por contradicción con la constitución. |
| Condiciones o reservas | Cerrar como mínimo estas tres, que son las que bloquean la puerta: (1) enmendar la constitución de forma explícita y registrar la autorización del equipo para el Sprint 4, lo que resuelve H-AN-01 y los criterios 4 y 12; (2) ejecutar la suite completa del backend y registrar el resultado en el repositorio, lo que resuelve el criterio 11; (3) llenar la sección 2.4 con los objetivos de calidad reales del sprint y su prueba asociada, lo que resuelve el criterio 8. Los hallazgos Alta H-AN-02 a H-AN-05 no bloquean el inicio, pero sí deben resolverse antes de dar el sprint por conforme, porque afectan a la corrección de la API y a la verificación de SC-008 y FR-015. |
| Fecha del veredicto | 2026-11-04 |
| Responsable que autoriza | *Por definir: el equipo, con el profesor como aprobador del cuarto sprint* |
| Firma del equipo | *Pendiente* |

---

## 8. Conclusiones y recomendaciones

### 8.1 Conclusiones

El Sprint 4 queda especificado, planificado y desglosado con un nivel de detalle que permite
implementarlo sin decisiones pendientes: siete historias con sus escenarios de aceptación, 45
requisitos funcionales, 16 criterios de éxito, 10 reglas de negocio nuevas, un contrato de API con
10 endpoints, un modelo de datos con sus reglas de validación y 62 tareas repartidas en diez fases.
La completitud nominal es del 100 %: ningún requisito del spec carece de tarea y ninguna tarea
carece de historia.

La calidad del trabajo se juega, sin embargo, en la verificación efectiva y ahí hay una brecha
sustancial. Solo 24 de los 45 requisitos funcionales (53 %) y 15 de los 16 criterios de éxito (94 %)
disponen de una prueba automatizada que los verifique. La brecha se concentra en tres bloques: toda
la capa de frontend del sprint, que no tiene ninguna prueba porque el proyecto no tiene
infraestructura de pruebas de frontend; las diecinueve restricciones transversales de
arquitectura, seguridad y alcance, que solo cubre la revisión manual T059; y las tareas
documentales del cierre del MVP, entre ellas la actualización de `docs/sprint-4.md` §6, que no
tiene ninguna comprobación asociada. Además, dos criterios de éxito redactados con un porcentaje,
SC-008 y SC-006, no se comprueban en dos de los cuatro reportes de negocio, de modo que una suite
en verde no demuestra todavía el cien por cien que esos criterios exigen.

Sobre la automatización del PDF hay que ser explícito: el proyecto no incorpora un lector de PDF,
así que el contenido del archivo exportado (las filas y los acentos) solo puede verificarse de
forma manual en `quickstart.md` §4.6. La parte automatizable, el código de respuesta, los
encabezados de control y el truncamiento, sí queda cubierta.

El hallazgo de mayor severidad no es técnico sino de gobernanza. La constitución, en su principio I
marcado como no negociable, establece que el desarrollo se realiza en tres sprints, y el Sprint 4
es un cuarto. La verificación de la constitución del plan declara los once principios cumplidos sin
evaluar esa cláusula, y la autorización del equipo sigue pendiente. Ninguna cantidad de trabajo
técnico sustituye esa decisión: es la primera condición para empezar.

El proceso de calidad funcionó y dejó rastro. En el camino se detectaron y corrigieron seis defectos
reales en los propios artefactos: la regla RN-29 y el recuento de tipos de reporte en el spec, la
declaración de que el frontend no accede a MySQL y el prerrequisito de verificar el Sprint 3 en el
plan, la coherencia entre totales y página visible en el spec, y la circularidad de la prueba de
cierre del MVP en las tareas. Todos ellos están corregidos y documentados en las secciones 3.1 a 3.5
de esta plantilla.

El veredicto de la puerta de entrada es negativo: siete de los doce criterios de entrada se
cumplen y cinco fallan, uno de ellos por contradicción con la constitución. El trabajo de
especificación, planificación y desglose puede darse por cerrado; la puerta a la implementación no
se abre todavía.

### 8.2 Recomendaciones

| ID | Recomendación | Prioridad | Responsable | Fecha compromiso |
| -- | -------------- | --------- | ------------ | ----------------- |
| REC-01 | Enmendar la constitución de forma explícita para reconocer el cuarto sprint o la ampliación del MVP, y registrar la autorización del equipo con su fecha. Cierra H-AN-01, R-02 y los criterios de entrada 4 y 12. Es la única acción que no puede ejecutarse dentro del sprint. | Alta | Equipo, con el profesor como aprobador | Antes de `/speckit.implement` |
| REC-02 | Ejecutar `npm test` en `backend/` y dejar constancia del resultado en el repositorio, con el recuento de pruebas y el tiempo. Cierra el criterio de entrada 11, que hoy solo tiene verificado el estado de la migración 003. | Alta | Responsable de calidad | Antes de `/speckit.implement` |
| REC-03 | Llenar la sección 2.4 de esta plantilla con los objetivos de calidad reales del sprint, cada uno con su métrica y la prueba que lo verifica. Es la única sección de la plantilla que quedó como plantilla y bloquea el criterio de entrada 8. | Alta | Responsable de calidad | Antes de `/speckit.implement` |
| REC-04 | Corregir los cuatro hallazgos Alta que no dependen de la constitución: dividir el archivo de contrato por reporte o retirar los `[P]` (H-AN-02), unificar el nombre del campo del cliente en el contrato y alinear las columnas de T014, T021, T028 y T035 (H-AN-04), y añadir a T027 y T034 la verificación de paginación y de resultado vacío (H-AN-03 y H-AN-05). | Alta | Responsable técnico | Antes de dar el sprint por conforme |
| REC-05 | Fijar en el spec el tamaño de página (20) y el límite de exportación (10.000) como requisitos con identificador, y no solo como supuestos, para que la matriz de trazabilidad pueda enlazarlos con una prueba. Cierra H-CL-05, que sigue en curso. | Media | Responsable técnico | Durante la fase de tareas |
| REC-06 | Enunciar el límite de 10.000 filas y el tamaño de página en `contracts/api-reportes.md`, que es el documento que consume el frontend, y no solo en el ejemplo del envelope. Cierra H-AN-12 y H-AN-21. | Media | Responsable técnico | Durante la fase de tareas |
| REC-07 | Fijar en FR-015 un criterio comprobable de "mensaje claro" y en FR-032 el patrón concreto de comparación de las pantallas existentes. Cierra H-AN-06 y H-AN-07, y hace verificables T058 y T062. | Media | Responsable de calidad | Durante la fase de tareas |
| REC-08 | Decidir la cobertura de los diecinueve requisitos transversales: o se añaden pruebas estáticas para lo comprobable por análisis (consultas parametrizadas, ES Modules, ausencia de `require()`, frontend sin `mysql2`), o se convierte T059 en una revisión con registro formal de resultado. Cierra H-AN-14. | Media | Responsable técnico | Durante la implementación |
| REC-09 | Corregir las rutas que no resuelven desde la raíz del repositorio y hacer explícito el "Crear" de los ocho archivos de prueba nuevos. Cierra H-AN-10 y H-AN-11. | Media | Responsable técnico | Durante la fase de tareas |
| REC-10 | Asignar responsable a los dieciséis riesgos de la sección 5 y a los seis ámbitos de la sección 6.5, hoy todos en "*Por definir*". La sección 6.5 queda vacía porque depende de que el equipo nombre a quienes los cubrirán. | Media | Responsable de calidad | Antes de `/speckit.implement` |
| REC-11 | Fijar la rama de trabajo y alinear el encabezado de `plan.md` con ella, y declarar en el spec que la redacción de RN-27 y RN-31 prevalece hasta la actualización de `docs/sprint-4.md` §6. Cierra H-AN-15 y H-AN-16. | Media | Responsable técnico | Antes de implementar |
| REC-12 | Cerrar la sección 3.6 con el resumen de decisiones por fase y el registro de cambios de la sección 9, de modo que la plantilla refleje el estado real de las cinco fases. | Baja | Responsable de calidad | Antes de `/speckit.implement` |

### 8.3 Evaluación de la calidad aplicada

| Dimensión | Evaluación | Comentario |
| --------- | ---------- | ----------- |
| Claridad de los requisitos | Parcial | 45 FR redactados con DEBE y NO DEBE, 13 SC medibles y 18 casos límite definidos. Restan tres ambigüedades abiertas (H-AN-06, H-AN-07 y H-AN-18) y dos pares de requisitos duplicados (H-AN-08 y H-AN-09). |
| Trazabilidad requisito → historia → tarea → prueba | Completa en lo nominal | Los 45 FR, los 16 SC y las 10 RN están enlazados en la sección 4, sin requisitos huérfanos. Queda una tarea huérfana (T003, sin FR ni SC citados) y 21 FR sin prueba automatizada, según la sección 4.4. |
| Cobertura de pruebas | Insuficiente en lo efectivo | 24 de 45 FR (53 %) y 15 de 16 SC (94 %) con prueba automatizada. La capa de frontend (9 tareas) no tiene ninguna porque el proyecto carece de esa infraestructura, y SC-008 y SC-006 no se comprueban en dos de los cuatro reportes de negocio. |
| Cumplimiento de los principios de `docs/reglas.md` | No conforme | Diez de los once principios cuentan con evidencia en la verificación del plan. El principio I requiere enmienda y autorización del equipo, porque fija tres sprints y el Sprint 4 es un cuarto (H-AN-01). |
| Consistencia con `docs/project-context.md` | Parcial | Las reglas RN-25 a RN-34 están redactadas en el spec pero todavía no incorporadas a la sección 12, que corresponde a la tarea T054; RN-27 y RN-31 divergen de `docs/sprint-4.md` §6, su documento de origen, hasta que se ejecute T055. |
| Gestión de riesgos | Adecuada | 16 riesgos con probabilidad, impacto y mitigación, los nueve de impacto Alto con mitigación asignada y tres cerrados ya en el plan. Pendiente nombrar a los responsables. |
| Preparación para el cierre del MVP (US-S4-07) | Incompleta | Las tareas T051 a T058 cubren la verificación, la documentación, la validación de punta a punta y el reporte de pruebas. No está la verificación formal del prerrequisito FR-026, que es en realidad un criterio de entrada, y el cierre documental depende de que el equipo apruebe las reglas nuevas. |
## 9. Registro de cambios

| Versión | Fecha | Autor | Descripción |
| ------- | ----- | ----- | ----------- |
| 0.1.0 | *Ejemplo: 2026-11-04* | *Ejemplo: nombre* | *Ejemplo: creación de la plantilla y apertura del informe* |
| | | | |
| | | | |

*Ejemplo de cómo llenar este registro: «0.2.0 | 2026-11-07 | Nombre | Cierre de la fase
`/speckit.analyze` con 2 hallazgos de severidad media en estado abierto.»*

---

## Anexo A. Comandos de Spec Kit cubiertos

| Comando | Artefacto que genera | Fase de la sección 3 | Llenado del informe |
| ------- | -------------------- | --------------------- | ------------------- |
| `/speckit.specify` | `spec.md` | 3.1 | *Pendiente* |
| `/speckit.clarify` | `spec.md` actualizado | 3.2 | *Pendiente* |
| `/speckit.plan` | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` | 3.3 | *Pendiente* |
| `/speckit.tasks` | `tasks.md` | 3.4 | *Pendiente* |
| `/speckit.analyze` | Informe de consistencia | 3.5 | *Pendiente* |
| `/speckit.checklist` | `checklists/` | 3.3 y 3.5 | *Pendiente* |
| `/speckit.implement` | Código y pruebas | 7.2 | *Pendiente* |

## Anexo B. Referencias normativas del Sprint 4

| Documento | Apartado | Qué aporta a este informe |
| --------- | -------- | -------------------------- |
| `docs/sprint-4.md` | §1 Contexto | Prerrequisito de verificación del Sprint 3 y arquitectura heredada |
| `docs/sprint-4.md` | §2 Objetivo | Objetivo del sprint (sección 2.2) |
| `docs/sprint-4.md` | §3 Historias | US-S4-01 a US-S4-07 (sección 2.3) |
| `docs/sprint-4.md` | §5 Entidades y tablas | Tablas consultadas por los reportes |
| `docs/sprint-4.md` | §6 Reglas de negocio | RN-25 a RN-34 (sección 4) |
| `docs/sprint-4.md` | §7 Criterios de aceptación | Cobertura de criterios (secciones 4 y 6.4) |
| `docs/sprint-4.md` | §8 Fuera de alcance | Control de expansiones de alcance |
| `docs/sprint-4.md` | §9 Decisiones pendientes | Ítem de revisión de `/speckit.clarify` |
| `docs/sprint-4.md` | §10 Restricciones técnicas | Restricciones heredadas (sección 2.5) |
| `docs/sprint-4.md` | §11 Entregables | Exigencia de este informe de calidad |
| `docs/sprint-4.md` | §12 Criterios de cierre | Criterios de salida (sección 7.2) |
| `docs/reglas.md` | Principios I a XI | Marco de revisión por fase |
| `docs/reglas.md` | Principio X Pruebas | Objetivo de calidad QO-05 |
| `docs/project-context.md` | §7.9 Reportes | Definición funcional del módulo de reportes |
| `docs/project-context.md` | §12 Reglas de negocio | Origen de las RN-01 a RN-14 vigentes |
| `docs/project-context.md` | §17 Criterios de cierre del MVP | Referencia del cierre del MVP (US-S4-07) |
