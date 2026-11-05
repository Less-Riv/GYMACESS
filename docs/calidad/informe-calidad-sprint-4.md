# Informe de calidad aplicada: Sprint 4 - Reportes básicos

**Documento generado a partir de** `docs/calidad/sprint-4-calidad-nueva-funcionalidad.md`

---

## Portada

| Dato | Valor |
| ---- | ----- |
| **Título** | Informe de calidad aplicada a una nueva funcionalidad: Sprint 4 - Reportes básicos |
| **Proyecto** | Sistema de Gestión de Acceso y Control Financiero para Gimnasio con Reconocimiento Facial, según el contexto maestro `docs/project-context.md` al que remite la plantilla de calidad |
| **Funcionalidad evaluada** | Reportes básicos (US-G17 del MVP) |
| **Sprint** | 4 |
| **Fecha del informe** | 2026-11-04 |
| **Veredicto** | **Pendiente de una decisión del equipo.** De los doce criterios de entrada se cumplen nueve y fallan tres, y los tres fallan por la misma causa: la constitución fija tres sprints, este es el cuarto y la autorización del equipo está pendiente. |

**Integrantes**

La documentación de calidad no nombra a las personas del equipo, y ese dato no se ha supuesto en
ningún momento. Lo que sí consta es qué responsabilidades están pendientes de asignar:

| Ámbito pendiente de titular | Dónde consta |
| -------------------------- | ------------ |
| Responsable de calidad | Sección 1 de la plantilla, dato general |
| Equipo de desarrollo | Sección 1 de la plantilla, dato general |
| Pruebas de contrato, de integración, de extremo a extremo, validación manual de interfaz, revisión de la auditoría de reportes y actualización del reporte de pruebas | Sección 6.5 de la plantilla, con estado "Pendiente" en los seis ámbitos |
| Responsable de los dieciséis riesgos registrados | Sección 5 de la plantilla, con la columna de responsable en "Por definir" |
| Aprobación del cuarto sprint | Sección 7.3 de la plantilla, con el veredicto de autorización |

**Documentos que sustentan este informe**

| Documento | Contenido |
| --------- | --------- |
| `docs/calidad/sprint-4-calidad-nueva-funcionalidad.md` | Plantilla de calidad con el detalle de cada fase, la matriz de trazabilidad, los riesgos y la estrategia de pruebas |
| `docs/sprint-4.md` | Alcance, historias, reglas de negocio y criterios de aceptación del sprint |
| `docs/reglas.md` | Constitución del proyecto, principios I a XI |
| `docs/project-context.md` | Contexto maestro, reglas de negocio RN-01 a RN-14 y criterios de cierre del MVP |
| `specs/004-reportes-basicos/` | Especificación, plan, tareas, investigación, modelo de datos, contrato de la API y guía de validación |

---

## 1. Resumen ejecutivo

El Sprint 4 cierra el MVP del sistema de gestión de un gimnasio con los reportes básicos: cinco
consultas de solo lectura para el administrador (clientes, membresías, pagos, adeudos y accesos),
con filtros por periodo y por estado, listados paginados, totales verificables, exportación a
archivo PDF y registro de cada generación y cada exportación en la tabla de auditoría.

El trabajo de calidad se hizo por fases, siguiendo el orden en que se construyen los artefactos:
especificación, aclaraciones, plan, tareas y análisis de consistencia. Cada fase se cerró con una
decisión y un registro de los problemas detectados. **Las cinco fases se aprobaron con
observaciones**, ninguna fue rechazada y ninguna dejó trabajo sin hacer.

El resultado es un sprint bien documentado y listo para ejecutar: siete historias con sus
escenarios, 45 requisitos funcionales, 16 criterios de éxito, 10 reglas de negocio nuevas, un
contrato de API con diez endpoints, un modelo de datos con sus validaciones y 62 tareas repartidas
en diez fases. El único cambio de fondo que introduce es una librería de generación de PDF
licenciada como libre, justificada por escrito y sin conexión a Internet.

El punto débil no está en lo que falta por escribir, sino en lo que falta por comprobar. **Solo 24
de los 45 requisitos (53 %) y 15 de los 16 criterios de éxito (94 %) tienen una prueba automática
que los verifique.** Tres zonas quedan sin cobertura automática: toda la pantalla de reportes,
porque el proyecto no tiene pruebas de frontend; diecinueve requisitos de arquitectura, seguridad
y alcance, porque solo los cubre una revisión manual; y las tareas de documentación del cierre.
Además, dos criterios de éxito redactados con un porcentaje ("el 100 % de...") no se comprueban en
dos de los cuatro reportes de negocio, de modo que una suite en verde todavía no demuestra el
cien por cien que esos criterios exigen.

El hallazgo de mayor severidad no es técnico sino de gobierno del proyecto. **La constitución fija
que el desarrollo se realiza en tres sprints, y este es el cuarto.** La verificación de la
constitución declara los once principios cumplidos sin siquiera evaluar esa cláusula, y la
autorización del equipo para el cuarto sprint sigue pendiente. Ninguna cantidad de trabajo técnico
sustituye esa decisión.

En total se registraron **49 hallazgos**: 9 de severidad alta, 27 media y 13 baja. Siete quedaron
cerrados dentro de las propias fases (reglas de negocio y requisitos que se reescribieron,
declaraciones que se añadieron al plan y una prueba circular que se corrigió), uno está en curso y
41 siguen abiertos. El proceso también detectó seis defectos reales en los artefactos del propio
sprint y los corrigió sobre la marcha.

**La puerta de entrada sigue sin abrirse, pero por un solo motivo.** De los doce criterios de
entrada se cumplen nueve y fallan tres. Las dos condiciones que dependían del proyecto se
cerraron el 2026-11-04: la suite completa del backend se ejecutó con 233 pruebas, 0 fallos,
0 cancelaciones y 0 omitidas, y la sección de objetivos de calidad quedó llena con seis
objetivos asociados a sus pruebas. Los tres criterios que fallan dependen de una sola decisión
del equipo: enmendar la constitución y registrar la autorización del cuarto sprint. Cierre de
este informe, con doce recomendaciones, en el capítulo 7.

---

## 2. Contenido de cada fase y sus hallazgos

Cada fase del proceso se evaluó contra una lista de comprobación propia, con evidencia en cada
punto. La escala de severidad es: **Alta** (bloquea la implementación o contradice la
constitución), **Media** (degrada la calidad pero tiene alternativa) y **Baja** (mejora opcional).

### 2.1 Fase de especificación

**Qué se revisó:** que la especificación cubriera el alcance del sprint sin ampliarlo, que las
siete historias quedaran completas y verificables por separado, que los requisitos y los criterios
de éxito fueran medibles, que los casos límite estuvieran definidos y que se respetara la trazabilidad
exigida por el principio I.

**Resultado:** 9 de los 10 puntos aprobados. La especificación quedó con 678 líneas, 45
requisitos, 16 criterios de éxito, 10 reglas de negocio y 18 casos límite, sin marcadores
pendientes. El único punto sin aprobar fue el de los criterios de éxito medibles: el criterio
SC-001 exige generar cada reporte en menos de dos minutos y ningún requisito definía cómo se mide
esa condición.

**Hallazgos (11):** dos de severidad alta, siete media y dos baja. Los dos altos se resolverían en
la fase de aclaraciones: no se concretaba sobre qué membresía se calcula el adeudo de un cliente
con varias membresías, y no quedaba claro si el reporte de clientes admitía filtro por periodo.
Los otros nueve abordan la falta de un criterio comprobable para el mensaje de resultado vacío, dos
requisitos duplicados, la definición de una fecha de corte no explicada, el recuento de tipos de
reporte, el registro de la autorización del sprint, el tratamiento de fechas iguales o inválidas y
el método de medición del criterio SC-001.

**Decisión:** Aprobado con observaciones.

### 2.2 Fase de aclaraciones

**Qué se revisó:** que las decisiones pendientes del sprint estuvieran resueltas o aplazadas con
responsable, que el formato de exportación quedara definido, que ninguna decisión contradijera la
constitución y que todo quedara escrito en la especificación y no solo en la conversación.

**Resultado:** 7 de los 12 puntos aprobados. Se formularon cinco preguntas, todas respondidas por
el equipo, y las respuestas quedaron incorporadas a la especificación. El número de hallazgos
abiertos bajó de once a seis.

**Decisiones tomadas:**

| # | Pregunta | Respuesta |
| - | -------- | --------- |
| 1 | ¿Sobre qué membresía se calcula el adeudo de cada cliente? | Sobre su última membresía registrada, aunque esté vencida o cancelada, mostrando su estado y descontando solo los pagos completados |
| 1b | ¿Coincide con la pantalla de adeudos que ya existía? | No. El reporte aplica su propia regla, la pantalla anterior no se modifica y la diferencia queda documentada |
| 2 | ¿El reporte de clientes admite filtro por periodo? | Sí, aplicado sobre la fecha de registro del cliente |
| 3 | ¿Los grupos de membresías son excluyentes y dónde quedan las suspendidas y canceladas? | Cuatro grupos disjuntos, con las suspendidas y canceladas en grupo propio, y la ventana de siete días evaluada contra la fecha de hoy |
| 4 | ¿Qué reportes filtran por estado y con qué valores? | Cada reporte con el estado de su propio dato y los valores del esquema; los pagos y adeudos solo por periodo; un valor no previsto se rechaza |
| 5 | ¿Qué pagos cuentan como ingreso y el adeudo descuenta el mismo conjunto? | Solo los completados, tanto en ingresos como en adeudo |

**Hallazgos (6):** uno de severidad alta y cinco media o baja. Dos quedaron cerrados en la propia
fase: la regla RN-29 seguía afirmando que la exportación reproduce exactamente los datos en
pantalla, lo que contradecía la decisión de limitarla, y el recuento de tipos de reporte no era
unívoco. Dos quedaron resueltos en la fase de plan (el contenido del registro de auditoría y la
zona horaria, el formato de fecha y los subtotales). Uno sigue en curso: el tamaño de página y el
límite de exportación están enunciados como supuestos y no como requisitos. Uno sigue abierto: la
redacción de RN-27 y RN-31 se apartó de su documento de origen y hay que actualizarlo.

**Decisión:** Aprobado con observaciones.

### 2.3 Fase de plan

**Qué se revisó:** que el plan respetara la arquitectura de los sprints anteriores y los principios
II, III, IV y V, que el contexto técnico declarara el lenguaje, la base de datos y el uso de
variables de entorno, que la estructura de módulos siguiera el modelo previo, que los contratos
cubrieran la API y que la estrategia de pruebas fuera coherente con la infraestructura existente.

**Resultado:** 10 de los 10 puntos aprobados, tras corregir dos omisiones detectadas en la propia
revisión. El plan califica los once principios de la constitución como cumplidos y vuelve a
evaluar esa verificación después del diseño.

**Correcciones aplicadas al plan:** se añadió la declaración de que el frontend nunca accede a
MySQL y que el backend es el único con acceso, que faltaba en las restricciones; y se añadió el
prerrequisito de verificar el Sprint 3 con base de datos real.

**Dependencia nueva:** una sola, `pdfkit`, con licencia libre, sin archivos binarios y sin
conexión a la red. La justificación, las dependencias que arrastra y las alternativas descartadas
quedan escritas en el archivo de investigación.

**Hallazgos (4):** dos de severidad media, ya cerrados por las correcciones anteriores; y dos
bajas que siguen abiertos: el contenido del archivo PDF no puede comprobarse de forma automática
porque el proyecto no incorpora un lector de PDF, y el encabezado del plan declara una rama que no
es la rama de trabajo real.

**Decisión:** Aprobado con observaciones.

### 2.4 Fase de tareas

**Qué se revisó:** que las tareas cubrieran todas las historias con sus pruebas antes que su
implementación, que cada una indicara la ruta exacta del archivo, que no faltara ninguna pieza del
módulo, que existieran las tareas de cierre y documentación, y que las tareas marcadas como
paralelas no compartieran archivos.

**Resultado:** 11 de los 11 puntos aprobados. Las 62 tareas siguen la secuencia pruebas → modelo →
servicio → endpoint → pantalla → ejecución de la suite, y cada historia queda como un incremento
verificable por separado. Se comprobó con script que ninguna de las 28 tareas marcadas como
paralelas comparte archivo con otra de su misma fase.

**Corrección aplicada a las tareas:** una prueba de cierre del MVP pedía certificar, desde dentro
de la propia suite, que la suite completa se ejecutaba sin fallos. Eso es imposible, porque una
prueba no puede certificar el resultado de la suite que la contiene. Se reescribió para que
verifique solo lo comprobable desde dentro, y la comprobación de la suite completa quedó en la
tarea que ejecuta las pruebas.

**Hallazgos (6):** uno de severidad media, cerrado por la corrección anterior, y cinco que siguen
abiertos. El más importante es de severidad alta: **las nueve tareas de la pantalla de reportes no
tienen ninguna prueba automática**, porque el proyecto no tiene infraestructura de pruebas de
frontend. Los demás señalan que 21 de los 45 requisitos no tienen prueba automática, que la
actualización de un documento de origen no tiene comprobación asociada, que la verificación del
prerrequisito y la actualización del reporte de pruebas tampoco, y que el contenido del PDF solo
puede revisarse a mano.

**Decisión:** Aprobado con observaciones.

### 2.5 Fase de análisis de consistencia

**Qué se revisó:** que no hubiera contradicciones entre la especificación, el plan y las tareas,
que los identificadores fueran coherentes entre los tres documentos, que no quedaran requisitos sin
cobertura y que no quedaran tareas sin requisito asociado.

**Resultado:** 1 de los 7 puntos aprobados. El análisis detectó **22 hallazgos**, cinco de ellos de
severidad alta, y el resto de severidad media o baja. No se modificó ningún archivo: esta fase es
de solo lectura, y cerrar los hallazgos exige ediciones posteriores que requieren aprobación del
equipo.

**Los cinco hallazgos de severidad alta:**

| # | Hallazgo | Acción propuesta |
| - | -------- | ---------------- |
| 1 | La constitución fija que el desarrollo se realiza en tres sprints y este es el cuarto. La verificación del plan lo declara cumplido sin evaluar esa cláusula, y la autorización del equipo está pendiente. | Enmendar la constitución de forma explícita y separada, fuera del análisis, y registrar la autorización con su fecha |
| 2 | Seis tareas marcadas como paralelas escriben todas en el mismo archivo de pruebas de contrato, en fases distintas. La estrategia de equipo en paralelo que propone el propio plan hace que tres personas editen ese archivo a la vez. | Dividir el archivo por reporte o retirar la marca de paralelismo y ejecutarlas en serie |
| 3 | Un criterio de éxito exige que el cien por cien de los listados tenga paginación, pero solo se verifica en dos de los cuatro reportes de negocio. | Añadir la comprobación a las dos tareas de integración que faltan |
| 4 | El contrato expone el nombre del cliente con dos nombres distintos: uno en el reporte de clientes y otro en los otros cuatro, y ninguno coincide con las columnas que declaran las tareas. | Unificar el nombre del campo en los cinco reportes y alinear la lista de columnas de las cuatro tareas |
| 5 | El caso de resultado vacío solo se comprueba en dos de los cuatro reportes de negocio, pese a que el requisito y el criterio de éxito lo exigen para todos. | Añadir a las dos tareas de integración que faltan el escenario de un filtro sin coincidencias |

Los diecisiete hallazgos restantes son de severidad media o baja: un criterio comprobable para el
mensaje de resultado vacío, el patrón de comparación de la consistencia visual, dos pares de
requisitos duplicados, ocho archivos de prueba que ninguna tarea declara crear, doce rutas que no
se resuelven desde la raíz del repositorio, el límite de exportación que el contrato no enuncia,
un criterio de éxito sin comprobación, la rama declarada frente a la real, la divergencia con el
documento de origen, una tarea sin requisito citado, el método de medición de un criterio de
tiempo, una cita que falta, una errata, el tamaño de página enunciado solo en un ejemplo y dos
requisitos que comparten documento.

**Decisión:** Aprobado con observaciones, **con un hallazgo crítico (H-AN-01) que bloquea el inicio
de la implementación** hasta que se enmiende la constitución y se registre la autorización del
equipo.

### 2.6 Resumen de las cinco fases

| Fase | Comprobaciones | Hallazgos de la fase | Decisión |
| ---- | -------------- | --------------------- | -------- |
| Especificación | 9 de 10 | 11 | Aprobado con observaciones |
| Aclaraciones | 7 de 12 | 6 | Aprobado con observaciones |
| Plan | 10 de 10 | 4 | Aprobado con observaciones |
| Tareas | 11 de 11 | 6 | Aprobado con observaciones |
| Análisis de consistencia | 1 de 7 | 22 | Aprobado con observaciones, con hallazgo crítico |

**Totales: 49 hallazgos (9 alta, 27 media, 13 baja); 7 cerrados, 1 en curso y 41 abiertos.**

Los hallazgos se corrigieron a medida que aparecieron, y el estado que aquí se recoge es el
consolidado de todas las fases: los cerrados y el que está en curso constan en la fase que los
resolvió, aunque la tabla de la fase de especificación conserve el estado que tenía en ese
momento.

---

## 3. Matriz de trazabilidad

### 3.1 Requisitos funcionales

| Requisito | Historia | Tarea | Prueba | Estado |
| --------- | -------- | ----- | ------ | ------ |
| FR-001 Solo el administrador accede a los reportes | US-S4-01 a US-S4-06 | T009, T011 | Contrato (T012, T019, T026, T033, T040, T046) | Verificado |
| FR-002 Petición sin token: autenticación requerida | US-S4-01 a US-S4-06 | T009 | Contrato (T012, T019, T026, T033, T040) | Verificado |
| FR-003 Reportes de solo lectura | US-S4-03, US-S4-04 | T006, T014, T021, T028, T035 | Integración (T027, T034) | Verificado |
| FR-004 Sin datos sensibles en las respuestas | Transversal | T059 | Sin prueba automática; revisión manual | Sin prueba automática |
| FR-005 Pagos y accesos no se modifican ni se eliminan | US-S4-03, US-S4-04 | T028, T035 | Integración (T027, T034) | Verificado |
| FR-006 Reporte de clientes con totales por estado | US-S4-01 | T014, T015, T016, T017 | Contrato e integración (T012, T013) | Verificado |
| FR-007 Reporte de membresías en cuatro grupos disjuntos | US-S4-02 | T021, T022, T023, T024 | Contrato e integración (T019, T020) | Verificado |
| FR-008 Reporte de pagos e ingresos por periodo | US-S4-03 | T028, T029, T030, T031 | Contrato e integración (T026, T027) | Verificado |
| FR-009 Reporte de adeudos pendientes por cliente | US-S4-03 | T028, T029, T030, T031 | Contrato e integración (T026, T027) | Verificado |
| FR-010 Reporte de accesos autorizados y rechazados | US-S4-04 | T035, T036, T037, T038 | Contrato e integración (T033, T034) | Verificado |
| FR-011 Adeudo sobre la última membresía registrada | US-S4-03 | T029 | Integración (T027) | Verificado |
| FR-012 Filtro por periodo | US-S4-01 a US-S4-04 | T005 | Contrato (T012, T019, T026, T033) | Verificado |
| FR-013 Filtro por estado con valores del esquema | US-S4-01, US-S4-02, US-S4-04 | T005, T010 | Contrato (T012, T019, T033) | Verificado |
| FR-014 Listados paginados | US-S4-01 a US-S4-04 | T006, T007 | Integración (T013, T020, T027, T034) | Verificado |
| FR-015 Resultado vacío con mensaje claro | US-S4-01 a US-S4-04 | T010 | Integración (T013, T020, T027, T034) | Verificado |
| FR-016 Error de validación si la fecha inicial es posterior a la final | US-S4-01 a US-S4-05 | T005 | Contrato (T012, T019, T026, T033, T040) | Verificado |
| FR-017 Totales sobre el conjunto filtrado completo | US-S4-01 a US-S4-04 | T007 | Integración (T013, T020, T027, T034) | Verificado |
| FR-018 Exportar cada reporte a un archivo | US-S4-05 | T042, T043 | Contrato (T040) | Verificado |
| FR-019 La exportación reproduce los filtros de la pantalla | US-S4-05 | T043, T044 | Integración parcial (T041) y revisión manual §4.6 | Verificado parcialmente |
| FR-020 El archivo no incluye datos sensibles | US-S4-05 | T042 | Integración (T041) | Verificado |
| FR-021 El archivo conserva acentos y caracteres especiales | US-S4-05 | T042 | Contrato parcial (T040) y revisión manual §4.6 | Verificado parcialmente |
| FR-022 El formato de exportación es PDF | US-S4-05 | T001, T042 | Contrato (T040) | Verificado |
| FR-023 La generación queda registrada en la auditoría | US-S4-06 | T007, T008, T048 | Integración (T047) | Verificado |
| FR-024 La exportación queda registrada en la auditoría | US-S4-06 | T044, T048 | Integración (T047) | Verificado |
| FR-025 Solo el administrador consulta la auditoría | US-S4-06 | T046, T048, T049 | Contrato (T046) | Verificado |
| FR-026 Prerrequisito: Sprint 3 verificado con base real | US-S4-07 | T052 | Comprobación manual de la migración | Sin prueba automática |
| FR-027 La suite completa se ejecuta sin fallos ni omisiones | US-S4-07 | T060 | Ejecución de `npm test` | Verificado |
| FR-028 Los defectos del Sprint 3 se corrigen o se documentan | US-S4-07 | T053 | Condicional; sin prueba automática | Sin prueba automática |
| FR-029 Validación de punta a punta de los cuatro sprints | US-S4-07 | T056 | Guía de validación, con registro | Verificado a mano |
| FR-030 Las reglas de los sprints 3 y 4 llegan a la documentación | US-S4-07 | T054, T055, T061 | Integración (T051, solo una parte) | Verificado parcialmente |
| FR-031 La documentación refleja el número real de sprints | US-S4-07 | T054, T061 | Revisión de T061 | Sin prueba automática |
| FR-032 Consistencia de diseño y navegación del frontend | US-S4-01 a US-S4-06 | T011, T017, T024, T031, T038, T044, T049, T058, T062 | Sin prueba automática; revisión visual | Sin prueba automática |
| FR-033 El reporte de pruebas queda actualizado | US-S4-07 | T057 | Sin prueba automática; evidencia indirecta | Sin prueba automática |
| FR-034 Comunicación por API REST | Transversal | T004 | Sin prueba automática; revisión | Sin prueba automática |
| FR-035 El frontend no accede a MySQL | Transversal | T059 | Sin prueba automática; revisión estática | Sin prueba automática |
| FR-036 Los permisos se validan en el backend | Transversal | T009 | Contrato (T012, T019, T026, T033, T040, T046) | Verificado |
| FR-037 Se mantienen JWT y bcrypt | Transversal | T059 | Sin prueba automática; revisión | Sin prueba automática |
| FR-038 El backend continúa con ES Modules | Transversal | T059 | Sin prueba automática; revisión estática | Sin prueba automática |
| FR-039 Las consultas están parametrizadas | Transversal | T005, T006, T059 | Sin prueba automática específica | Sin prueba automática |
| FR-040 Datos sensibles por variables de entorno y sin biométricos | Transversal | T059 | Parcial en integración (T041) | Verificado parcialmente |
| FR-041 Separación modular del backend | Transversal | T059 | Sin prueba automática; revisión | Sin prueba automática |
| FR-042 Nada fuera del alcance del MVP | Transversal | T059 | Sin prueba automática; revisión | Sin prueba automática |
| FR-043 No se reimplementa lo de los sprints anteriores | Transversal | T059 | Sin prueba automática; revisión | Sin prueba automática |
| FR-044 No se crean tablas ni migración nuevas | Transversal | T059 | Sin prueba automática; revisión | Sin prueba automática |
| FR-045 Toda dependencia nueva está justificada | Transversal | T001 | Sin prueba automática; revisión de dependencias | Sin prueba automática |

### 3.2 Cobertura de los criterios de aceptación del sprint

Los 39 criterios de aceptación de `docs/sprint-4.md` §7 tienen requisito y tarea asignados:

| Apartado | Criterios | Con prueba automática | Con verificación parcial | Solo verificación manual |
| -------- | --------- | --------------------- | ----------------------- | ------------------------ |
| §7.1 Reportes | 10 | 10 | 0 | 0 |
| §7.2 Exportación | 4 | 2 | 2 | 0 |
| §7.3 Permisos y auditoría | 5 | 5 | 0 | 0 |
| §7.4 Cierre y calidad del MVP | 8 | 2 | 0 | 6 |
| §7.5 Arquitectura y seguridad | 12 | 1 | 1 | 10 |
| **Total** | **39** | **20** | **3** | **16** |

### 3.3 Reglas de negocio RN-25 a RN-34

| Regla | Contenido | Historia | Tarea | Prueba | Estado |
| ----- | --------- | -------- | ----- | ------ | ------ |
| RN-25 | Solo el administrador accede a los reportes | US-S4-01 a US-S4-06 | T009 | T012, T019, T026, T033, T040, T046 | Verificado |
| RN-26 | Los reportes son de solo lectura | US-S4-03, US-S4-04 | T006, T014, T021, T028, T035 | T027, T034 | Verificado |
| RN-27 | Filtro por periodo en los cuatro reportes | US-S4-01 a US-S4-04 | T005 | T012, T019, T026, T033 | Verificado |
| RN-28 | Los listados van paginados | US-S4-01 a US-S4-04 | T006, T007 | T013, T020, T027, T034 | Verificado |
| RN-29 | La exportación refleja los datos y filtros de la pantalla | US-S4-05 | T043, T044 | T041 parcial, revisión manual §4.6 | Verificado parcialmente |
| RN-30 | Sin contraseñas, tokens ni datos biométricos | US-S4-05 | T042 | T041 | Verificado |
| RN-31 | Adeudo sobre la última membresía registrada menos los pagos completados | US-S4-03 | T029 | T027 | Verificado |
| RN-32 | Pagos y accesos son historial y no se modifican | US-S4-03, US-S4-04 | T028, T035 | T027, T034 | Verificado |
| RN-33 | Sin datos, resultado vacío con mensaje claro | US-S4-01 a US-S4-04 | T010 | T013, T020, T027, T034 | Verificado |
| RN-34 | La generación y la exportación quedan en la auditoría | US-S4-06 | T007, T008, T044, T048 | T047 | Verificado |

Las diez reglas están pendientes de incorporarse a la sección 12 de `docs/project-context.md`, que
corresponde a la tarea T054.

### 3.4 Tareas importantes que no tienen prueba automática asociada

| Tarea | Qué produce | Por qué no hay prueba | Verificación alternativa | Riesgo |
| ----- | ----------- | ---------------------- | ------------------------- | ------ |
| T004 | Consumos de reportes en `frontend/src/services/api.js` | El proyecto no tiene pruebas de frontend | Revisión manual de la pantalla | Medio |
| T010 | `FiltroReporte.jsx` y `TablaReporte.jsx` | Igual | Igual | Medio |
| T011 | `Reportes.jsx` y su ruta protegida | Igual | Igual | Alto |
| T017, T024, T031, T038 | Las cuatro pestañas de la pantalla | Igual | Igual | Medio |
| T049 | Sección de auditoría en la pantalla | Igual | Igual | Bajo |
| T044 (pantalla) | Botón de exportar y aviso de truncamiento | Igual | Igual | Medio |
| T052 | Verificación del prerrequisito FR-026 | Es una comprobación del estado de la base de datos | Revisión manual | Alto |
| T053 | Corrección o documentación de defectos | Condicional | Revisión de T059 | Bajo |
| T055 | Actualización de `docs/sprint-4.md` §6 | Es un cambio documental | Revisión de T061 | Medio |
| T057 | Actualización del reporte de pruebas | Es un cambio documental | La ejecución de `npm test` de T060 | Bajo |
| T058, T062 | Revisión visual de la interfaz | Es una revisión manual | Revisión de la pantalla | Medio |
| T059 | Revisión transversal de 19 requisitos | Es una revisión, no una prueba | Registro del resultado | Alto |
| T001 | Incorporación de la librería de PDF | `npm ls pdfkit` no es una prueba | Revisión de dependencias | Bajo |
| T003 | Carga de la semilla en el helper | Se comprueba de forma indirecta | Las pruebas de integración | Bajo |
| T042 (parcial) | Contenido del archivo PDF | El proyecto no tiene un lector de PDF | Revisión manual §4.6 | Medio |

---

## 4. Riesgos

Se registraron dieciséis riesgos, todos con probabilidad, impacto y mitigación prevista. Los nueve
de impacto alto tienen la mitigación asignada. **La columna de responsable está pendiente en los
dieciséis**, porque el equipo no ha nombrado a las personas que los cubrirán.

| # | Riesgo | Prob. | Impacto | Mitigación | Estado |
| - | ------ | ----- | ------- | ---------- | ------ |
| R-01 | El Sprint 3 no está verificado con base de datos real | Media | Alta | La migración 003 está aplicada y la suite del Sprint 3 se ejecutó en verde; el plan lo exige y la guía de validación lo recoge | Abierto |
| R-02 | La constitución fija tres sprints y el contexto maestro dos, de modo que el cuarto requiere autorización | Alta | Alta | La documentación debe reflejar el número real de sprints | Abierto |
| R-03 | El formato de exportación sin definir | Baja | Media | Resuelto: se fijó el formato PDF con su justificación | Cerrado |
| R-04 | Dependencia nueva sin justificar | Baja | Alta | Resuelto: la librería de PDF está justificada con licencia, sin binarios ni red | Cerrado |
| R-05 | Los totales no coinciden con los datos reales | Media | Alta | Los totales se calculan sobre el conjunto filtrado completo y la prueba de integración los contrasta con la base de datos | Abierto |
| R-06 | La exportación no reproduce los filtros de la pantalla | Media | Alta | La exportación devuelve el conjunto filtrado completo, ignora la página y expone cabeceras de control con el total de filas | Abierto |
| R-07 | Se filtran datos sensibles o biométricos | Baja | Alta | Los requisitos lo prohíben y el detalle de los reportes no incluye datos biométricos | Abierto |
| R-08 | Los reportes permiten el acceso a roles no autorizados | Baja | Alta | Los permisos se validan en el servidor y la matriz de permisos del contrato cubre los tres roles y la petición sin token | Abierto |
| R-09 | Consultas no parametrizadas | Baja | Alta | El requisito lo exige y toda consulta del proyecto usa parámetros | Abierto |
| R-10 | Reportes muy grandes agotan memoria o tiempo | Media | Media | Paginación de 20 registros y límite de exportación con aviso | Abierto |
| R-11 | La auditoría no registra todos los campos esperados | Baja | Media | Resuelto en el plan: cinco campos, formato de descripción y casos límite resueltos | Cerrado |
| R-12 | Las reglas RN-15 a RN-34 y el número de sprints no se actualizan | Alta | Media | Los requisitos y la guía de validación lo exigen; depende de la aprobación del equipo | Abierto |
| R-13 | La pantalla queda inconsistente con los sprints anteriores | Media | Baja | La pantalla reutiliza los estilos y los componentes existentes | Abierto |
| R-14 | La base de pruebas no tiene datos representativos | Media | Alta | El plan declara una semilla propia con datos en varios periodos y estados | Abierto |
| R-15 | El PDF no puede representar caracteres fuera del conjunto admitido | Baja | Media | La exportación responde con un error de validación en lugar de generar un archivo corrupto | Abierto |
| R-16 | La rama declarada en el plan no es la rama de trabajo | Media | Media | Fijar la rama antes de implementar y alinear el encabezado del plan | Abierto |

---

## 5. Estrategia de pruebas

### 5.1 Tipos de prueba

| Tipo | Alcance | Dónde | Estado |
| ---- | ------- | ----- | ------ |
| Unitarias | **No se contemplan.** El proyecto no tiene esa infraestructura y el plan no la introduce | — | No aplica |
| Contrato | Códigos de respuesta, forma de la respuesta, matriz de permisos y validaciones de los diez endpoints | `backend/tests/contract/reportes.test.js` | Planificado |
| Integración | Totales frente a los datos reales, clasificación de membresías, cálculo de adeudos, paginación, auditoría y truncamiento, un archivo por historia | `backend/tests/integration/` | Planificado |
| Extremo a extremo | Los once escenarios de la guía de validación: generación de los cinco reportes, exportación, auditoría, permisos, validaciones, resultado vacío e interfaz | `specs/004-reportes-basicos/quickstart.md` | Planificado |
| Manuales | Recorrido de las cuatro pestañas y, además, la comprobación del contenido real del archivo PDF, que no puede automatizarse | Guía de validación §4.6 y §4.11 | Planificado |
| Regresión | Suite completa del backend, que incluye los 41 archivos de prueba de los sprints anteriores | `backend/` con `npm test` | Planificado |

### 5.2 Datos de prueba

| Aspecto | Definición |
| ------- | ---------- |
| Origen | Base de pruebas `gym_test`, destruida y recreada en cada ejecución por el helper existente, bajo un bloqueo en disco que serializa los procesos de prueba |
| Semilla | Las tres semillas de los sprints anteriores más la nueva semilla del Sprint 4, que el helper deberá cargar |
| Cobertura | Clientes activos e inactivos con distintas fechas de registro; membresías en los cuatro estados, incluidas las que vencen dentro de los siete días; pagos completados en varios periodos; clientes con pagos parciales y sin pagos; accesos autorizados y rechazados con su motivo; y al menos un cliente con varias membresías |
| Datos de vacío | Periodos sin pagos ni accesos, para validar el resultado vacío con mensaje claro y totales en cero |
| Datos límite | Fecha inicial posterior a la final; estado fuera del listado; periodo de un solo día; caracteres no representables en el PDF; y conjunto filtrado que supera el límite de exportación |
| Datos sensibles | Comprobación de que ninguna respuesta ni archivo contiene contraseñas, tokens ni datos biométricos |
| Aislamiento | La base de pruebas se recrea en cada ejecución y nunca se usa la base local de desarrollo |

### 5.3 Entorno

| Aspecto | Definición |
| ------- | ---------- |
| Motores | Node.js 20 o superior, MySQL local con InnoDB y `utf8mb4`, React 18.3 y Vite 5.4 para la pantalla |
| Variables de entorno | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_NAME_TEST`, `JWT_SECRET`, `JWT_EXPIRACION`, `PORT` y `NODE_ENV`; el archivo `.env` está excluido del repositorio y el archivo de ejemplo no contiene secretos |
| Comando de pruebas | `npm test` en `backend/`, que ejecuta las pruebas de contrato y de integración en serie, con un límite de 30 segundos por prueba. Los archivos nuevos deben ir en esas dos carpetas con sufijo `.test.js` para que el comando los recoja |
| Base de datos de pruebas | `gym_test`, creada y destruida por el helper; el sprint no necesita migración nueva |
| Dependencias | Las de los sprints anteriores más la librería de PDF, única incorporación del sprint |
| Red | Ninguna: la generación del archivo es local y no accede a servicios externos |

### 5.4 Criterios de aceptación de las pruebas

Los catorce criterios que la suite debe demostrar:

1. Cada historia US-S4-01 a US-S4-07 cuenta con una prueba de contrato y una de integración.
2. Existe prueba del rechazo de cada rol no autorizado y de la petición sin token.
3. Existe prueba del resultado vacío cuando el filtro no tiene datos.
4. Existe prueba del error de validación cuando la fecha inicial es posterior a la final.
5. Existe prueba que compara los totales con los datos reales de la base de datos.
6. Existe prueba que verifica la paginación del listado.
7. Existe prueba que compara el archivo exportado con los datos y filtros mostrados en pantalla.
8. Existe prueba que verifica la apertura correcta del archivo con acentos y caracteres especiales.
9. Existe prueba que verifica la ausencia de contraseñas, tokens y datos biométricos.
10. Existe prueba que verifica el registro de auditoría de la generación y de la exportación.
11. Existe prueba que verifica que solo el administrador consulta los registros de auditoría.
12. Existe prueba que verifica que los reportes no modifican datos.
13. Existe prueba de regresión de los flujos de los sprints anteriores.
14. La suite completa se ejecuta sin fallos, sin cancelaciones y sin omisiones.

Los catorce están definidos y localizados, pero **ninguno está marcado todavía**: las pruebas se
escriben en la fase de tareas y se verifican al ejecutarlas.

### 5.5 Responsables de las pruebas

Los seis ámbitos (pruebas de contrato, de integración, de extremo a extremo, validación manual de
interfaz, revisión de la auditoría de reportes y actualización del reporte de pruebas) están
**pendientes de asignar**, igual que los responsables de los dieciséis riesgos.

---

## 6. Conclusiones

El Sprint 4 queda especificado, planificado y desglosado con un nivel de detalle que permite
implementarlo sin decisiones pendientes: siete historias con sus escenarios de aceptación, 45
requisitos funcionales, 16 criterios de éxito, 10 reglas de negocio nuevas, un contrato de API con
10 endpoints, un modelo de datos con sus reglas de validación y 62 tareas repartidas en diez fases.
La completitud nominal es del 100 %: ningún requisito carece de tarea y ninguna tarea carece de
historia.

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

Sobre la automatización del archivo exportado hay que ser explícito: el proyecto no incorpora un
lector de PDF, así que el contenido del archivo (las filas y los acentos) solo puede verificarse de
forma manual en la guía de validación. La parte automatizable, el código de respuesta, las
cabeceras de control y el truncamiento, sí queda cubierta.

El hallazgo de mayor severidad no es técnico sino de gobernanza del proyecto. La constitución, en su
principio I marcado como no negociable, establece que el desarrollo se realiza en tres sprints, y
el Sprint 4 es un cuarto. La verificación de la constitución del plan declara los once principios
cumplidos sin evaluar esa cláusula, y la autorización del equipo sigue pendiente. Ninguna
cantidad de trabajo técnico sustituye esa decisión: es la primera condición para empezar.

El proceso de calidad funcionó y dejó rastro. En el camino se detectaron y corrigieron seis defectos
reales en los propios artefactos: la regla RN-29 y el recuento de tipos de reporte en la
especificación, la declaración de que el frontend no accede a MySQL y el prerrequisito de
verificar el Sprint 3 en el plan, la coherencia entre totales y página visible en la
especificación, y la circularidad de la prueba de cierre del MVP en las tareas. Todos están
corregidos y documentados en el detalle por fases.

El veredicto de la puerta de entrada sigue siendo negativo, aunque por menos motivos: nueve
de los doce criterios de entrada se cumplen y tres fallan, y los tres fallan por la misma causa,
la constitución que fija tres sprints para un proyecto que ya va por el cuarto. Las dos condiciones
que dependían del proyecto quedaron cerradas el 2026-11-04. El trabajo de especificación,
planificación y desglose puede darse por cerrado; la puerta a la implementación sigue sin
abrirse.

### Evaluación por dimensión

| Dimensión | Evaluación | Comentario |
| --------- | ---------- | ----------- |
| Claridad de los requisitos | Parcial | 45 requisitos redactados con DEBE y NO DEBE, 16 criterios medibles y 18 casos límite definidos. Restan tres ambigüedades abiertas y dos pares de requisitos duplicados |
| Trazabilidad requisito → historia → tarea → prueba | Completa en lo nominal | Los 45 requisitos, los 16 criterios y las 10 reglas están enlazados, sin requisitos huérfanos. Queda una tarea huérfana y 21 requisitos sin prueba automática |
| Cobertura de pruebas | Insuficiente en lo efectivo | 53 % de los requisitos y 94 % de los criterios con prueba automática. La pantalla no tiene ninguna y dos criterios con porcentaje no se comprueban en dos reportes |
| Cumplimiento de los principios de la constitución | No conforme | Diez de los once principios cuentan con evidencia. El principio I requiere enmienda y autorización del equipo |
| Consistencia con el contexto maestro | Parcial | Las reglas nuevas están redactadas pero todavía no incorporadas a la sección 12, y dos de ellas divergen de su documento de origen |
| Gestión de riesgos | Adecuada | 16 riesgos con probabilidad, impacto y mitigación; los nueve de impacto alto la tienen asignada y tres ya están cerrados |
| Preparación para el cierre del MVP | Incompleta | Las tareas de cierre están planificadas, pero la verificación formal del prerrequisito es en realidad un criterio de entrada y el cierre documental depende de la aprobación del equipo |

---

## 7. Recomendaciones

| # | Recomendación | Prioridad | Responsable | Cuándo |
| - | -------------- | --------- | ------------ | ------ |
| REC-01 | Enmendar la constitución de forma explícita para reconocer el cuarto sprint o la ampliación del MVP, y registrar la autorización del equipo con su fecha. Es la única acción que no puede ejecutarse dentro del sprint. | Alta | Equipo, con el profesor como aprobador | Antes de implementar |
| REC-02 | **Cerrada el 2026-11-04.** La suite completa del backend se ejecutó con 233 pruebas, 0 fallos, 0 cancelaciones y 0 omitidas en 137,2 segundos, sin pruebas forzadas a terminar. La línea base ya figura en el reporte de pruebas del proyecto, que la tarea T057 actualizará al final del sprint. | Alta | Responsable de calidad | Cerrada |
| REC-03 | **Cerrada el 2026-11-04.** La sección 2.4 quedó llena con seis objetivos de calidad reales (QO-01 a QO-06), cada uno con su métrica, su prueba que lo verifica y su origen. | Alta | Responsable de calidad | Cerrada |
| REC-04 | Corregir los cuatro hallazgos altos que no dependen de la constitución: dividir el archivo de contrato por reporte o retirar las marcas de paralelismo, unificar el nombre del campo del cliente en el contrato y alinear las columnas de las tareas, y añadir a las dos tareas de integración que faltan la verificación de paginación y de resultado vacío. | Alta | Responsable técnico | Antes de dar el sprint por conforme |
| REC-05 | Fijar en la especificación el tamaño de página y el límite de exportación como requisitos con identificador, y no solo como supuestos, para que la trazabilidad pueda enlazarlos con una prueba. | Media | Responsable técnico | Durante la fase de tareas |
| REC-06 | Enunciar el límite de exportación y el tamaño de página en el contrato de la API, que es el documento que consume la pantalla, y no solo en el ejemplo. | Media | Responsable técnico | Durante la fase de tareas |
| REC-07 | Fijar en el requisito del resultado vacío un criterio comprobable de "mensaje claro", y en el de consistencia visual el patrón concreto de comparación. | Media | Responsable de calidad | Durante la fase de tareas |
| REC-08 | Decidir la cobertura de los diecinueve requisitos transversales: o se añaden pruebas estáticas para lo comprobable por análisis, o se convierte la revisión transversal en una revisión con registro formal de resultado. | Media | Responsable técnico | Durante la implementación |
| REC-09 | Corregir las rutas que no resuelven desde la raíz del repositorio y hacer explícito la creación de los ocho archivos de prueba nuevos. | Media | Responsable técnico | Durante la fase de tareas |
| REC-10 | Asignar responsable a los dieciséis riesgos y a los seis ámbitos de las pruebas, hoy todos pendientes. | Media | Responsable de calidad | Antes de implementar |
| REC-11 | Fijar la rama de trabajo y alinear el encabezado del plan con ella, y declarar en la especificación que la redacción de las dos reglas divergentes prevalece hasta la actualización de su documento de origen. | Media | Responsable técnico | Antes de implementar |
| REC-12 | Cerrar el resumen de decisiones por fase y el registro de cambios de la plantilla, de modo que reflejen el estado real de las cinco fases. | Baja | Responsable de calidad | Antes de implementar |

---

## 8. Puerta de entrada a la implementación

**Pendiente de una decisión del equipo.** De los doce criterios de entrada se cumplen nueve y
fallan tres, y los tres fallan por la misma causa: la constitución fija tres sprints, este es
el cuarto y la autorización del equipo está pendiente.

| Criterio | Resultado |
| -------- | --------- |
| La especificación existe, está completa y sin marcadores pendientes | Cumple |
| Las siete historias están definidas, priorizadas y con escenarios | Cumple |
| Las decisiones pendientes del sprint están resueltas | Cumple |
| El plan respeta las restricciones heredadas y los principios de la constitución | **No cumple** |
| Las tareas cubren las historias y respetan el orden pruebas → implementación | Cumple |
| El análisis de consistencia no reporta contradicciones graves pendientes | **No cumple** |
| La matriz de trazabilidad está completa, sin requisitos huérfanos | Cumple |
| Los objetivos de calidad tienen pruebas identificables asociadas | Cumple |
| Los riesgos de impacto alto tienen mitigación asignada | Cumple |
| Todas las fases tienen decisión registrada y ninguna en "rechazado" | Cumple |
| El prerrequisito del Sprint 3 está verificado con base de datos real | Cumple |
| La autorización del Sprint 4 y el número real de sprints están confirmados | **No cumple** |

**Condiciones para abrir la puerta**

1. Enmendar la constitución y registrar la autorización del equipo para el cuarto sprint. Cierra
   el hallazgo crítico y los tres criterios de entrada que fallan por esa causa.
2. ~~Ejecutar la suite completa del backend y registrar el resultado.~~ **Cerrada el 2026-11-04:**
   233 pruebas, 0 fallos, 0 cancelaciones y 0 omitidas en 137,2 segundos.
3. ~~Llenar la sección de objetivos de calidad de la plantilla.~~ **Cerrada el 2026-11-04:** seis
   objetivos de calidad, cada uno con su prueba asociada.

Los cuatro hallazgos altos restantes no bloquean el inicio, pero deben resolverse antes de dar el
sprint por conforme, porque afectan a la corrección de la API y a la verificación de dos criterios
de éxito.

---

*Informe generado el 2026-11-04 a partir de `docs/calidad/sprint-4-calidad-nueva-funcionalidad.md`.
No se ha realizado ningún commit.*
