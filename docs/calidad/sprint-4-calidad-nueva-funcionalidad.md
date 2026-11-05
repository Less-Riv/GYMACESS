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

**Checklist de verificación:**

- [ ] `spec.md` incluye las siete historias del sprint con su enunciado y prioridad.
- [ ] Cada historia declara su prueba independiente (`Independent Test`).
- [ ] Cada historia incluye escenarios de aceptación en formato Dado / Cuando / Entonces.
- [ ] Los FR cubren generación, filtrado, paginación, exportación y auditoría de reportes.
- [ ] Los FR cubren permisos y la respuesta ante peticiones sin token.
- [ ] Los FR excluyen datos biométricos, contraseñas y tokens.
- [ ] Los SC son medibles y verificables con las pruebas automatizadas.
- [ ] Los casos límite incluyen periodo sin datos, fecha inicial posterior a la final y reporte muy grande.
- [ ] No se introducen funcionalidades del apartado "Fuera de alcance" de `docs/sprint-4.md`.
- [ ] No quedan marcadores `[NEEDS CLARIFICATION]` sin resolver o sin justificar.

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| *H-SP-01* | *Ejemplo: el requisito FR-00X no define el tamaño máximo de página* | *Media* | *Abierto* | *Resolver en /speckit.clarify* |

*La fila anterior es un ejemplo de formato: eliminarla al llenar la tabla.*

**Decisión de la fase:** *Por definir (aprobado / aprobado con observaciones / rechazado)*

**Observaciones:** *Ejemplo: «Ninguna» o detalle de los puntos que quedaron condicionados a `/speckit.clarify`.*

### 3.2 Fase `/speckit.clarify`

**Qué se revisa:**

- Que las decisiones pendientes de `docs/sprint-4.md` §9 estén resueltas o explícitamente aplazadas con responsable.
- Que el formato de exportación y su zona horaria queden definidos antes de implementar.
- Que las decisiones no contradigan `docs/reglas.md` ni `docs/project-context.md`.
- Que las clarificaciones queden incorporadas en `spec.md` (no solo en la conversación).

**Checklist de verificación:**

- [ ] Formato de exportación decidido y documentado (CSV, PDF u otro).
- [ ] Definido si el reporte se genera en el servidor, en la pantalla o en ambos.
- [ ] Definidos los periodos predefinidos ofrecidos (hoy, semana, mes, personalizado).
- [ ] Definidos los días de anticipación para "próxima a vencer".
- [ ] Definido el tamaño de página de los listados.
- [ ] Definidos los totales, subtotales y su presentación.
- [ ] Decidido entre vista de MySQL y consultas directas.
- [ ] Decidido si se requiere migración `004_...` para las acciones de auditoría.
- [ ] Definido el límite de filas exportadas para reportes muy grandes.
- [ ] Definidos zona horaria y formato de fecha.
- [ ] Justificada o descartada toda dependencia nueva de exportación.
- [ ] `spec.md` refleja todas las decisiones tomadas.

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| *H-CL-01* | *Ejemplo: el formato de exportación sigue sin definirse* | *Alta* | *Abierto* | *Registrar la decisión en spec.md antes de /speckit.plan* |

*La fila anterior es un ejemplo de formato: eliminarla al llenar la tabla.*

**Decisión de la fase:** *Por definir (aprobado / aprobado con observaciones / rechazado)*

**Observaciones:** *Ejemplo: detalle de decisiones adoptadas y de las que quedaron pendientes con responsable y fecha.*

### 3.3 Fase `/speckit.plan`

**Qué se revisa:**

- Que el plan respete la arquitectura de los sprints anteriores y los principios II, III, IV y V.
- Que el contexto técnico declare ES Modules, API REST, MySQL local con InnoDB y `utf8mb4`, y variables de entorno.
- Que la estructura del plan siga el modelo de los sprints anteriores (rutas, controladores, servicios, modelos, validadores, middlewares).
- Que los artefactos del plan (research, data-model, contracts, quickstart) cubran los contratos de la API de reportes.
- Que los contratos respeten la convención de los contratos de los sprints anteriores.
- Que la estrategia de pruebas declarada sea coherente con la infraestructura existente.

**Checklist de verificación:**

- [ ] El plan no contradice ninguna restricción técnica heredada de `docs/sprint-4.md` §10.
- [ ] El contexto técnico mantiene `"type": "module"` en `backend/package.json`.
- [ ] El plan declara que el frontend no accede a MySQL y que el backend es el único con acceso.
- [ ] El plan define la estructura de rutas, controladores, servicios, modelos y validadores para el módulo de reportes.
- [ ] El plan contempla la auditoría de la generación y la exportación con usuario, módulo, fecha, resultado y descripción.
- [ ] El plan no crea tablas nuevas salvo justificación explícita de la migración `004_...`.
- [ ] Los contratos de la API de reportes están definidos y son consistentes entre sí.
- [ ] El plan define la estrategia de pruebas con la infraestructura existente (`node:test` + `supertest`).
- [ ] El plan identifica las dependencias nuevas y su justificación, si las hay.
- [ ] El plan reconoce el prerrequisito de verificar el Sprint 3 con base de datos real.

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| *H-PL-01* | *Ejemplo: el plan propone una dependencia de exportación sin justificar* | *Media* | *Abierto* | *Justificar en plan.md o descartar* |

*La fila anterior es un ejemplo de formato: eliminarla al llenar la tabla.*

**Decisión de la fase:** *Por definir (aprobado / aprobado con observaciones / rechazado)*

**Observaciones:** *Ejemplo: mención de las decisiones de diseño relevantes para la calidad.*

### 3.4 Fase `/speckit.tasks`

**Qué se revisa:**

- Que las tareas cubran todas las historias y que cada historia incluya sus tareas de pruebas antes de las de implementación.
- Que las rutas de los archivos mentioned en cada tarea existan en el árbol real del proyecto.
- Que exista una tarea explícita de ejecución de `npm test` al cerrar cada historia y una de suite completa.
- Que existan tareas de documentación y de actualización del reporte de pruebas.
- Que las dependencias entre tareas respeten el orden de las historias.

**Checklist de verificación:**

- [ ] Cada historia US-S4-01 a US-S4-07 tiene tareas de pruebas (contrato e integración) antes que las de implementación.
- [ ] Cada tarea indica la ruta exacta del archivo que crea o modifica.
- [ ] El modelo, el validador, el servicio, el controlador, las rutas y el frontend están contemplados por historia.
- [ ] Existe una tarea de pruebas de la suite completa del backend al cierre del sprint.
- [ ] Existe una tarea de validación de extremo a extremo con base de datos real (prerrequisito de `docs/sprint-4.md` §1).
- [ ] Existe una tarea de actualización de `docs/project-context.md` y `docs/reglas.md` con las reglas RN-25 a RN-34.
- [ ] Existe una tarea de actualización del reporte de pruebas del proyecto.
- [ ] Existe una tarea para el cierre y la verificación integral del MVP (US-S4-07).
- [ ] Las tareas paralelas `[P]` no comparten archivos.
- [ ] Cada criterio de aceptación de `docs/sprint-4.md` §7 tiene al menos una tarea o prueba asociada.

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| *H-TK-01* | *Ejemplo: falta la tarea de pruebas de exportación con acentos y caracteres especiales* | *Media* | *Abierto* | *Agregar la tarea a tasks.md* |

*La fila anterior es un ejemplo de formato: eliminarla al llenar la tabla.*

**Decisión de la fase:** *Por definir (aprobado / aprobado con observaciones / rechazado)*

**Observaciones:** *Ejemplo: nota sobre la cobertura de tareas por historia.*

### 3.5 Fase `/speckit.analyze`

**Qué se revisa:**

- Que el análisis de consistencia no reporte contradicciones entre `spec.md`, `plan.md` y `tasks.md`.
- Que los identificadores FR, SC y de tareas sean consistentes en los tres artefactos.
- Que no queden requisitos sin cobertura de pruebas.
- Que no queden tareas huérfanas sin requisito asociado.

**Checklist de verificación:**

- [ ] No hay contradicciones graves reportadas por `/speckit.analyze`.
- [ ] Cada FR de `spec.md` tiene al menos una historia y una tarea que lo implementa.
- [ ] Cada SC de `spec.md` tiene al menos una prueba que lo verifica.
- [ ] Cada tarea de `tasks.md` es trazable a un FR o a un SC.
- [ ] Los contratos de la API son consistentes con las tareas de modelos, servicios y rutas.
- [ ] Los casos límite de la especificación tienen tarea y prueba asignadas.
- [ ] No hay requisitos duplicados ni contradictorios entre historias.

**Hallazgos:**

| ID | Descripción | Severidad | Estado | Acción |
| -- | ----------- | --------- | ------ | ------ |
| *H-AN-01* | *Ejemplo: FR-0X aparece en dos historias con criterios de aceptación distintos* | *Alta* | *Abierto* | *Unificar en spec.md antes de implementar* |

*La fila anterior es un ejemplo de formato: eliminarla al llenar la tabla.*

**Decisión de la fase:** *Por definir (aprobado / aprobado con observaciones / rechazado)*

**Observaciones:** *Ejemplo: resumen del resultado del análisis de consistencia.*

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

*Requisito → historia → tarea → prueba. La columna de tareas se completa cuando
`specs/004-reportes-basicos/tasks.md` exista; la de pruebas, cuando se definan los archivos en
`backend/tests/`.*

| Requisito | Historia | Tarea | Prueba | Estado |
| --------- | -------- | ----- | ------ | ------ |
| | US-S4-01 Reporte de clientes | | | *Pendiente* |
| | US-S4-02 Reporte de membresías | | | *Pendiente* |
| | US-S4-03 Reporte de pagos y adeudos | | | *Pendiente* |
| | US-S4-04 Reporte de accesos | | | *Pendiente* |
| | US-S4-05 Exportación de reportes | | | *Pendiente* |
| | US-S4-06 Auditoría de reportes | | | *Pendiente* |
| | US-S4-07 Cierre y calidad del MVP | | | *Pendiente* |

**Cobertura de criterios de aceptación de `docs/sprint-4.md` §7:**

| Criterio (§7.1 a §7.5) | Requisito | Historia | Tarea | Prueba | Estado |
| ------------------------ | --------- | -------- | ----- | ------ | ------ |
| *Ejemplo: el administrador puede generar el reporte de clientes con totales por estado* | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |
| | | | | | *Pendiente* |

**Cobertura de reglas de negocio RN-25 a RN-34** *(numeración prevista en `docs/sprint-4.md` §6;
aún no incorporadas a `docs/project-context.md` §12)*:

| Regla | Descripción resumida | Historia | Tarea | Prueba | Estado |
| ----- | -------------------- | -------- | ----- | ------ | ------ |
| RN-25 | *Por definir* | | | | *Pendiente* |
| RN-26 | *Por definir* | | | | *Pendiente* |
| RN-27 | *Por definir* | | | | *Pendiente* |
| RN-28 | *Por definir* | | | | *Pendiente* |
| RN-29 | *Por definir* | | | | *Pendiente* |
| RN-30 | *Por definir* | | | | *Pendiente* |
| RN-31 | *Por definir* | | | | *Pendiente* |
| RN-32 | *Por definir* | | | | *Pendiente* |
| RN-33 | *Por definir* | | | | *Pendiente* |
| RN-34 | *Por definir* | | | | *Pendiente* |

**Verificación de cobertura:** *Ejemplo: «La matriz cubre 100 % de los FR y de los criterios de
aceptación de `docs/sprint-4.md` §7, sin requisitos huérfanos.»*

---

## 5. Análisis de riesgos y acciones de mitigación

*Escala de probabilidad e impacto: Alta / Media / Baja. El riesgo se acepta de forma
explícita cuando la mitigación no depende del equipo.*

| ID | Riesgo | Probabilidad | Impacto | Mitigación prevista | Responsable | Estado |
| -- | ------ | ------------ | ------- | ------------------- | ------------ | ------ |
| R-01 | El Sprint 3 no está verificado con base de datos real (prerrequisito de `docs/sprint-4.md` §1) | | | *Ejemplo: verificar la migración 003 y ejecutar la suite completa antes de iniciar* | | *Abierto* |
| R-02 | La constitución vigente fija tres sprints y el contexto maestro menciona dos | | | *Ejemplo: obtener la autorización del equipo o del profesor y actualizar `docs/reglas.md` y `docs/project-context.md`* | | *Abierto* |
| R-03 | El formato de exportación sigue sin definirse y condiciona la implementación | | | *Ejemplo: resolver en /speckit.clarify antes de /speckit.plan* | | *Abierto* |
| R-04 | Dependencia nueva de exportación sin justificar | | | *Ejemplo: justificar en plan.md o descartar y exportar con el stack actual* | | *Abierto* |
| R-05 | Los totales del reporte no coinciden con los datos reales | | | *Ejemplo: prueba de integración que compara totales contra la base de datos* | | *Abierto* |
| R-06 | La exportación no reproduce exactamente los filtros de la pantalla | | | *Ejemplo: prueba que compara el archivo exportado con la respuesta de la API* | | *Abierto* |
| R-07 | Se filtran datos sensibles o biométricos en las respuestas o archivos | | | *Ejemplo: prueba que verifica la ausencia de contraseñas, tokens y descriptores faciales* | | *Abierto* |
| R-08 | Los reportes permiten el acceso a roles no autorizados | | | *Ejemplo: pruebas de contrato con 403 para recepcionista, entrenador y cliente, y respuesta de autenticación requerida sin token* | | *Abierto* |
| R-09 | Las consultas de los reportes no están parametrizadas y permiten inyección SQL | | | *Ejemplo: revisión estática del código y prueba con entradas maliciosas* | | *Abierto* |
| R-10 | Reportes muy grandes agotan memoria o el tiempo de respuesta | | | *Ejemplo: paginación obligatoria y límite de filas exportadas definido* | | *Abierto* |
| R-11 | La auditoría de la generación y la exportación no registra todos los campos esperados | | | *Ejemplo: prueba de contrato que verifica usuario, módulo, fecha, resultado y descripción* | | *Abierto* |
| R-12 | La documentación de reglas RN-25 a RN-34 no se actualiza | | | *Ejemplo: tarea explícita en tasks.md y verificación en el cierre del sprint* | | *Abierto* |
| R-13 | El frontend queda inconsistente con el diseño de los sprints anteriores | | | *Ejemplo: revisión visual de la pantalla de reportes contra el patrón existente* | | *Abierto* |
| R-14 | La base de pruebas no refleja datos representativos para los reportes | | | *Ejemplo: ampliar la semilla con datos de varios periodos, estados y clientes con adeudos* | | *Abierto* |
| R-15 | *Por definir* | | | | | *Abierto* |

---

## 6. Estrategia de pruebas

### 6.1 Tipos de prueba

| Tipo | Alcance | Ubicación sugerida | Responsable | Estado |
| ---- | ------- | ------------------ | ------------ | ------ |
| Unitarias | *Ejemplo: validaciones de filtros y cálculos de adeudo* | `backend/tests/unitarias/` | | *Pendiente* |
| Contrato | *Ejemplo: códigos HTTP, forma de la respuesta y permisos de cada endpoint de reportes* | `backend/tests/contract/` | | *Pendiente* |
| Integración | *Ejemplo: totales del reporte contra los datos reales de la base de datos* | `backend/tests/integration/` | | *Pendiente* |
| Extremo a extremo | *Ejemplo: flujo del §4 de `docs/sprint-4.md` con la aplicación en ejecución* | *Por definir* | | *Pendiente* |
| Manuales / validación de interfaz | *Ejemplo: filtros, paginación, mensajes y consistencia visual* | *Por definir* | | *Pendiente* |
| Regresión | *Ejemplo: suite completa del backend y de los sprints anteriores* | `backend/` | | *Pendiente* |

### 6.2 Datos de prueba

| Aspecto | Definición |
| ------- | ---------- |
| Origen de los datos | *Ejemplo: base de pruebas `gym_test`, reconstruida por `backend/tests/ayuda/base-pruebas.js` a partir de `database/migrations/` y `database/seeds/`* |
| Semilla utilizada | *Ejemplo: `database/seeds/seed-administrador.sql`, `database/seeds/seed-datos-sprint2.sql` y `database/seeds/seed-datos-sprint3.sql`* |
| Cobertura de datos | *Ejemplo: clientes activos, inactivos y con adeudos; membresías activas, vencidas y próximas a vencer; pagos en varios periodos; accesos autorizados y rechazados* |
| Datos de vacío | *Ejemplo: periodos sin pagos ni accesos para validar el resultado vacío con mensaje claro* |
| Datos límite | *Ejemplo: periodos con fecha inicial posterior a la final; reportes con volumen alto de filas* |
| Datos sensibles | *Ejemplo: verificación de que ninguna respuesta ni archivo contiene contraseñas, tokens ni datos biométricos* |
| Aislamiento | *Ejemplo: la base de pruebas se recrea en cada ejecución; nunca se usa la base local de desarrollo* |

### 6.3 Entorno

| Aspecto | Definición |
| ------- | ---------- |
| Motores y versiones | *Ejemplo: Node.js 20 o superior, MySQL 8 local con InnoDB y `utf8mb4`* |
| Variables de entorno | *Ejemplo: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_NAME_TEST`, `JWT_SECRET`* |
| Comando de pruebas | *Ejemplo: `npm test` en `backend/` (`node --test` con `supertest`)* |
| Base de datos de pruebas | *Ejemplo: `gym_test`, creada y destruida por el helper de pruebas* |
| Dependencias | *Ejemplo: las mismas de los sprints anteriores, más las que se autoricen en /speckit.clarify* |
| Consideraciones de red | *Ejemplo: sin dependencias externas en línea durante las pruebas* |

### 6.4 Criterios de aceptación de las pruebas

- [ ] Cada historia US-S4-01 a US-S4-07 cuenta con al menos una prueba de contrato y una de integración.
- [ ] Existe prueba para el rechazo de cada rol no autorizado (recepcionista, entrenador, cliente) y para la petición sin token.
- [ ] Existe prueba del resultado vacío con mensaje claro cuando el filtro no tiene datos.
- [ ] Existe prueba del error de validación cuando la fecha inicial es posterior a la final.
- [ ] Existe prueba que compara los totales del reporte con los datos reales de la base de datos.
- [ ] Existe prueba que verifica la paginación del listado.
- [ ] Existe prueba que compara el archivo exportado con los datos y filtros mostrados en pantalla.
- [ ] Existe prueba que verifica la apertura correcta del archivo exportado con acentos y caracteres especiales.
- [ ] Existe prueba que verifica la ausencia de contraseñas, tokens y datos biométricos en respuestas y archivos.
- [ ] Existe prueba que verifica el registro de auditoría de la generación y de la exportación con usuario, módulo, fecha, resultado y descripción.
- [ ] Existe prueba que verifica que solo el administrador consulta los registros de auditoría.
- [ ] Existe prueba que verifica que los reportes no modifican datos de clientes, membresías, pagos ni accesos.
- [ ] Existe prueba de regresión que cubre los flujos de los sprints anteriores.
- [ ] La suite completa se ejecuta sin fallos, sin cancelaciones y sin omisiones.

*Ejemplo de cómo llenar un criterio: «Existe prueba del error de validación cuando la fecha
inicial es posterior a la final — cubierto en `backend/tests/contract/reportes.test.js` con
respuesta 400 y código `VALIDACION`.»*

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

- [ ] `spec.md` existe, está completo y no contiene marcadores `[NEEDS CLARIFICATION]` sin justificar.
- [ ] Las siete historias del sprint están definidas, priorizadas y con escenarios de aceptación.
- [ ] Las decisiones pendientes de `docs/sprint-4.md` §9 están resueltas.
- [ ] `plan.md` existe y respeta las restricciones técnicas heredadas y los principios de `docs/reglas.md`.
- [ ] `tasks.md` existe, cubre todas las historias y respeta el orden pruebas → implementación.
- [ ] `/speckit.analyze` no reporta contradicciones graves pendientes.
- [ ] La matriz de trazabilidad de la sección 4 está completa, sin requisitos huérfanos.
- [ ] Los objetivos de calidad de la sección 2.4 están asociados a pruebas identificables.
- [ ] El análisis de riesgos de la sección 5 no tiene riesgos de impacto alto sin mitigación asignada.
- [ ] Todas las fases de la sección 3 tienen decisión registrada y no queda ninguna en «rechazado».
- [ ] El prerrequisito del Sprint 3 está verificado con base de datos real.
- [ ] La autorización del Sprint 4 y el número real de sprints están confirmados por el equipo.

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
| ¿Se autoriza iniciar `/speckit.implement`? | *Sí / No / Con condiciones* |
| Condiciones o reservas | *Ejemplo: «Con condiciones: cerrar el hallazgo H-CL-01 sobre el formato de exportación.»* |
| Fecha del veredicto | *Ejemplo: 2026-11-08* |
| Responsable que autoriza | *Ejemplo: nombre y rol* |
| Firma del equipo | *Por definir* |

---

## 8. Conclusiones y recomendaciones

### 8.1 Conclusiones

*Ejemplo de cómo llenar esta sección: «Las siete historias del Sprint 4 están especificadas,
planificadas y desglosadas en tareas con cobertura de pruebas para cada criterio de
aceptación. Los hallazgos de mayor severidad se resolvieron en `/speckit.clarify` y no
quedan riesgos abiertos de impacto alto, por lo que se recomienda iniciar la
implementación.»*

### 8.2 Recomendaciones

| ID | Recomendación | Prioridad | Responsable | Fecha compromiso |
| -- | -------------- | --------- | ------------ | ----------------- |
| REC-01 | *Ejemplo: ejecutar la suite completa del backend en cada cierre de historia* | *Alta* | | |
| REC-02 | *Ejemplo: ampliar la semilla de pruebas con datos de varios periodos* | *Media* | | |
| REC-03 | *Ejemplo: registrar la validación manual de los escenarios de quickstart.md* | *Media* | | |
| REC-04 | *Por definir* | | | |

### 8.3 Evaluación de la calidad aplicada

| Dimensión | Evaluación | Comentario |
| --------- | ---------- | ----------- |
| Claridad de los requisitos | *Por definir* | |
| Trazabilidad requisito → historia → tarea → prueba | *Por definir* | |
| Cobertura de pruebas | *Por definir* | |
| Cumplimiento de los principios de `docs/reglas.md` | *Por definir* | |
| Consistencia con `docs/project-context.md` | *Por definir* | |
| Gestión de riesgos | *Por definir* | |
| Preparación para el cierre del MVP (US-S4-07) | *Por definir* | |

---

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
