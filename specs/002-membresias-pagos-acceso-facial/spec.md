# Especificación de la Funcionalidad: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Rama de la funcionalidad**: `002-membresias-pagos-acceso-facial`

**Creada**: 2026-10-12

**Última actualización**: 2026-10-15

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Implementar el sprint 2 descrito en docs/sprint-2.md,
respetando docs/project-context.md y docs/reglas.md. No repetir lo ya hecho en docs/sprint-1.md."

## Alcance heredado y no reabierto

Este sprint parte de la base entregada en `specs/001-base-usuarios-clientes` (Sprint 1), que ya
entregó: inicio de sesión con JWT, roles y permisos validados en backend, gestión de usuarios,
registro, consulta y modificación de clientes, y la estructura inicial de las tablas
`tipos_membresia`, `membresias` y `pagos`. Esta especificación NO redefine esas funcionalidades;
las únicamente las utiliza como dependencia. Lo nuevo en este sprint es: operaciones funcionales
sobre tipos de membresía, membresías y pagos; las tablas `rostros`, `accesos` y `auditoria`;
el registro e identificación facial; y la validación de acceso.

## Clarifications

### Session 2026-10-15

- Q: ¿Qué política debe seguir el sistema con las membresías de un cliente: cuántas puede tener
  activas a la vez, cómo se concreta la renovación y cuánta tolerancia hay tras el vencimiento?
  → A: Una única membresía activa por cliente; la renovación extiende la fecha de finalización de
  la misma membresía; se renueva en los estados activo y vencido, y una membresía suspendida o
  cancelada exige crear una membresía nueva; sin tolerancia tras el vencimiento (rechazo
  inmediato).
- Q: ¿Qué métodos de pago admite el sistema y cómo se calcula el adeudo de un cliente, incluidos
  los pagos parciales? (FR-007) → A: Solo efectivo y transferencia; sí se aceptan pagos parciales;
  el adeudo es el precio vigente del tipo de membresía menos la suma de todos los pagos
  registrados del cliente; no hay operación de anulación de pagos en este sprint.
- Q: ¿Qué umbral de coincidencia, condiciones de captura y reintentos debe aplicar el sistema
  cuando no logra reconocer un rostro? (FR-011) → A: Umbral con el valor por defecto
  recomendado por la librería elegida (configurable y justificado en `research.md`); captura con
  luz frontal sin contraluz; reintentos ilimitados registrando cada intento; mensaje "No se
  reconoció tu rostro. Intenta de nuevo o consulta al personal."
- Q: ¿Debe existir en este sprint una operación para pasar una membresía a los estados
  suspendida o cancelada, y quién podría hacerlo? (RN-04) → A: No hay operación en este sprint;
  los estados suspendida y cancelada solo se tienen en cuenta en la validación de acceso, se
  marcan fuera de la aplicación si el gimnasio los necesita y la funcionalidad queda como mejora
  futura.
- Q: ¿Qué vistas propias debe incluir este sprint para el rol cliente (mi membresía, mis pagos,
  mis adeudos o mi historial de accesos)? (US-S2-09) → A: Vistas propias completas en "Mi
  cuenta": membresía con vigencia y estado, pagos, adeudos e historial de accesos; se ajusta
  US-S2-09 (la vista propia del cliente deja de ser historia futura y se entrega como US-S2-10).

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Registro de tipos de membresía (Prioridad: P1) [US-S2-01]

Como administrador, quiero registrar los diferentes tipos de membresía para definir sus
características, duración y precio.

**Por qué esta prioridad**: es la base de todo el sprint. Sin tipos de membresía no es posible
asignar una membresía, ni registrar pagos asociados, ni validar el acceso de un cliente.

**Prueba independiente**: iniciar sesión como administrador, crear un tipo de membresía con
nombre, duración en días y precio, y verificar que queda consultable en el listado.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** registra un tipo de membresía con nombre,
   duración en días y precio válidos, **Entonces** el tipo queda persistido en MySQL y aparece en
   el listado de tipos de membresía.
2. **Dado** un administrador, **Cuando** envía un tipo de membresía sin nombre, con duración
   cero o con precio negativo, **Entonces** el backend rechaza la solicitud con un mensaje de
   error claro y no crea el registro.
3. **Dado** un usuario con rol recepcionista, entrenador o cliente, **Cuando** intenta crear o
   modificar un tipo de membresía, **Entonces** el sistema rechaza la solicitud con código HTTP
   403.
4. **Dado** un tipo de membresía registrado, **Cuando** el administrador modifica su precio o
   descripción, **Entonces** el cambio queda persistido y las membresías existentes conservan
   su relación con el tipo.

---

### Historia de usuario 2 - Asignación de membresía (Prioridad: P1) [US-S2-02]

Como administrador o recepcionista, quiero asignar una membresía a un cliente para registrar su
periodo de acceso al gimnasio.

**Por qué esta prioridad**: es la segunda pieza base del sprint. Sin una membresía asignada no
hay nada que validar en el acceso ni nada que pagar; además reutiliza el módulo de clientes ya
entregado en el Sprint 1.

**Prueba independiente**: desde un usuario recepcionista autenticado, asignar una membresía de
30 días a un cliente registrado y verificar que la membresía queda con estado activo y con las
fechas de inicio y finalización calculadas.

**Escenarios de aceptación**:

1. **Dado** un cliente existente y un tipo de membresía activo, **Cuando** un administrador o
   recepcionista asigna la membresía indicando la fecha de inicio, **Entonces** el sistema crea
   la membresía con fecha de inicio, fecha de finalización calculada a partir de la duración del
   tipo y estado activo.
2. **Dado** un cliente inexistente o un tipo de membresía inexistente, **Cuando** se intenta
   asignar una membresía, **Entonces** el sistema rechaza la operación con un mensaje de error
   claro (RN-01, RN-02).
3. **Dado** una asignación con fecha de finalización anterior a la de inicio, **Cuando** se envía
   la solicitud, **Entonces** el backend la rechaza antes de persistirla (RN-03).
4. **Dado** un usuario con rol entrenador o cliente, **Cuando** intenta asignar una membresía,
   **Entonces** el sistema rechaza la solicitud con código HTTP 403.
5. **Dado** un cliente con una membresía activa, **Cuando** se intenta asignar una segunda
   membresía, **Entonces** el sistema la rechaza con un mensaje claro: solo puede haber una
   membresía activa por cliente (FR-005).

---

### Historia de usuario 3 - Renovación de membresía (Prioridad: P3) [US-S2-03]

Como administrador o recepcionista, quiero renovar la membresía de un cliente para mantener
actualizado su periodo de acceso al gimnasio.

**Por qué esta prioridad**: es una operación sobre membresías ya existentes; se prioriza después
de la asignación, el pago y el registro facial porque el flujo de acceso puede probarse con una
membresía recién asignada.

**Prueba independiente**: renovar la membresía de un cliente con una membresía activa y verificar
que su fecha de finalización se extiende según el tipo de membresía elegido.

**Escenarios de aceptación**:

1. **Dado** un cliente con una membresía activa, **Cuando** un administrador o recepcionista la
   renueva con un tipo de membresía válido, **Entonces** el sistema extiende la fecha de
   finalización de esa misma membresía sumando la duración del tipo elegido, y la vigencia
   actualizada queda consultable (FR-005).
2. **Dado** una membresía vencida, **Cuando** un administrador o recepcionista la renueva,
   **Entonces** el sistema aplica la misma extensión de vigencia: los estados activo y vencido
   admiten renovación (FR-005).
3. **Dado** una membresía suspendida o cancelada, **Cuando** se intenta renovarla, **Entonces** el
   sistema rechaza la operación con un mensaje claro; la nueva vigencia se registra creando una
   membresía nueva (FR-005).
4. **Dado** un usuario sin permiso de recepcionista o administrador, **Cuando** intenta renovar
   una membresía, **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Historia de usuario 4 - Registro de pagos (Prioridad: P2) [US-S2-04]

Como administrador o recepcionista, quiero registrar los pagos realizados por los clientes para
mantener un historial financiero.

**Por qué esta prioridad**: el control financiero es un objetivo central del proyecto y su
registro depende únicamente de tener un cliente y una membresía, que se prueban en P1.

**Prueba independiente**: registrar un pago en efectivo por la membresía de un cliente y verificar
que queda asociado al cliente y a la membresía, y que puede consultarse en el historial.

**Escenarios de aceptación**:

1. **Dado** un cliente con una membresía registrada, **Cuando** un administrador o recepcionista
   registra un pago con monto, método de pago y referencia a la membresía, **Entonces** el pago
   queda persistido con su fecha y puede consultarse en el historial del cliente.
2. **Dado** un pago con monto cero o negativo, **Cuando** se envía la solicitud, **Entonces** el
   backend lo rechaza con un mensaje de error claro (RN-05).
3. **Dado** un pago registrado, **Cuando** un usuario intenta eliminarlo de forma ordinaria,
   **Entonces** el sistema no ofrece esa operación y el registro se conserva (RN-06).
4. **Dado** un usuario con rol entrenador o cliente, **Cuando** intenta registrar un pago,
   **Entonces** el sistema rechaza la solicitud con código HTTP 403.
5. **Dado** un pago registrado, **Cuando** se consulta el historial de pagos del cliente,
   **Entonces** aparecen el monto, la fecha, el método de pago y la membresía asociada.
6. **Dado** un método de pago distinto de efectivo o transferencia, **Cuando** se intenta
   registrar un pago, **Entonces** el backend lo rechaza con un mensaje claro y no crea el
   registro (FR-020).

---

### Historia de usuario 5 - Consulta de pagos y adeudos (Prioridad: P3) [US-S2-05]

Como administrador, quiero consultar los pagos y adeudos de los clientes para llevar un control
financiero del gimnasio.

**Por qué esta prioridad**: es una consulta sobre la información financiera ya registrada; se
prioriza después de poder crear pagos.

**Prueba independiente**: con un cliente que tiene una membresía cuyo precio no ha sido cubierto
por completo, consultar los adeudos y verificar que el sistema muestra el saldo pendiente.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** consulta los pagos de un cliente, **Entonces**
   ve el historial completo ordenado de forma cronológica.
2. **Dado** un cliente cuyos pagos registrados son menores al precio de su membresía, **Cuando**
   el administrador consulta los adeudos, **Entonces** el sistema identifica y muestra el saldo
   pendiente según la información registrada.
3. **Dado** un usuario con rol recepcionista, entrenador o cliente, **Cuando** intenta consultar
   la vista administrativa de adeudos, **Entonces** el sistema rechaza la solicitud con código
   HTTP 403.
4. **Dado** un cliente con pagos parciales registrados, **Cuando** el administrador consulta sus
   adeudos, **Entonces** el sistema resta la suma de sus pagos registrados del precio vigente del
   tipo de membresía y muestra el saldo pendiente (FR-007).

---

### Historia de usuario 6 - Registro de información facial (Prioridad: P1) [US-S2-06]

Como administrador o recepcionista autorizado, quiero registrar la información facial de un
cliente para permitir su identificación al ingresar al gimnasio.

**Por qué esta prioridad**: es el habilitador del flujo distintivo del proyecto (identificación
y control de acceso). Sin registro facial no hay identificación posible; se exige P1 junto con
la asignación de membresía porque el acceso completo requiere ambas piezas.

**Prueba independiente**: con un cliente registrado y una cámara compatible, capturar el rostro
del cliente desde el frontend y verificar que el sistema almacena la información facial asociada
a ese cliente y responde que el registro quedó completo.

**Escenarios de aceptación**:

1. **Dado** un cliente registrado y activo, **Cuando** un administrador o recepcionista autorizado
   captura su rostro mediante la cámara, **Entonces** el sistema procesa la imagen con la librería
   de reconocimiento facial seleccionada y almacena la información facial asociada al cliente
   (RN-12).
2. **Dado** un cliente que no existe en el sistema, **Cuando** se intenta registrar información
   facial, **Entonces** el sistema rechaza la operación (RN-01).
3. **Dado** un cliente sin información facial registrada, **Cuando** se captura su rostro,
   **Entonces** queda registrada; **Cuando** se captura de nuevo, **Entonces** el sistema
   actualiza la información facial previa en lugar de duplicarla.
4. **Dado** un usuario con rol entrenador o cliente, **Cuando** intenta registrar información
   facial, **Entonces** el sistema rechaza la solicitud con código HTTP 403.
5. **Dado** información facial registrada, **Cuando** se consulta desde la API, **Entonces** el
   sistema no expone los datos biométricos crudos al frontend ni mediante endpoints públicos;
   solo devuelve el estado del registro (completo o pendiente) y los metadatos permitidos.

---

### Historia de usuario 7 - Identificación mediante reconocimiento facial (Prioridad: P2) [US-S2-07]

Como cliente previamente registrado, quiero utilizar mi rostro para identificarme al ingresar al
gimnasio.

**Por qué esta prioridad**: es el núcleo distintivo del sistema, pero requiere que existan
previamente clientes con membresía (P1) y con información facial registrada (US-S2-06) para poder
probarse de extremo a extremo.

**Prueba independiente**: con un cliente que tiene membresía activa e información facial
registrada, presentar su rostro en el punto de acceso y verificar que el sistema lo identifica
por nombre; repetir con un rostro no registrado y verificar que no se identifica a nadie.

**Escenarios de aceptación**:

1. **Dado** un cliente con información facial registrada, **Cuando** la cámara captura su rostro
   en el punto de acceso y el sistema lo procesa, **Entonces** el sistema genera el descriptor
   facial y lo compara con los registros faciales de los clientes autorizados, identificando al
   cliente cuando la coincidencia supera el umbral definido.
2. **Dado** un rostro que no coincide con ningún cliente registrado, **Cuando** se procesa la
   captura, **Entonces** el sistema no identifica a ningún cliente y el acceso se rechaza con el
   motivo correspondiente.
3. **Dado** un cliente con información facial desactivada o eliminada lógicamente, **Cuando** se
   procesa su rostro, **Entonces** no se produce ninguna identificación y el acceso se rechaza.
4. **Dado** una captura con calidad insuficiente (iluminación o encuadre inadecuados), **Cuando**
   se procesa, **Entonces** el sistema responde sin identificar, registra el intento y muestra el
   mensaje "No se reconoció tu rostro. Intenta de nuevo o consulta al personal."; el usuario
   puede reintentar sin límite y la identificación usa el umbral definido en FR-011.
5. **Dado** un intento de identificación (exitoso o fallido), **Cuando** se procesa,
   **Entonces** el reconocimiento facial se utiliza únicamente para identificar y controlar el
   acceso; no se realiza vigilancia, seguimiento ni rastreo de clientes (RN-12).

---

### Historia de usuario 8 - Validación de acceso (Prioridad: P2) [US-S2-08]

Como sistema, quiero verificar la membresía del cliente después de identificarlo para determinar
si puede ingresar al gimnasio.

**Por qué esta prioridad**: es el resultado final del flujo del sprint (identificar → validar
membresía → autorizar o rechazar → registrar), y depende de las historias anteriores.

**Prueba independiente**: con un cliente identificado facialmente, probar los cuatro escenarios de
membresía (activa, vencida, suspendida, cancelada) y verificar que solo la activa autoriza el
ingreso y que los cuatro quedan registrados en la tabla de accesos.

**Escenarios de aceptación**:

1. **Dado** un cliente identificado facialmente con una membresía activa y vigente, **Cuando** se
   valida su acceso, **Entonces** el sistema autoriza el ingreso y registra el intento como
   autorizado (RN-07).
2. **Dado** un cliente identificado con una membresía vencida, **Cuando** se valida su acceso,
   **Entonces** el sistema rechaza el ingreso, registra el intento como rechazado con el motivo
   de membresía vencida (RN-08, RN-11).
3. **Dado** un cliente identificado con una membresía suspendida o cancelada, **Cuando** se valida
   su acceso, **Entonces** el sistema rechaza el ingreso y registra el motivo correspondiente.
4. **Dado** un cliente identificado sin ninguna membresía registrada, **Cuando** se valida su
   acceso, **Entonces** el sistema rechaza el ingreso y registra el motivo de membresía
   inexistente.
5. **Dado** un cliente con la sesión de identificación previa fallida, **Cuando** se valida su
   acceso, **Entonces** el acceso se rechaza y se registra el motivo de identificación no
   reconocida: la validación de membresía solo ocurre después de una identificación exitosa
   (RN-09).
6. **Dado** cualquier intento de acceso, **Cuando** se procesa, **Entonces** el sistema genera
   siempre un registro de acceso con fecha, hora, resultado y, en caso de rechazo, el motivo
   (RN-10, RN-11); los registros de acceso no se eliminan de manera ordinaria.

---

### Historia de usuario 9 - Consulta de accesos (Prioridad: P3) [US-S2-09]

Como administrador o recepcionista, quiero consultar los registros de acceso para conocer las
entradas autorizadas y los intentos rechazados.

**Por qué esta prioridad**: es una consulta sobre los registros generados por el control de
acceso; se entrega al final porque necesita que existan intentos registrados.

**Prueba independiente**: después de ejecutar varios intentos de acceso (autorizados y
rechazados), consultar el listado desde un recepcionista y verificar que aparecen todos con su
resultado y motivo.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado, **Cuando** consulta los registros de
   acceso, **Entonces** ve los intentos con fecha, hora, cliente cuando aplique, resultado y
   motivo de rechazo cuando aplique.
2. **Dado** un filtro de fecha o de resultado, **Cuando** se aplica a la consulta, **Entonces** el
   listado se acota a los registros que cumplen el filtro.
3. **Dado** un usuario con rol entrenador, **Cuando** intenta consultar el listado de accesos,
   **Entonces** recibe una vista básica (cliente, fecha, hora y resultado), sin el detalle de
   motivos de rechazo, reservado a administrador y recepcionista; la constitución reconoce al
   entrenador el permiso de consultar asistencia o accesos (principio VI).
4. **Dado** un usuario con rol cliente, **Cuando** intenta consultar el listado de accesos del
   gimnasio completo, **Entonces** el sistema rechaza la solicitud con código HTTP 403; la
   consulta de su propio historial de accesos y de su membresía, pagos y adeudos se entrega en
   US-S2-10 (franja de datos restringida a lo propio del cliente).
5. **Dado** un registro de acceso, **Cuando** un usuario intenta eliminarlo, **Entonces** el
   sistema no ofrece esa operación y el registro se conserva.

---

### Historia de usuario 10 - Mis datos: membresía, pagos, adeudos y accesos (Prioridad: P3) [US-S2-10]

Como cliente, quiero consultar en "Mi cuenta" mi membresía con su vigencia y estado, mis pagos,
mi adeudo y mi historial de accesos para conocer mi situación en el gimnasio sin depender del
personal.

**Por qué esta prioridad**: cumple los permisos que la constitución (principio VI de
`docs/reglas.md`) y `docs/project-context.md` §6.4 reconocen al cliente, y necesita que los
módulos de membresías, pagos y control de acceso ya estén entregados; se entrega la última.

**Prueba independiente**: iniciar sesión como cliente con una membresía vigente, pagos
registrados y un acceso autorizado, y verificar que "Mi cuenta" muestra su membresía con fechas y
estado, su historial de pagos, su adeudo y sus intentos de acceso, y que otro cliente no puede ver
esos datos.

**Escenarios de aceptación**:

1. **Dado** un cliente con una membresía registrada, **Cuando** abre "Mi cuenta", **Entonces**
   ve su tipo de membresía, fecha de inicio, fecha de finalización, días restantes y estado
   (activa o vencida) (FR-004).
2. **Dado** un cliente con pagos registrados, **Cuando** consulta sus pagos, **Entonces** ve su
   historial con monto, fecha, método de pago y membresía asociada (FR-008).
3. **Dado** un cliente con pagos parciales, **Cuando** consulta su adeudo, **Entonces** ve el
   saldo pendiente calculado con la fórmula de FR-007; si no tiene adeudo, el sistema lo indica
   como al corriente.
4. **Dado** un cliente con intentos de acceso registrados, **Cuando** consulta su historial de
   accesos, **Entonces** ve sus propios intentos con fecha, hora, resultado y motivo de rechazo
   cuando aplique (FR-014).
5. **Dado** un cliente autenticado, **Cuando** intenta consultar la membresía, los pagos, los
   adeudos o los accesos de otro cliente, **Entonces** el sistema lo rechaza con código HTTP 403:
   el cliente solo accede a su propia información.
6. **Dado** un cliente sin ninguna membresía registrada, **Cuando** abre "Mi cuenta", **Entonces**
   el sistema lo informa claramente (sin membresía asignada) en lugar de mostrar datos vacíos o
   un error.
7. **Dado** un cliente sin pagos registrados, **Cuando** consulta su adeudo, **Entonces** el
   sistema muestra el precio total de su tipo de membresía como saldo pendiente.

---

### Casos límite

- ¿Qué sucede cuando un cliente tiene información facial pero su membresía venció hace un día?
  Debe rechazarse el acceso con el motivo de membresía vencida: no existe tolerancia tras el
  vencimiento (FR-005).
- ¿Qué sucede cuando dos clientes tienen rostros muy parecidos y la coincidencia está cerca del
  umbral? El sistema debe rechazar por seguridad en lugar de arriesgar una identificación
  errónea.
- ¿Qué sucede cuando la cámara no está disponible o no responde? El backend debe responder con un
  error controlado, sin exponer detalles técnicos, y no debe quedar ningún acceso registrado como
  autorizado.
- ¿Qué sucede cuando se intenta asignar una membresía a un cliente desactivado? Debe rechazarse
  la operación sin eliminar el registro del cliente.
- ¿Qué sucede si se busca una operación para suspender o cancelar una membresía? No existe en
  este sprint: la interfaz ofrece únicamente asignar y renovar; los estados suspendida y
  cancelada solo se consideran en la validación de acceso y se marcan fuera de la aplicación
  (FR-004).
- ¿Qué sucede cuando la fecha de sistema cambia y una membresía activa alcanza su fecha de
  finalización? La validación de acceso debe tratarla como vencida en el momento de la consulta.
- ¿Qué sucede cuando el precio del tipo de membresía se modifica después de asignar una
  membresía? El cálculo de adeudos utiliza el precio vigente del tipo de membresía al momento
  de consultar, conforme a FR-007.
- ¿Qué sucede cuando el procesamiento facial tarda o falla? Ningún acceso debe quedar registrado
  como autorizado sin una identificación exitosa explícita.
- ¿Qué sucede cuando dos capturas del mismo cliente se procesan casi al mismo tiempo? El sistema
  no debe duplicar registros faciales del mismo cliente.
- ¿Qué sucede cuando un pago se registra contra una membresía de otro cliente? El backend debe
  rechazar la operación verificando la relación cliente-membresía (RN-05).
- ¿Qué sucede cuando MySQL no está disponible? El backend debe responder con un error controlado
  que no exponga detalles internos, tal como en el Sprint 1.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **FR-001**: El sistema DEBE permitir al rol administrador crear, consultar y modificar tipos de
  membresía con nombre, descripción, duración en días, precio y estado.
- **FR-002**: El sistema DEBE calcular la fecha de finalización de una membresía a partir de la
  fecha de inicio y la duración del tipo de membresía seleccionado (RN-03).
- **FR-003**: El sistema DEBE permitir a los roles administrador y recepcionista asignar
  membresías únicamente a clientes existentes y con tipos de membresía válidos (RN-01, RN-02).
- **FR-004**: El sistema DEBE identificar y exponer el estado de cada membresía entre activa,
  vencida, suspendida y cancelada, y DEBE determinar la vigencia al momento de la consulta
  (RN-04). Este sprint NO incluye ninguna operación para cambiar una membresía a los estados
  suspendida o cancelada: esos estados solo se consideran en la validación de acceso y, si el
  gimnasio los necesita, se marcan fuera de la aplicación (mejora futura).
- **FR-005**: El sistema DEBE permitir renovar membresías de clientes a los roles administrador y
  recepcionista con esta política: cada cliente puede tener **una única membresía activa a la
  vez**; la renovación **extiende la fecha de finalización de la misma membresía**, sumando la
  duración del tipo elegido a la vigencia vigente; se permite renovar en los estados **activo y
  vencido**, y una membresía **suspendida o cancelada NO se renueva** (la nueva vigencia se
  registra creando una membresía nueva); **no existe tolerancia** tras el vencimiento, por lo que
  el acceso se rechaza desde el primer momento vencida (RN-04, RN-07, RN-08).
- **FR-006**: El sistema DEBE permitir a los roles administrador y recepcionista registrar pagos
  asociados al cliente y a una membresía de ese mismo cliente, con monto, fecha y método de pago;
  el backend DEBE verificar la relación cliente-membresía antes de persistir (RN-01, RN-05).
- **FR-007**: El sistema DEBE conservar el historial de pagos sin permitir su eliminación
  ordinaria, conforme al principio VII y RN-06. Los métodos de pago disponibles son **efectivo y
  transferencia**; **sí se aceptan pagos parciales**, y el adeudo de un cliente se calcula como el
  precio vigente del tipo de membresía de su membresía menos la suma de todos sus pagos
  registrados. Este sprint NO incluye ninguna operación de anulación de pagos (RN-06).
- **FR-008**: El sistema DEBE permitir al rol administrador consultar el historial de pagos y la
  información de adeudos de los clientes; el propio cliente DEBE poder consultar también, en
  "Mi cuenta", únicamente su historial de pagos y su adeudo (FR-028).
- **FR-009**: El sistema DEBE permitir a los roles administrador y recepcionista registrar y
  actualizar la información facial de un cliente previamente registrado y activo (RN-01, RN-12).
- **FR-010**: El sistema DEBE procesar la captura facial con una librería de reconocimiento
  facial seleccionada, compatible con la arquitectura y con licencia adecuada; esa selección DEBE
  quedar documentada y justificada en la investigación y planificación del Sprint 2 (`research.md`)
  antes de implementar y NO podrá hacerse de forma arbitraria. El lugar de procesamiento (frontend,
  backend o combinación de ambos) y la forma de captura y almacenamiento de descriptores se definen
  también durante la planificación (FR-017, FR-018).
- **FR-011**: El sistema DEBE identificar a un cliente comparando el descriptor facial capturado
  contra los descriptores faciales registrados de los clientes, aplicando un umbral de
  coincidencia igual al **valor por defecto recomendado por la librería elegida**, configurable y
  documentado en `research.md` antes de implementar. Cuando no se reconoce al cliente, el sistema
  DEBE permitir **reintentos sin límite** (cada intento queda registrado conforme a FR-014) y
  mostrar el mensaje *"No se reconoció tu rostro. Intenta de nuevo o consulta al personal."*, con
  capturas realizadas con **luz frontal sin contraluz**.
- **FR-012**: El sistema DEBE validar la membresía del cliente únicamente después de una
  identificación facial exitosa, y DEBE autorizar el acceso solo cuando la membresía esté activa
  y vigente (RN-07, RN-09).
- **FR-013**: El sistema DEBE rechazar el acceso cuando la membresía esté vencida, suspendida,
  cancelada o no exista, o cuando el rostro no pueda identificarse (RN-08).
- **FR-014**: El sistema DEBE registrar cada intento de acceso con fecha, hora, resultado y, en
  caso de rechazo, el motivo; los registros de acceso NO deben eliminarse de manera ordinaria
  (RN-10, RN-11).
- **FR-015**: El sistema DEBE permitir a los roles administrador y recepcionista consultar los
  registros de acceso, con filtros por fecha y resultado; el cliente solo podrá consultar su
  propio historial de accesos (FR-028).
- **FR-016**: El sistema DEBE registrar en la tabla `auditoria` las acciones importantes de este
  sprint (asignación y renovación de membresías, registro de pagos, registro de información
  facial y resultados del control de acceso), guardando usuario, acción, módulo, fecha, resultado
  y descripción conforme a `docs/project-context.md` §7.10, y DEBE restringir su consulta al rol
  administrador.
- **FR-017**: La información facial DEBE tratarse como información sensible: los datos
  biométricos no DEBEN exponerse mediante endpoints públicos ni devolverse crudos al frontend, y
  su almacenamiento DEBE protegerse de acuerdo con la decisión técnica registrada en la
  planificación (principio V).
- **FR-018**: El reconocimiento facial DEBE utilizarse únicamente para identificar clientes
  registrados y controlar su acceso; NO DEBE implementarse vigilancia, seguimiento, rastreo ni
  identificación de personas no registradas con fines distintos al acceso (RN-12).
- **FR-019**: El sistema DEBE crear en MySQL las tablas `rostros`, `accesos` y `auditoria` mediante
  un nuevo script de migración numerado en `database/migrations/`, con claves primarias, claves
  foráneas, integridad referencial, motor InnoDB y codificación `utf8mb4` (FR-023 del Sprint 1);
  las tablas `tipos_membresia`, `membresias` y `pagos` ya creadas en el Sprint 1 DEBEN
  reutilizarse sin duplicarse.
- **FR-020**: El backend DEBE validar todos los datos de entrada de este sprint en el backend:
  montos, fechas, duraciones, catálogos de método de pago y estados; y DEBE utilizar consultas
  parametrizadas en todas las operaciones contra MySQL (RN-13).
- **FR-021**: Los permisos de cada rol sobre los nuevos módulos DEBEN validarse en el backend
  mediante los middlewares de autenticación y autorización existentes desde el Sprint 1; ocultar
  opciones en el frontend NO se considera medida de seguridad suficiente.
- **FR-022**: La comunicación frontend-backend para los nuevos módulos DEBE realizarse
  mediante la API REST existente, con JSON, códigos HTTP apropiados y manejo de errores
  centralizado que no revele información interna.
- **FR-023**: El frontend DEBE obtener los datos exclusivamente mediante la API REST y NUNCA
  conectarse directamente a MySQL; el backend será el único componente con acceso al motor.
- **FR-024**: El backend y los scripts de `database/scripts/` DEBEN continuar utilizando ES
  Modules (`"type": "module"`, `import` y `export`); NO debe utilizarse `require()` ni
  `module.exports`.
- **FR-025**: El frontend DEBE implementar la interfaz de captura facial con una cámara web
  estándar del equipo utilizada desde un navegador de escritorio con acceso a la cámara; las
  condiciones mínimas de captura y el umbral de coincidencia se definen en FR-011.
- **FR-026**: Este sprint NO DEBE reimplementar ni modificar el comportamiento ya entregado en el
  Sprint 1 (inicio de sesión, JWT, roles, gestión de usuarios y de clientes), salvo los ajustes
  mínimos necesarios para integrar los nuevos módulos.
- **FR-027**: Las funciones principales de este sprint DEBEN probarse de extremo a extremo
  (backend + MySQL + frontend) conforme al principio X: tipos de membresía, asignación y
  renovación, registro y consulta de pagos, consulta de adeudos, registro facial, identificación
  facial, autorización y rechazo de accesos, registro de accesos y las vistas propias del cliente
  de US-S2-10.
- **FR-028**: El sistema DEBE permitir al rol cliente consultar, desde su sesión, únicamente su
  propia información: membresía con vigencia y estado, historial de pagos, adeudo calculado y
  historial de accesos; el backend DEBE filtrar siempre por el cliente autenticado y rechazar con
  HTTP 403 cualquier consulta sobre datos de otro cliente (principio VI, FR-021).

### Entidades clave

- **tipos_membresia**: planes disponibles del gimnasio. Atributos: identificador, nombre,
  descripción, duración en días, precio y estado. Relación: un tipo puede estar relacionado con
  muchas membresías. Ya existe su estructura desde el Sprint 1; este sprint agrega las
  operaciones funcionales.
- **membresias**: vínculo entre un cliente y un tipo de membresía con su vigencia. Atributos:
  identificador, cliente, tipo de membresía, fecha de inicio, fecha de finalización y estado
  (activa, vencida, suspendida, cancelada). Relaciones: pertenece a un cliente y a un tipo; se
  asocia con pagos. Estructura creada en el Sprint 1; este sprint la vuelve funcional.
- **pagos**: historial financiero. Atributos: identificador, cliente, membresía asociada
  (obligatoria y del mismo cliente, RN-05), monto, fecha, método de pago (efectivo o
  transferencia) y estado. Relaciones:
  pertenece a un cliente y a una membresía de ese cliente. Estructura creada en el
  Sprint 1; este sprint la vuelve funcional y prohíbe su eliminación ordinaria.
- **rostros**: información facial necesaria para identificar a un cliente, generada por la
  librería seleccionada. Atributos mínimos según el modelo de `docs/project-context.md`:
  identificador, cliente, descriptor facial, fecha de registro y estado. Relación: uno por cliente
  (sin duplicados). NO almacena imágenes faciales sin justificación técnica y de seguridad
  explícita; su forma definitiva se define en la planificación.
- **accesos**: registros de los intentos de entrada. Atributos: identificador, cliente cuando la
  identificación sea exitosa, fecha, hora, resultado (autorizado o rechazado) y motivo de
  rechazo. Relación: pertenece a un cliente cuando existe identificación. No se eliminan de
  manera ordinaria.
- **auditoria**: registros de acciones importantes del sistema (usuario, acción, módulo, fecha,
  resultado y descripción); la consulta es exclusiva del administrador.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: Un administrador registra un tipo de membresía y un recepcionista asigna una
  membresía a un cliente en menos de 3 minutos, verificando ambas operaciones en la consulta.
- **SC-002**: El 100% de las membresías creadas presentan fecha de inicio, fecha de finalización
  y estado correctos, verificable en la consulta de membresías tras crear membresías de distinta
  duración.
- **SC-003**: El 100% de los pagos registrados quedan asociados a un cliente existente y a una
  membresía de ese mismo cliente; el historial de pagos no contiene eliminaciones.
- **SC-004**: Un cliente con membresía activa e información facial registrada es identificado y
  autorizado en el 100% de las pruebas de acceso realizadas en condiciones de iluminación
  adecuadas.
- **SC-005**: El 100% de los accesos solicitados con membresía vencida, suspendida, cancelada o
  inexistente, o sin identificación facial válida, quedan registrados como rechazados con su
  motivo.
- **SC-006**: El 100% de los intentos de acceso (autorizados y rechazados) genera un registro en
  la tabla `accesos`; no existe ningún intento procesado sin registro.
- **SC-007**: Ningún dato biométrico crudo es accesible sin autenticación ni se devuelve al
  frontend en las respuestas del sistema, verificado mediante revisión de las respuestas y de
  los servicios expuestos.
- **SC-008**: El 100% de las operaciones de los nuevos módulos realizadas por roles no
  autorizados (entrenador y cliente, según el módulo) reciben respuesta HTTP 403.
- **SC-009**: El flujo completo del sprint (crear tipo de membresía → asignar membresía →
  registrar pago → registrar información facial → identificar al cliente → validar membresía →
  autorizar o rechazar el acceso → verificar el registro en accesos) se ejecuta de extremo a
  extremo sin errores en el entorno de desarrollo.
- **SC-010**: La estructura de información del sistema puede reconstruirse desde cero mediante
  los scripts versionados del proyecto, incluidas las tablas nuevas `rostros`, `accesos` y
  `auditoria`, sin intervención manual.
- **SC-011**: Un cliente autenticado ve en "Mi cuenta" su membresía con vigencia y estado, su
  historial de pagos, su adeudo y sus accesos en el 100% de las pruebas realizadas; ninguna
  consulta del cliente devuelve datos de otro cliente.

## Supuestos

- Los usuarios, roles, permisos, autenticación JWT, clientes y la estructura inicial de
  `tipos_membresia`, `membresias` y `pagos` entregados en el Sprint 1 permanecen vigentes y no
  se redefinen aquí (FR-026).
- MySQL se ejecuta de forma local con InnoDB, `utf8mb4` y credenciales en variables de entorno;
  el usuario de la aplicación es dedicado, no `root`.
- La librería de reconocimiento facial, su lugar de procesamiento, la forma de captura y el
  almacenamiento de descriptores se deciden en la investigación y planificación del Sprint 2 y se
  documentan e justifican en `research.md` y `plan.md` antes de implementar (FR-010); el umbral
  de coincidencia, las condiciones de captura, los reintentos y el mensaje quedaron definidos en
  la sesión de clarificación del 2026-10-15 (FR-011).
- Los datos biométricos se protegen conforme al principio V de la constitución; la decisión
  concreta de protección queda registrada en la planificación.
- El reconocimiento facial se limita a identificar clientes previamente registrados para validar
  su acceso; no hay vigilancia, seguimiento ni identificación de terceros (FR-018).
- Los pagos y los registros de accesos no se eliminan de manera ordinaria; no existe endpoint de
  borrado para ellos en este sprint.
- La política de membresías quedó definida en la sesión de clarificación del 2026-10-15 (sección
  `Clarifications`): una única membresía activa por cliente, renovación que extiende la vigencia
  de la misma membresía, estados renovables activo y vencido, y sin tolerancia tras el
  vencimiento (FR-005).
- La política de cobro quedó definida en la sesión de clarificación del 2026-10-15 (sección
  `Clarifications`): métodos de pago efectivo y transferencia, pagos parciales permitidos, adeudo
  = precio vigente del tipo menos la suma de pagos registrados, y sin anulación de pagos
  (FR-007).
- Las reglas de auditoría funcionales de este sprint siguen por defecto lo definido en
  `docs/project-context.md` §7.10 y en FR-016 (acciones del propio sprint y consulta exclusiva
  del administrador); cualquier ampliación debe aprobarla el equipo.
- El entrenador puede consultar una vista básica de los accesos (cliente, fecha, hora y
  resultado) porque la constitución le reconoce ese permiso (principio VI de `docs/reglas.md`);
  el detalle de motivos de rechazo y los filtros completos quedan reservados a administrador y
  recepcionista.
- Este sprint no incluye operación para suspender o cancelar una membresía (sesión de
  clarificación del 2026-10-15): la interfaz ofrece únicamente asignar y renovar, y los estados
  suspendida y cancelada solo los exige la validación de acceso (FR-004).
- El dashboard administrativo y los reportes avanzados quedan fuera de este sprint, conforme a la
  sección "Fuera de alcance" de `docs/sprint-2.md`, y la auditoría completa queda como consulta
  del administrador cuando se defina su alcance. Las vistas propias del cliente (membresía,
  pagos, adeudos y accesos) SÍ quedan incluidas por la sesión de clarificación del 2026-10-15 y
  se entregan en US-S2-10.
- La estructura de carpetas `frontend/`, `backend/` y `database/` y el uso de ES Modules en el
  backend se mantienen tal como en el Sprint 1.
