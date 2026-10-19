# Especificación de la Funcionalidad: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Rama de la funcionalidad**: `003-entrenadores-rutinas-dashboard`

**Creada**: 2026-10-19

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Implementar el sprint 3 descrito en docs/sprint-3.md,
respetando docs/project-context.md y docs/reglas.md. No repetir lo ya hecho en los sprints 1 y 2
(docs/sprint-1.md y docs/sprint-2.md); solo ampliar los módulos existentes."

## Alcance heredado y no reabierto

Este sprint parte de la base entregada en `specs/001-base-usuarios-clientes` (Sprint 1) y
`specs/002-membresias-pagos-acceso-facial` (Sprint 2), que ya entregaron: inicio de sesión con
JWT, roles y permisos validados en backend, gestión de usuarios, registro/consulta/modificación
de clientes, tipos de membresía, membresías y sus estados, pagos y adeudos, información facial,
identificación, control de acceso con registro de accesos y la auditoría funcional del Sprint 2.

Esta especificación NO redefine ninguna de esas funcionalidades; solo las utiliza como
dependencia. Lo nuevo en este sprint es: el registro y la consulta de entrenadores, la asignación
de entrenador a cliente, las rutinas con sus ejercicios, los objetivos de entrenamiento, el
histórico de progresos, la vista propia del cliente sobre su rutina y progreso, la consulta de la
carga asignada al personal y el dashboard administrativo.

Fuera de este sprint quedan, conforme a `docs/sprint-3.md` §1: clases masivas, asistencia a
sesiones grupales, reservas de horarios, reportes complejos de operación, nómina, inventario y
cualquier función que no forme parte del MVP definido en `docs/project-context.md` §5.

## Clarifications

### Session 2026-10-19

- Q: ¿Debe el rol recepcionista poder abrir el dashboard administrativo completo, o solo el
  administrador? (FR-015, FR-019) → A: Solo el administrador abre el dashboard completo; el
  recepcionista recibe HTTP 403 y utiliza la vista de personal asignado (US-S3-07).
- Q: Cuando un cliente se reasigna a otro entrenador, ¿conserva el entrenador anterior algún
  acceso de lectura sobre las rutinas y progresos que él registró? (RN-16, RN-19) → A: No conserva
  acceso: pierde la lectura de ese cliente y solo la conservan el entrenador activo y los roles
  administrador y recepcionista.
- Q: ¿Qué datos debe registrar cada entrada de progreso del cliente? (FR-011) → A: Fecha,
  comentario del entrenador, peso corporal opcional y medidas corporales opcionales (pecho,
  cintura, cadera y muslos).
- Q: Cuando se da de baja un entrenador que aún tiene clientes asignados, ¿qué debe pasar con
  esos clientes? (FR-001, FR-004) → A: Se permite la baja; las asignaciones activas de ese
  entrenador quedan cerradas y sus clientes aparecen como pendientes de asignación.
- Q: ¿Qué debe mostrar exactamente el indicador de "progreso general" del dashboard? (FR-016) →
  A: El porcentaje de objetivos cumplidos sobre el total del periodo más la cantidad de progresos
  registrados en ese periodo.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Registro de entrenadores (Prioridad: P1) [US-S3-01]

Como administrador, quiero registrar a los entrenadores del gimnasio para definir quiénes estarán
a cargo del acompañamiento de los clientes.

**Por qué esta prioridad**: es la pieza base del sprint. Sin entrenadores registrados no es
posible asignar clientes, ni crear rutinas, ni alimentar el dashboard; todo lo demás depende de
que exista el personal de coaching.

**Prueba independiente**: iniciar sesión como administrador y registrar un entrenador asociándolo
a una cuenta de usuario con rol entrenador, verificando que el entrenador queda consultable en el
listado del personal.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** registra un entrenador asociándolo a una
   cuenta de usuario existente con rol entrenador, **Entonces** el entrenador queda persistido y
   aparece en el listado del personal (RN-15).
2. **Dado** una cuenta de usuario inexistente, con rol distinto de entrenador o con la cuenta ya
   asociada a otro entrenador, **Cuando** se intenta registrar el entrenador, **Entonces** el
   sistema rechaza la operación con un mensaje claro y no crea el registro (RN-15).
3. **Dado** un usuario con rol recepcionista, entrenador o cliente, **Cuando** intenta crear o
   modificar un entrenador, **Entonces** el sistema rechaza la solicitud con código HTTP 403.
4. **Dado** un entrenador registrado con clientes asignados, **Cuando** el administrador modifica
   sus datos o desactiva su cuenta, **Entonces** el cambio queda persistido, sus asignaciones
   activas se cierran (dejando a sus clientes como pendientes de asignación) y no se elimina
   ningún histórico de rutinas, objetivos ni progresos de ese entrenador (FR-001).
5. **Dado** un entrenador sin clientes asignados, **Cuando** se consulta el listado del personal,
   **Entonces** aparece con carga cero y el sistema no presenta errores.

---

### Historia de usuario 2 - Asignación de entrenador a cliente (Prioridad: P1) [US-S3-02]

Como administrador o recepcionista, quiero asignar un entrenador a un cliente para establecer la
responsabilidad del seguimiento físico y de entrenamiento.

**Por qué esta prioridad**: es el vínculo que hace operativo el módulo: sin asignación no hay
clientes "a cargo" de un entrenador, por lo que las rutinas y la consulta de carga no tendrían
sobre qué trabajar. Solo requiere tener clientes (Sprint 1) y entrenadores (US-S3-01).

**Prueba independiente**: desde un recepcionista autenticado, asignar un entrenador a un cliente
activo y verificar que el cliente queda listado como asignado a ese entrenador y que el entrenador
refleja la carga de un cliente.

**Escenarios de aceptación**:

1. **Dado** un cliente activo existente y un entrenador registrado y activo, **Cuando** un
   administrador o recepcionista realiza la asignación, **Entonces** el cliente queda vinculado a
   ese entrenador como entrenador principal del periodo activo de seguimiento (RN-16).
2. **Dado** un cliente inexistente, desactivado o un entrenador inexistente o desactivado,
   **Cuando** se intenta realizar la asignación, **Entonces** el sistema rechaza la operación con
   un mensaje claro y no crea el registro (RN-01, RN-15).
3. **Dado** un cliente que ya tiene un entrenador principal activo, **Cuando** se intenta asignar
   un segundo entrenador sin cerrar la asignación anterior, **Entonces** el sistema rechaza la
   operación indicando que solo puede haber un entrenador principal por cliente en el periodo
   activo (RN-16).
4. **Dado** un cliente con entrenador activo, **Cuando** un administrador o recepcionista asigna
   otro entrenador mediante la operación de reasignación, **Entonces** la asignación anterior
   queda cerrada con su fecha de finalización, la nueva queda activa y el histórico de
   asignaciones se conserva (RN-16, RN-17).
5. **Dado** un usuario con rol entrenador o cliente, **Cuando** intenta asignar o reasignar un
   entrenador a un cliente, **Entonces** el sistema rechaza la solicitud con código HTTP 403.
6. **Dado** una asignación registrada, **Cuando** se consulta la ficha del cliente, **Entonces**
   aparece su entrenador principal con la fecha de asignación.

---

### Historia de usuario 3 - Creación de rutinas de entrenamiento (Prioridad: P2) [US-S3-03]

Como entrenador, quiero crear rutinas personalizadas para los clientes asignados para orientar su
plan de entrenamiento.

**Por qué esta prioridad**: es el núcleo del seguimiento deportivo, pero necesita que existan
entrenadores (P1) y clientes ya asignados (US-S3-02) para poder probarse.

**Prueba independiente**: iniciar sesión como entrenador con un cliente asignado, crear una rutina
con al menos tres ejercicios que especifiquen series, repeticiones o instrucciones, y verificar
que la rutina queda visible para ese entrenador y para ese cliente.

**Escenarios de aceptación**:

1. **Dado** un entrenador autenticado con un cliente asignado, **Cuando** crea una rutina con
   nombre, ejercicios, series, repeticiones o instrucciones, **Entonces** la rutina queda
   persistida asociada a ese cliente y a ese entrenador, y puede consultarse (RN-18).
2. **Dado** un cliente que no está asignado al entrenador autenticado, **Cuando** el entrenador
   intenta crear o modificar una rutina para ese cliente, **Entonces** el sistema rechaza la
   solicitud con código HTTP 403: el entrenador solo gestiona su carga asignada (RN-19).
3. **Dado** una rutina sin ejercicios o con ejercicios sin ninguna instrucción de series,
   repeticiones o indicación, **Cuando** se envía la solicitud, **Entonces** el backend la
   rechaza con un mensaje claro y no crea el registro (RN-18).
4. **Dado** un cliente con una rutina activa, **Cuando** su entrenador crea una nueva rutina,
   **Entonces** la rutina anterior pasa a estado finalizada y el cliente queda con una única
   rutina activa, conservándose el histórico completo.
5. **Dado** un usuario con rol recepcionista o cliente, **Cuando** intenta crear o modificar una
   rutina, **Entonces** el sistema rechaza la solicitud con código HTTP 403 (RN-19, RN-20).
6. **Dado** una rutina registrada, **Cuando** el entrenador la modifica (ejercicios, orden,
   series, repeticiones o instrucciones), **Entonces** el cambio queda persistido y la versión
   anterior no sustituye el histórico de progresos ya registrado.

---

### Historia de usuario 4 - Registro de objetivos y progresos (Prioridad: P2) [US-S3-04]

Como entrenador, quiero registrar objetivos y avances del cliente para seguir su evolución de
forma ordenada y medible.

**Por qué esta prioridad**: complementa a la rutina: primero debe existir el plan de
entrenamiento y el cliente asignado para poder fijar metas y registrar la evolución; se entrega
junto con las rutinas en la franja P2.

**Prueba independiente**: desde un entrenador autenticado, registrar un objetivo para un cliente
suyo y luego dos registros de progreso con fecha, comentario, peso y medidas, verificando que los
tres quedan en el histórico del cliente y no se sobrescriben.

**Escenarios de aceptación**:

1. **Dado** un entrenador autenticado con un cliente asignado, **Cuando** registra un objetivo con
   descripción, fecha objetivo y estado inicial, **Entonces** el objetivo queda asociado al
   cliente y al entrenador y puede consultarse en su ficha (RN-21).
2. **Dado** un entrenador con un cliente asignado, **Cuando** registra un progreso con fecha,
   comentario, peso opcional y medidas opcionales (pecho, cintura, cadera y muslos), **Entonces**
   el registro queda en el histórico del cliente, con fecha y autor visibles.
3. **Dado** un progreso ya registrado, **Cuando** se intenta modificar o eliminar de forma
   ordinaria, **Entonces** el sistema no ofrece esa operación y el histórico se conserva
   (RN-17, RN-21).
4. **Dado** un cliente que no está asignado al entrenador autenticado, **Cuando** el entrenador
   intenta registrar un objetivo o un progreso, **Entonces** el sistema rechaza la solicitud con
   código HTTP 403 (RN-19).
5. **Dado** un usuario con rol recepcionista, **Cuando** intenta registrar o modificar objetivos o
   progresos, **Entonces** el sistema rechaza la solicitud con código HTTP 403: el recepcionista
   consulta la asignación del personal, pero no edita rutinas ni progresos (RN-20).
6. **Dado** un objetivo cumplido, **Cuando** el entrenador lo marca como tal, **Entonces** el
   sistema conserva la fecha de cierre y permite consultar el histórico de metas anteriores del
   cliente.
7. **Dado** un cliente con varios registros de progreso en fechas distintas, **Cuando** se
   consulta su evolución, **Entonces** el sistema los presenta ordenados cronológicamente para
   comparar la evolución en el tiempo (RN-17).

---

### Historia de usuario 5 - Consulta de rutina y progreso (Prioridad: P3) [US-S3-05]

Como cliente, quiero consultar mi rutina y mi progreso para conocer mi evolución y mantenerme
motivado.

**Por qué esta prioridad**: es la vista de consumo del trabajo del entrenador; necesita que
existan rutinas y progresos registrados (P1 y P2) y reutiliza el patrón de "solo lo propio"
entregado en "Mi cuenta" del Sprint 2.

**Prueba independiente**: iniciar sesión como cliente con una rutina activa y dos progresos
registrados, y verificar que su vista muestra la rutina con los ejercicios y su evolución
cronológica; repetir con un cliente sin rutina y verificando que el sistema lo informa con claridad.

**Escenarios de aceptación**:

1. **Dado** un cliente con una rutina activa, **Cuando** abre la consulta de su rutina, **Entonces**
   ve la rutina vigente con sus ejercicios, series, repeticiones o instrucciones y la fecha de
   actualización (RN-22).
2. **Dado** un cliente con registros de progreso, **Cuando** consulta su evolución, **Entonces** ve
   sus objetivos con estado y su histórico de progresos ordenado de forma cronológica (RN-17).
3. **Dado** un cliente autenticado, **Cuando** intenta consultar la rutina o el progreso de otro
   cliente, **Entonces** el sistema lo rechaza con código HTTP 403 (RN-22).
4. **Dado** un cliente sin rutina activa ni entrenador asignado, **Cuando** abre la consulta,
   **Entonces** el sistema muestra un mensaje claro de "sin rutina asignada" en lugar de un error
   técnico o de datos vacíos sin explicación.
5. **Dado** un cliente con entrenador pero sin registros de progreso, **Cuando** consulta su
   evolución, **Entonces** el sistema lo indica como sin progreso registrado todavía, sin mostrar
   errores.

---

### Historia de usuario 6 - Dashboard administrativo (Prioridad: P3) [US-S3-06]

Como administrador, quiero ver un resumen de clientes activos, entrenadores asignados, progreso
general y rendimiento del gimnasio para tomar decisiones operativas.

**Por qué esta prioridad**: es la vista de síntesis del negocio; requiere que existan clientes
(Sprint 1), membresías y accesos (Sprint 2) y entrenadores, asignaciones y progresos (este
sprint), por lo que se entrega al final del ciclo.

**Prueba independiente**: con datos de los tres sprints, iniciar sesión como administrador y
verificar que el dashboard muestra los indicadores de clientes, entrenadores y progreso con valores
coherentes; repetir con un rol no autorizado y verificando el rechazo.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** abre el dashboard, **Entonces** ve de un solo
   vistazo: clientes activos, membresías vigentes y vencidas, accesos recientes y rechazados,
   entrenadores registrados, clientes con y sin entrenador asignado, rutinas activas, objetivos
   cumplidos y pendientes, el porcentaje de objetivos cumplidos sobre el total del periodo y la
   cantidad de progresos registrados en ese periodo (RN-23, FR-016).
2. **Dado** un conjunto de datos con valores cero en alguna sección, **Cuando** el administrador
   abre el dashboard, **Entonces** los indicadores muestran cero con una etiqueta comprensible, sin
   errores ni datos inconsistentes.
3. **Dado** un filtro de periodo disponible, **Cuando** el administrador lo aplica, **Entonces** los
   indicadores correspondientes se recalculan para ese periodo.
4. **Dado** un usuario con rol recepcionista, entrenador o cliente, **Cuando** intenta consultar el
   dashboard administrativo, **Entonces** el sistema rechaza la solicitud con código HTTP 403: el
   dashboard completo es exclusivo del administrador (RN-23).
5. **Dado** un indicador agregado, **Cuando** se presenta en el dashboard, **Entonces** no se
   exponen datos sensibles ni identificativos de clientes ajenos a la responsabilidad del usuario
   autenticado (RN-23, RN-24).
6. **Dado** un dato de clientes, membresías, accesos o progresos, **Cuando** se modifica en su
   módulo de origen, **Entonces** el dashboard refleja el cambio sin necesidad de registros
   duplicados ni tablas de resumen desactualizadas.

---

### Historia de usuario 7 - Consulta del personal asignado (Prioridad: P3) [US-S3-07]

Como administrador o recepcionista, quiero consultar los clientes asignados a cada entrenador para
organizar la carga de trabajo del equipo.

**Por qué esta prioridad**: es una consulta sobre la asignación ya registrada en US-S3-02; se
entrega en la franja final junto con el dashboard, ya que su valor es organizativo.

**Prueba independiente**: con tres entrenadores y varios clientes asignados, consultar el listado
del personal y verificar que cada entrenador muestra su carga de clientes y que los clientes sin
asignación aparecen identificados aparte.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado, **Cuando** consulta el personal,
   **Entonces** ve cada entrenador con su estado, su número de clientes asignados y el detalle de
   esos clientes con la fecha de asignación (RN-16).
2. **Dado** clientes sin entrenador asignado, **Cuando** se consulta el personal, **Entonces**
   aparecen en una sección identificada como pendientes de asignación.
3. **Dado** un filtro por entrenador o por estado de asignación, **Cuando** se aplica, **Entonces**
   el listado se acota a los registros que cumplen el filtro.
4. **Dado** un usuario con rol entrenador, **Cuando** consulta el personal, **Entonces** ve
   únicamente su propia carga de clientes, sin la carga de otros entrenadores (RN-19).
5. **Dado** un usuario con rol cliente, **Cuando** intenta consultar la carga del personal,
   **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Casos límite

- ¿Qué sucede cuando se intenta asignar un entrenador a un cliente desactivado? Debe rechazarse
  la operación sin eliminar el registro del cliente (RN-01).
- ¿Qué sucede cuando la cuenta de usuario de un entrenador se desactiva? No debe aceptarse para
  nuevas asignaciones ni permitirse crear rutinas nuevas, sus asignaciones activas deben cerrarse
  dejando a sus clientes como pendientes de asignación, y sus rutinas, objetivos y progresos
  históricos se conservan íntegros (FR-001).
- ¿Qué sucede cuando se reasigna un cliente a otro entrenador? La asignación anterior se cierra
  con fecha, la nueva queda activa y las rutinas, objetivos y progresos existentes no se eliminan;
  el nuevo entrenador continúa sobre el histórico del cliente, mientras el entrenador anterior
  pierde el acceso de lectura y de edición sobre ese cliente (RN-16, RN-17, FR-004).
- ¿Qué sucede cuando un entrenador intenta operar sobre un cliente que no está en su carga? El
  backend debe rechazar con HTTP 403; ocultar la opción en el frontend no es medida de seguridad
  (RN-19, principio V).
- ¿Qué sucede cuando dos entrenadores intentan crear una rutina activa para el mismo cliente? Solo
  debe persistirse una única rutina activa por cliente; la otra operación se rechaza o finaliza la
  rutina anterior.
- ¿Qué sucede cuando un cliente no tiene entrenador ni rutina? Las vistas propias deben informarlo
  con un mensaje claro, no con un error técnico ni con una pantalla vacía sin explicación.
- ¿Qué sucede cuando un entrenador registra un progreso sin objetivos definidos? Debe permitirse:
  el progreso es un registro histórico de evolución y solo se asocia a un objetivo cuando existe.
- ¿Qué sucede cuando un entrenador registra un progreso sin peso ni medidas? Debe permitirse: el
  peso y las medidas corporales son opcionales, y basta la fecha y el comentario para conservar el
  registro en el histórico (FR-011).
- ¿Qué sucede cuando un cliente no tiene membresía vigente pero sí entrenador asignado? Los datos
  de entrenamiento se conservan y siguen siendo consultables; el control de acceso sigue rindiendo
  por la vigencia de la membresía (Sprint 2, RN-07).
- ¿Qué sucede cuando se modifica o elimina un progreso registrado? El sistema no ofrece esa
  operación de forma ordinaria: el histórico debe conservarse para comparar la evolución (RN-17).
- ¿Qué sucede cuando el gimnasio aún no tiene entrenadores, rutinas o progresos? El dashboard debe
  mostrar los indicadores en cero y el resto de las vistas deben operar sin errores.
- ¿Qué sucede cuando un cliente consulta la rutina o el progreso de otro cliente? Debe rechazarse
  con HTTP 403, igual que la franja de datos propia entregada en el Sprint 2 (RN-22).
- ¿Qué sucede cuando MySQL no está disponible? El backend debe responder con un error controlado
  que no exponga detalles internos, tal como en los sprints anteriores.

## Reglas de negocio añadidas por este sprint

`docs/project-context.md` §12 define hasta la RN-14. Este sprint incorpora las reglas siguientes,
que DEBEN incorporarse a §12 de `docs/project-context.md` y a `docs/reglas.md` cuando el equipo las
apruebe, conforme al principio I (la documentación se actualiza cuando cambian las reglas de
negocio). Las referencias RN-15 a RN-24 de esta especificación apuntan a estas reglas:

- **RN-15**: Un entrenador DEBE estar asociado a una cuenta de usuario del sistema válida, activa
  y con rol entrenador; una cuenta no puede pertenecer a dos entrenadores.
- **RN-16**: Un cliente DEBE tener como máximo un entrenador principal en su periodo activo de
  seguimiento; la reasignación cierra la asignación anterior con fecha y conserva el histórico.
- **RN-17**: Las asignaciones, los objetivos y los progresos DEBEN conservarse históricamente para
  poder evaluar la evolución y el cumplimiento; no se modifican ni se eliminan de manera ordinaria.
- **RN-18**: Toda rutina DEBE estar asociada a un cliente y a un entrenador válidos e incluir
  ejercicios con series, repeticiones o instrucciones específicas.
- **RN-19**: Un entrenador solo DEBE gestionar los clientes asignados a su carga.
- **RN-20**: El recepcionista puede consultar la asignación y el estado general del personal, pero
  NO puede editar rutinas ni objetivos ni progresos.
- **RN-21**: El entrenador responsable es quien registra los objetivos y los progresos de sus
  clientes asignados.
- **RN-22**: Un cliente solo DEBE poder consultar su propia rutina y su propio progreso.
- **RN-23**: El dashboard DEBE mostrar información resumida y segura, filtrada por rol y permisos
  del usuario autenticado, y su alcance completo corresponde al administrador.
- **RN-24**: La información de entrenamiento solo DEBE utilizarse para el seguimiento del cliente y
  el apoyo operativo del gimnasio, sin exponer datos sensibles de clientes no autorizados.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **FR-001**: El sistema DEBE permitir al rol administrador crear, consultar y modificar los
  registros de entrenadores del gimnasio, con nombre, contacto y estado, asociados a una cuenta de
  usuario del sistema (RN-15). La desactivación de un entrenador DEBE cerrar sus asignaciones
  activas, dejando a sus clientes como pendientes de asignación, sin eliminar el histórico de
  rutinas, objetivos, progresos ni asignaciones (RN-16, RN-17).
- **FR-002**: El sistema DEBE validar que un entrenador solo puede asociarse a una cuenta de
  usuario existente, activa y con rol entrenador, y que una cuenta no pueda estar asociada a dos
  entrenadores; el backend DEBE rechazar el registro cuando no se cumpla (RN-15).
- **FR-003**: El sistema DEBE permitir a los roles administrador y recepcionista asignar un
  entrenador a un cliente existente y activo, registrando la fecha de asignación (RN-01, RN-16).
- **FR-004**: Un cliente DEBE tener como máximo un entrenador principal en su periodo activo de
  seguimiento; el sistema DEBE ofrecer la reasignación cerrando la asignación anterior con su
  fecha de finalización y abriendo la nueva, conservando siempre el histórico completo de
  asignaciones (RN-16, RN-17). Cerrada la asignación, el entrenador anterior DEBE perder todo
  acceso de lectura y de edición sobre ese cliente: su visión se rige siempre por la asignación
  activa (RN-19).
- **FR-005**: El sistema DEBE rechazar la asignación de entrenadores a clientes inexistentes o
  desactivados, y de cuentas de usuario con roles distintos de entrenador o cuentas desactivadas
  (RN-01, RN-15).
- **FR-006**: El sistema DEBE permitir consultar los clientes asignados a cada entrenador, con su
  fecha de asignación, y diferenciar los clientes que aún no tienen entrenador asignado (RN-16).
- **FR-007**: El sistema DEBE permitir al rol entrenador crear y modificar rutinas de
  entrenamiento únicamente para los clientes asignados a su carga, asociando cada rutina a un
  cliente y a un entrenador válidos (RN-18, RN-19).
- **FR-008**: Cada rutina DEBE incluir nombre, estado y una lista de ejercicios donde al menos una
  indicación de series, repeticiones o instrucciones específica esté presente en cada ejercicio;
  el backend DEBE validar la información antes de persistirla (RN-18).
- **FR-009**: El sistema DEBE mantener una única rutina activa por cliente: al crear una rutina
  nueva, la rutina activa anterior pasa a estado finalizada y el histórico de rutinas se conserva
  sin eliminaciones ordinarias.
- **FR-010**: El sistema DEBE permitir al rol entrenador registrar objetivos de entrenamiento para
  sus clientes asignados, con descripción, fecha objetivo y estado (pendiente, en curso, cumplido
  o cancelado), asociados al cliente y al entrenador (RN-21).
- **FR-011**: El sistema DEBE permitir al rol entrenador registrar progresos de sus clientes con
  fecha, comentario, peso corporal opcional y medidas corporales opcionales (pecho, cintura, cadera
  y muslos), conservándolos como histórico inmutable: no DEBE existir operación ordinaria de
  modificación ni eliminación de registros de progreso (RN-17, RN-21).
- **FR-012**: El sistema DEBE presentar la evolución del cliente ordenada cronológicamente para
  poder comparar avances en el tiempo, incluyendo el estado de sus objetivos (RN-17).
- **FR-013**: El sistema DEBE permitir al rol cliente consultar, desde su sesión, únicamente su
  propia rutina activa, sus objetivos y su histórico de progresos; el backend DEBE filtrar siempre
  por el cliente autenticado y rechazar con HTTP 403 cualquier consulta sobre datos de otro
  cliente (RN-22).
- **FR-014**: El sistema DEBE informar con mensajes claros la ausencia de datos propios del
  cliente (sin rutina activa, sin entrenador asignado o sin progresos registrados) en lugar de
  devolver errores técnicos.
- **FR-015**: Los permisos DEBEN respetar la división de roles: entrenador solo opera sobre su
  carga asignada; recepcionista consulta clientes, asignaciones y el estado general del personal,
  pero NO crea ni modifica rutinas, objetivos ni progresos; cliente solo consulta lo propio; el
  dashboard completo es exclusivo del administrador (principio VI, RN-19, RN-20, RN-23).
- **FR-016**: El sistema DEBE ofrecer al rol administrador un dashboard con, al menos: clientes
  activos, membresías vigentes y vencidas, accesos recientes y rechazados, entrenadores
  registrados, clientes con y sin entrenador asignado, rutinas activas, objetivos cumplidos y
  pendientes, el porcentaje de objetivos cumplidos sobre el total del periodo y la cantidad de
  progresos registrados en ese periodo (RN-23, FR-016).
- **FR-017**: Los indicadores del dashboard DEBEN recalcularse desde la información de sus
  módulos de origen (clientes, membresías, accesos, entrenadores, rutinas y progresos) sin
  duplicar la información operativa; la fuente de indicadores será una consulta o vista
  consolidada, sin tablas de resumen adicionales complejas.
- **FR-018**: El dashboard DEBE presentar la información de forma resumida y legible, con filtros
  de periodo cuando corresponda, y DEBE mostrar indicadores en cero cuando no existan datos, sin
  errores.
- **FR-019**: El dashboard y los indicadores DEBEN filtrarse por rol y permisos del usuario
  autenticado, y NO DEBEN exponer datos sensibles ni identificativos de clientes ajenos a la
  responsabilidad del usuario (RN-23, RN-24).
- **FR-020**: El sistema DEBE registrar en la tabla `auditoria` las acciones relevantes de este
  sprint: asignación y reasignación de entrenador a cliente, creación y modificación de rutinas, y
  registro de objetivos y progresos; guardando usuario, acción, módulo, fecha, resultado y
  descripción conforme a `docs/project-context.md` §7.10, y DEBE restringir su consulta al rol
  administrador.
- **FR-021**: La información de entrenamiento DEBE utilizarse únicamente para el seguimiento del
  cliente y el apoyo operativo del gimnasio; no DEBE emplearse para fines distintos a los
  definidos en el proyecto ni exponerse fuera de los permisos definidos (RN-24).
- **FR-022**: El sistema DEBE crear las tablas `entrenadores`, `asignaciones_entrenador`,
  `rutinas`, `ejercicios_rutina`, `objetivos_entrenamiento` y `progresos_clientes` mediante un
  nuevo script de migración numerado en `database/migrations/`, con claves primarias, claves
  foráneas, integridad referencial, motor InnoDB y codificación `utf8mb4`; las tablas `usuarios`,
  `clientes`, `membresias`, `accesos` y `auditoria` DEBEN reutilizarse sin duplicarse.
- **FR-023**: Los indicadores del dashboard DEBEN poder consultarse mediante una vista o conjunto
  de consultas consolidadas versionado en los scripts de `database/`, sin requerir almacenamiento
  adicional complejo (FR-017).
- **FR-024**: El backend DEBE validar todos los datos de entrada de este sprint (identificadores,
  fechas, estados, series, repeticiones y mediciones) y DEBE utilizar consultas parametrizadas en
  todas las operaciones contra MySQL (RN-13).
- **FR-025**: Los permisos de cada rol sobre los nuevos módulos DEBEN validarse en el backend
  mediante los middlewares de autenticación y autorización existentes desde el Sprint 1; ocultar
  opciones en el frontend NO se considera medida de seguridad suficiente (principio V).
- **FR-026**: La comunicación frontend-backend para los nuevos módulos DEBE realizarse mediante la
  API REST existente, con JSON, códigos HTTP apropiados y manejo de errores centralizado que no
  revele información interna.
- **FR-027**: El frontend DEBE obtener los datos exclusivamente mediante la API REST y NUNCA
  conectarse directamente a MySQL; el backend será el único componente con acceso al motor.
- **FR-028**: El backend y los scripts de `database/scripts/` DEBEN continuar utilizando ES
  Modules (`"type": "module"`, `import` y `export`); NO debe utilizarse `require()` ni
  `module.exports`.
- **FR-029**: Este sprint NO DEBE reimplementar ni modificar el comportamiento ya entregado en los
  Sprints 1 y 2 (inicio de sesión, JWT, roles, usuarios, clientes, membresías, pagos,
  reconocimiento facial y control de acceso), salvo los ajustes mínimos necesarios para integrar
  los nuevos módulos y alimentar el dashboard con sus datos.
- **FR-030**: Este sprint NO DEBE incluir clases masivas, control de asistencia a sesiones
  grupales, reservas de horarios, reportes complejos de operación ni ninguna función fuera del MVP
  definido en `docs/project-context.md` §5 (principio I).
- **FR-031**: Las funciones principales de este sprint DEBEN probarse de extremo a extremo
  (backend + MySQL + frontend) conforme al principio X: alta de entrenador, asignación y
  reasignación, creación de rutinas con ejercicios, registro de objetivos y progresos, consulta
  propia del cliente, dashboard y consulta de la carga del personal.
- **FR-032**: Si cambia una regla de negocio, rol, entidad, requisito o sprint de esta
  especificación, la documentación del proyecto (`docs/project-context.md`, `docs/reglas.md` y
  `docs/sprint-3.md`) DEBE actualizarse conforme al principio I.

### Entidades clave

- **entrenadores**: personal de coaching del gimnasio. Atributos: identificador, referencia a la
  cuenta de usuario (única y con rol entrenador), nombre de contacto, estado y fecha de registro.
  Relación: uno por cuenta de usuario; se relaciona con las asignaciones, las rutinas que crea y
  los objetivos y progresos que registra.
- **asignaciones_entrenador**: vínculo entre un cliente y su entrenador principal en un periodo de
  seguimiento. Atributos: identificador, cliente, entrenador, fecha de asignación, fecha de
  finalización cuando se cierra y estado. Relación: un cliente puede tener muchas asignaciones en
  su histórico, pero una sola activa a la vez (FR-004).
- **rutinas**: plan de entrenamiento de un cliente. Atributos: identificador, cliente,
  entrenador, nombre, descripción, estado (activa o finalizada) y fechas. Relación: pertenece a un
  cliente y al entrenador que la creó; agrupa ejercicios. Una única rutina activa por cliente
  (FR-009).
- **ejercicios_rutina**: detalle de una rutina. Atributos: identificador, rutina, nombre del
  ejercicio, series, repeticiones, carga opcional, instrucciones y orden. Relación: pertenece a
  una rutina.
- **objetivos_entrenamiento**: metas fijadas para el cliente. Atributos: identificador, cliente,
  entrenador, descripción, fecha objetivo, estado y fechas de apertura y cierre. Relación:
  pertenece a un cliente y al entrenador que lo define; puede relacionarse con los progresos.
- **progresos_clientes**: histórico de evolución del cliente. Atributos: identificador, cliente,
  entrenador que lo registró, fecha, comentario, peso corporal opcional y medidas corporales
  opcionales (pecho, cintura, cadera y muslos). Relación: pertenece a un cliente; se conserva
  históricamente sin modificaciones ni eliminaciones ordinarias (FR-011).
- **estadisticas_dashboard**: fuente de indicadores del dashboard; representa una consulta o vista
  consolidada sobre clientes, membresías, accesos, entrenadores, rutinas, objetivos y progresos, y
  NO un almacén de información operativa duplicada (FR-017, FR-023).
- **usuarios** y **clientes**: reutilizadas tal como quedaron en los Sprints 1 y 2, sin
  redefinirse (FR-029).
- **auditoria**: reutilizada del Sprint 2; este sprint agrega las acciones de FR-020 y mantiene su
  consulta exclusiva del administrador.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: Un administrador registra tres entrenadores y los tres aparecen en el listado del
  personal en menos de 5 minutos, verificando cada registro.
- **SC-002**: El 100% de los entrenadores registrados queda asociado a una cuenta de usuario
  existente con rol entrenador; no existe ningún registro de entrenador sin cuenta válida.
- **SC-003**: El 100% de los clientes con asignación tienen exactamente un entrenador principal
  activo; ninguna operación de asignación simultánea produce dos entrenadores activos para el
  mismo cliente.
- **SC-004**: El 100% de las rutinas creadas pertenecen a un cliente que está asignado al
  entrenador que la creó; cualquier intento en contrario recibe respuesta HTTP 403.
- **SC-005**: El 100% de las rutinas activas contienen al menos un ejercicio con series,
  repeticiones o instrucciones registradas.
- **SC-006**: Un entrenador registra un objetivo y dos progresos para un cliente y, al
  consultarlos después, los tres aparecen en el histórico con sus fechas, sin que ninguno se haya
  sobrescrito ni eliminado.
- **SC-007**: El 100% de las consultas de rutina y progreso de un cliente devuelven únicamente
  datos del propio cliente; ninguna consulta devuelve información de otro cliente.
- **SC-008**: El 100% de las operaciones de los nuevos módulos realizadas por roles no autorizados
  (según la división de FR-015) reciben respuesta HTTP 403.
- **SC-009**: El dashboard muestra valores coherentes con la información registrada en clientes,
  membresías, accesos, entrenadores, rutinas y progresos en el 100% de las verificaciones
  realizadas sobre datos de prueba, y se muestra sin errores cuando alguna sección está vacía.
- **SC-010**: Ningún usuario distinto del administrador puede abrir el dashboard completo:
  recepcionista, entrenador y cliente reciben respuesta HTTP 403 en el 100% de las pruebas.
- **SC-011**: El flujo completo del sprint (registrar entrenador → asignarlo a un cliente → crear
  la rutina con ejercicios → registrar objetivo y progreso → verificar la vista del cliente →
  revisar el dashboard → consultar la carga del personal) se ejecuta de extremo a extremo sin
  errores en el entorno de desarrollo.
- **SC-012**: La estructura de información del sistema puede reconstruirse desde cero mediante los
  scripts versionados del proyecto, incluidas las seis tablas nuevas de este sprint, sin
  intervención manual.
- **SC-013**: El 100% de las acciones listadas en FR-020 genera un registro en la tabla
  `auditoria` con usuario, módulo, fecha, resultado y descripción, y su consulta responde HTTP 403
  a los roles distintos del administrador.

## Supuestos

- Los usuarios, roles, permisos, autenticación JWT, clientes, membresías, pagos, información
  facial, control de acceso y auditoría entregados en los Sprints 1 y 2 permanecen vigentes y no
  se redefinen aquí (FR-029).
- La cuenta de usuario del entrenador se crea con el módulo de usuarios del Sprint 1; este sprint
  no duplica la gestión de usuarios, solo la enlaza al registro de entrenadores (FR-002).
- Un cliente puede tener varias asignaciones a lo largo del tiempo, pero una sola activa; al
  reasignar, la anterior se cierra con fecha y no se elimina (FR-004).
- Solo existe una rutina activa por cliente a la vez; las rutinas finalizadas se conservan como
  histórico (FR-009).
- Los progresos no se editan ni se eliminan de manera ordinaria; si un dato de progreso resulta
  erróneo, se registra un nuevo progreso con la corrección (FR-011).
- El progreso puede registrarse aunque el cliente no tenga objetivos definidos; la asociación a un
  objetivo es opcional (caso límite de progreso sin objetivos).
- La pertenencia de un cliente a una rutina no depende de la vigencia de su membresía: el control
  de acceso sigue rindiendo por la membresía tal como quedó en el Sprint 2 (RN-07).
- Los indicadores "rendimiento del gimnasio" del dashboard se limitan a los datos ya disponibles
  en el sistema (membresías vigentes y vencidas, accesos recientes y rechazados) más los datos de
  este sprint; no se incorporan indicadores financieros nuevos ni fuentes externas (FR-016).
- El dashboard completo es exclusivo del administrador porque `docs/project-context.md` §6.2
  excluye al recepcionista de la información administrativa exclusiva y §7.8 define el dashboard
  como consulta del administrador; el recepcionista conserva la consulta del personal asignado de
  US-S3-07 (FR-015).
- El entrenador ve su propia carga de clientes y no la de otros entrenadores, conforme al principio
  VI de `docs/reglas.md` (FR-015, US-S3-07).
- Los indicadores se sirven desde una vista o conjunto de consultas consolidadas versionado en
  `database/`, sin tablas de resumen adicionales complejas, conforme a `docs/sprint-3.md` §5
  (FR-017, FR-023).
- La auditoría de este sprint se limita a las tres acciones enumeradas en `docs/sprint-3.md` §6
  (asignación de entrenador, creación de rutinas y actualizaciones de progreso); cualquier
  ampliación debe aprobarla el equipo (FR-020).
- Clases masivas, asistencia a sesiones grupales, reservas, reportes complejos y funciones fuera
  del MVP quedan excluidos conforme a `docs/sprint-3.md` §1 y al principio I (FR-030).
- La estructura de carpetas `frontend/`, `backend/` y `database/`, el uso de ES Modules en el
  backend, MySQL local con InnoDB y `utf8mb4`, y las credenciales en variables de entorno se
  mantienen tal como en los Sprints 1 y 2 (FR-022, FR-028).
