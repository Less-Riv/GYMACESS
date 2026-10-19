# Especificación de la Funcionalidad: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Rama de la funcionalidad**: `001-base-usuarios-clientes`

**Creada**: 2026-10-08

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Genera la especificación únicamente para Sprint 1. Usa
docs/project-context.md, docs/reglas.md y docs/sprint-1.md como fuentes de verdad. Sprint 1 debe
cubrir la base del sistema, autenticación, usuarios, roles y clientes. No implementes todavía
membresías funcionales, pagos funcionales ni reconocimiento facial. El reconocimiento facial
pertenece a Sprint 2. Respeta la estructura frontend/, backend/, database/ y ES Modules en backend
y scripts JavaScript de database."

## Clarifications

### Session 2026-10-09

- Q: ¿Cómo debe vincularse un usuario con el rol `cliente` con su registro en la tabla `clientes`? →
  A: Campo `cliente_id` con clave foránea en la tabla `usuarios`. Al **crear** el usuario el
  backend lo resuelve solo (ver sesión 2026-10-14); en la **asignación de rol** (US4) el
  administrador lo indica con `cliente_id`.

- Q: ¿Cuál debe ser la duración del token JWT y de la sesión para resolver la ambigüedad de
  FR-024? → A: 8 horas; el token caducado responde 401 y el frontend redirige al inicio de sesión.

- Q: ¿Qué campos exactos de un cliente debe poder ver el rol entrenador para cumplir FR-025? →
  A: nombre, apellido, teléfono y estado del cliente; sin correo, dirección ni información
  financiera.

- Q: ¿Qué campos son obligatorios al registrar un cliente para que FR-013 pueda validarse y
  probarse de forma concreta? → A: nombre, apellido y correo obligatorios; teléfono y dirección
  opcionales.

- Q: ¿El listado de clientes debe paginarse o devolverse completo en este sprint? → A: paginado
  con límite fijo de 20 registros por página y número de página como parámetro.

### Session 2026-10-14

- Q: ¿Cómo se vincula un usuario con rol `cliente` cuando se crea con `POST /api/usuarios`?
  → A: el administrador ya no envía `cliente_id`. El backend, dentro de **una transacción de
  MySQL**, busca en `clientes` un registro con el mismo correo: si no existe lo crea con el
  `nombre` del formulario, un campo nuevo `apellido` (cadena vacía si no viene) y ese correo;
  si ya existe lo reutiliza. Luego crea el usuario con `cliente_id` apuntando a ese cliente.
  Si el cliente ya tiene un usuario se responde 409 "Ya existe un usuario para este cliente"
  y si algo falla se hace rollback, sin registros a medias. Con otros roles no se crea cliente
  y cualquier `cliente_id` recibido se ignora.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Inicio de sesión (Prioridad: P1) [US-S1-01]

Como usuario registrado, quiero iniciar sesión con mi correo y contraseña para acceder a las
funciones permitidas según mi rol.

**Por qué esta prioridad**: es la puerta de entrada del sistema. Sin autenticación no es posible
validar roles ni probar ninguna otra funcionalidad del sprint.

**Prueba independiente**: iniciar sesión con el usuario semilla administrador y verificar que el
sistema concede acceso y muestra únicamente las opciones propias de su rol; repetir con una
contraseña incorrecta y verificar el rechazo.

**Escenarios de aceptación**:

1. **Dado** un usuario registrado con credenciales válidas, **Cuando** envía su correo y contraseña
   correctos, **Entonces** el sistema lo autentica y le permite acceder a las funciones de su rol.
2. **Dado** un usuario registrado, **Cuando** ingresa una contraseña incorrecta, **Entonces** el
   sistema muestra un mensaje de error genérico y no concede acceso.
3. **Dado** un usuario no autenticado, **Cuando** intenta acceder a una ruta protegida de la API,
   **Entonces** el sistema rechaza la solicitud con código HTTP 401.
4. **Dado** un usuario autenticado con rol recepcionista, **Cuando** intenta acceder a la gestión de
   usuarios, **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Historia de usuario 2 - Registro de clientes (Prioridad: P1) [US-S1-04]

Como administrador o recepcionista, quiero registrar nuevos clientes para almacenar su información
en el sistema.

**Por qué esta prioridad**: los clientes son el centro del sistema; todos los módulos futuros
(membresías, pagos, reconocimiento facial) dependen de que existan clientes registrados.

**Prueba independiente**: desde un usuario recepcionista autenticado, registrar un cliente con
datos completos y verificar que queda almacenado en MySQL y aparece en la consulta.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado, **Cuando** registra un cliente con datos
   válidos, **Entonces** el cliente queda persistido en MySQL y aparece en el listado de clientes.
2. **Dado** un administrador o recepcionista, **Cuando** envía datos incompletos o inválidos, como
   un correo con formato incorrecto, **Entonces** el backend rechaza la solicitud y devuelve un
   mensaje de error claro sin crear el registro.
3. **Dado** un usuario autenticado con rol entrenador, **Cuando** intenta registrar un cliente,
   **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Historia de usuario 3 - Registro de usuarios (Prioridad: P2) [US-S1-02]

Como administrador, quiero registrar nuevos usuarios del sistema para permitir que el personal
autorizado pueda utilizar la plataforma.

**Por qué esta prioridad**: el sistema necesita cuentas para los distintos roles, pero el primer
acceso puede garantizarse con el usuario semilla administrador, por lo que es posterior al inicio
de sesión y al registro de clientes.

**Prueba independiente**: registrar un usuario nuevo con rol recepcionista y verificar que puede
iniciar sesión con ese correo y que su contraseña está almacenada con hash.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** registra un usuario con correo, contraseña y
   rol válidos, **Entonces** el usuario queda creado con la contraseña almacenada mediante hash
   bcrypt.
2. **Dado** un administrador, **Cuando** intenta registrar un usuario con un correo que ya existe,
   **Entonces** el sistema rechaza la operación e informa el conflicto.
3. **Dado** un usuario que no tiene rol administrador, **Cuando** intenta registrar usuarios,
   **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Historia de usuario 4 - Asignación de roles (Prioridad: P2) [US-S1-03]

Como administrador, quiero asignar un rol a cada usuario para controlar las funciones que puede
utilizar dentro del sistema.

**Por qué esta prioridad**: los permisos dependen del rol y deben validarse en el backend; sin
roles definidos la autorización no puede comprobarse.

**Prueba independiente**: cambiar el rol de un usuario de entrenador a recepcionista y verificar
que en su siguiente operación el sistema le concede y le niega las acciones correspondientes al
nuevo rol.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** asigna un rol válido a un usuario, **Entonces**
   el usuario pasa a operar con los permisos del nuevo rol en su siguiente petición.
2. **Dado** un administrador, **Cuando** intenta asignar un rol que no existe, **Entonces** el
   sistema rechaza la operación con un mensaje de error claro.
3. **Dado** un usuario sin rol administrador, **Cuando** intenta modificar el rol de otro usuario,
   **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Historia de usuario 5 - Consulta de clientes (Prioridad: P2) [US-S1-06]

Como administrador, recepcionista o entrenador, quiero consultar la información básica de los
clientes para realizar mis actividades.

**Por qué esta prioridad**: la consulta permite verificar que el registro funciona y que cada rol
recibe exactamente la información que le corresponde.

**Prueba independiente**: iniciar sesión con los tres roles autorizados y comparar que el listado
de clientes muestra la información permitida para cada uno de ellos.

**Escenarios de aceptación**:

1. **Dado** un usuario autenticado con rol administrador, recepcionista o entrenador, **Cuando**
   consulta el listado de clientes, **Entonces** ve la información permitida para su rol.
2. **Dado** un usuario con rol entrenador, **Cuando** consulta clientes, **Entonces** no accede a
   información financiera ni a datos reservados a otros roles.
3. **Dado** un usuario con rol cliente, **Cuando** intenta listar los clientes del gimnasio,
   **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Historia de usuario 6 - Modificación de clientes (Prioridad: P3) [US-S1-05]

Como administrador o recepcionista, quiero modificar la información de un cliente para mantener
sus datos actualizados.

**Por qué esta prioridad**: es una operación de mantenimiento sobre datos ya registrados; depende
del registro y la consulta, por lo que se prioriza después.

**Prueba independiente**: modificar el teléfono de un cliente existente y verificar que el cambio
queda persistido y visible en la consulta.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado, **Cuando** modifica con datos válidos la
   información de un cliente, **Entonces** los cambios quedan persistidos en MySQL.
2. **Dado** un administrador o recepcionista, **Cuando** envía datos inválidos en la modificación,
   **Entonces** el backend rechaza la solicitud y conserva los datos originales.
3. **Dado** un usuario con rol entrenador o cliente, **Cuando** intenta modificar un cliente,
   **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Historia de usuario 7 - Consulta de información propia (Prioridad: P3) [US-S1-07]

Como cliente, quiero consultar mi propia información para conocer los datos registrados en el
sistema.

**Por qué esta prioridad**: es la única operación disponible para el rol cliente y comprueba el
aislamiento de la información; depende de que existan clientes y usuarios con ese rol.

**Prueba independiente**: iniciar sesión con un usuario de rol cliente y verificar que solo ve su
propia información, sin poder acceder a la de otros clientes.

**Escenarios de aceptación**:

1. **Dado** un usuario autenticado con rol cliente, **Cuando** consulta su información, **Entonces**
   ve únicamente sus propios datos registrados.
2. **Dado** un usuario con rol cliente, **Cuando** intenta consultar la información de otro cliente
   mediante su identificador, **Entonces** el sistema rechaza la solicitud sin revelar datos de
   terceros.
3. **Dado** un usuario con rol cliente, **Cuando** intenta modificar su información o la de otro
   cliente, **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Casos límite

- ¿Qué sucede cuando un usuario intenta iniciar sesión con un correo que no existe? Debe responder
  con el mismo mensaje genérico de error que una contraseña incorrecta, sin revelar si la cuenta
  existe.
- ¿Qué sucede cuando un usuario que está desactivado intenta iniciar sesión? Debe rechazarse el
  acceso aunque la contraseña sea correcta.
- ¿Qué sucede cuando el token JWT ha expirado? El sistema debe responder 401 y el frontend debe
  redirigir al inicio de sesión.
- ¿Qué sucede cuando un usuario es desactivado mientras tiene una sesión activa? Debe rechazarse
  su siguiente operación autenticada.
- ¿Qué sucede cuando dos administradores registran un usuario con el mismo correo al mismo tiempo?
  El sistema debe garantizar la unicidad del correo.
- ¿Qué sucede cuando los campos enviados contienen caracteres especiales o intentos de inyección
  SQL? Las consultas parametrizadas deben impedir cualquier efecto sobre la base de datos.
- ¿Qué sucede cuando MySQL no está disponible? El backend debe responder con un error controlado
  que no exponga detalles internos del servidor.
- ¿Qué sucede cuando un cliente está desactivado? No debe eliminarse el registro; debe quedar
  inactivo y no ser elegible para nuevas operaciones.
- ¿Qué sucede cuando un usuario con rol cliente no tiene un cliente asociado? El sistema debe
  mostrar un mensaje claro sin errores técnicos.
- ¿Qué sucede cuando la contraseña enviada está vacía o es demasiado corta? El backend debe
  rechazarla con una validación explícita.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **FR-001**: El sistema DEBE permitir a un usuario registrado iniciar sesión con su correo y su
  contraseña.
- **FR-002**: El sistema DEBE verificar las contraseñas con bcrypt y NUNCA debe almacenar
  contraseñas en texto plano.
- **FR-003**: Tras autenticar correctamente, el sistema DEBE emitir un token JWT que identifique al
  usuario y a su rol.
- **FR-004**: El sistema DEBE proteger con un middleware de autenticación todas las rutas de la
  API que no sean públicas.
- **FR-005**: El sistema DEBE aplicar un middleware de autorización que valide el rol del usuario
  contra el recurso solicitado; la validación DEBE realizarse en el backend.
- **FR-006**: El sistema DEBE restringir la gestión de usuarios (crear, consultar, modificar,
  asignar rol y activar o desactivar) exclusivamente al rol administrador.
- **FR-007**: El sistema DEBE permitir registrar usuarios con correo único, contraseña y rol.
- **FR-008**: Los roles disponibles DEBEN ser administrador, recepcionista, entrenador y cliente.
- **FR-009**: El sistema DEBE permitir a los roles administrador y recepcionista registrar
  clientes.
- **FR-010**: El sistema DEBE permitir a los roles administrador y recepcionista modificar la
  información de clientes existentes.
- **FR-011**: El sistema DEBE permitir a los roles administrador, recepcionista y entrenador
  consultar la información de clientes conforme a los permisos de su rol.
- **FR-012**: El sistema DEBE garantizar que un usuario con rol cliente solo pueda consultar su
  propia información (RN-14).
- **FR-013**: El backend DEBE validar todos los datos de entrada antes de procesarlos: campos
  obligatorios (nombre, apellido y correo del cliente), formato del correo, longitud de la
  contraseña y unicidad del correo; el teléfono y la dirección del cliente son opcionales.
- **FR-014**: El sistema DEBE almacenar los usuarios y clientes en MySQL local; los registros de
  usuarios y clientes NO deben eliminarse de manera ordinaria durante este sprint y DEBEN
  disponer de un estado para la baja lógica.
- **FR-015**: El backend DEBE utilizar consultas parametrizadas en todas las operaciones contra
  MySQL para impedir inyecciones SQL.
- **FR-016**: El sistema DEBE crear en MySQL las tablas `usuarios` y `clientes` con operaciones
  funcionales, y las tablas `tipos_membresia`, `membresias` y `pagos` como estructura inicial con
  sus claves primarias y claves foráneas, sin operaciones funcionales en este sprint.
- **FR-017**: La estructura de la base de datos DEBE permitir relacionar posteriormente la
  información facial con un cliente; este sprint NO DEBE capturar, procesar ni almacenar
  información facial de forma funcional.
- **FR-018**: El backend y los scripts JavaScript de `database/scripts/` DEBEN utilizar ES
  Modules (`"type": "module"` en `package.json`, `import` y `export`); NO debe utilizarse
  CommonJS (`require` ni `module.exports`).
- **FR-019**: El proyecto DEBE organizarse en las carpetas `frontend/`, `backend/` y `database/`,
  sin crear carpetas alternativas como `client/`, `server/` o `dataBase/`.
- **FR-020**: La comunicación entre frontend y backend DEBE realizarse mediante una API REST que
  devuelva JSON, use códigos HTTP apropiados y centralice el manejo de errores sin exponer
  información interna del servidor.
- **FR-021**: Las credenciales y configuraciones sensibles DEBEN manejarse mediante variables de
  entorno; el archivo `.env` DEBE estar en `.gitignore` y DEBE existir un `.env.example` sin
  secretos.
- **FR-022**: El frontend DEBE obtener los datos exclusivamente mediante la API REST del backend y
  NUNCA debe conectarse directamente a MySQL.
- **FR-023**: La base de datos DEBE poder reconstruirse a partir de scripts SQL versionados en
  `database/migrations/`, con motor InnoDB y codificación `utf8mb4`.
- **FR-024**: El sistema DEBE emitir tokens JWT con una expiración de 8 horas; cuando el token
  caduque, el sistema DEBE responder 401 y el frontend DEBE cerrar la sesión y solicitar un nuevo
  inicio de acceso.
- **FR-025**: El sistema DEBE limitar la consulta de clientes del rol entrenador a los campos
  nombre, apellido, teléfono y estado del cliente; el entrenador NO DEBE acceder al correo, la
  dirección ni a información financiera.
- **FR-026**: El Sprint 1 NO DEBE instalar librerías de reconocimiento facial, NO DEBE realizar
  captura, comparación ni validación de acceso mediante rostros; la selección de la librería
  corresponde a la planificación del Sprint 2.
- **FR-027**: El listado de clientes DEBE paginarse con un límite fijo de 20 registros por página
  y aceptar el número de página como parámetro de la consulta.

### Entidades clave

- **usuarios**: cuentas de acceso al sistema. Atributos principales: identificador, nombre,
  correo, contraseña (hash bcrypt), rol, estado y `cliente_id`. Relación: cada usuario tiene un rol
  entre administrador, recepcionista, entrenador y cliente; cuando el rol es `cliente`, el campo
  `cliente_id` contiene la clave foránea hacia la tabla `clientes` y lo asigna el administrador al
  crear el usuario (puede ser nulo para los roles administrativo y operativo).
- **clientes**: información de los clientes del gimnasio. Atributos principales: identificador,
  nombre, apellido, correo, teléfono, dirección, fecha de registro y estado. Relaciones futuras:
  con membresías, pagos y datos faciales (Sprint 2). Este sprint solo opera sobre la entidad.
- **tipos_membresia, membresias, pagos**: se crean con su estructura y relaciones en este sprint
  para mantener una base de datos consistente, pero no se les aplican operaciones funcionales
  hasta el Sprint 2.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: Un usuario registrado puede iniciar sesión y ver únicamente las funciones de su rol;
  en la prueba con los cuatro roles, el sistema concede y rechaza el 100% de las acciones según
  corresponda.
- **SC-002**: El 100% de las contraseñas de la tabla `usuarios` están almacenadas en formato hash;
  ninguna contraseña aparece en texto plano, verificado por inspección directa de la tabla.
- **SC-003**: Un administrador completa el registro de un usuario y el registro de un cliente en
  menos de 2 minutos cada uno, incluyendo la verificación de los datos en la consulta.
- **SC-004**: El 100% de los intentos de gestión de usuarios realizados por roles distintos al
  administrador reciben respuesta 403.
- **SC-005**: Un usuario con rol cliente accede solo a su propia información en el 100% de las
  pruebas, sin exponer datos de otros clientes.
- **SC-006**: La base de datos puede reconstruirse desde cero ejecutando los scripts SQL
  versionados, sin intervención manual sobre el motor.
- **SC-007**: El flujo completo del sprint (inicio de sesión → registro de usuario → asignación de
  rol → registro de cliente → consulta → modificación → vista propia del cliente) se ejecuta de
  extremo a extremo sin errores en el entorno de desarrollo.

## Supuestos

- Existe un usuario administrador semilla creado desde `database/seeds/` para garantizar el
  primer acceso a la plataforma.
- Los cuatro roles y sus permisos son los definidos en `docs/project-context.md` y no cambian en
  este sprint.
- MySQL se ejecuta de forma local y sus credenciales se configuran mediante las variables de
  entorno `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.
- La herramienta de build de React, la librería de componentes y la estrategia de manejo de estado
  se definen en la fase de planificación; este sprint solo exige React con JavaScript y consumo de
  API REST.
- Los usuarios y clientes se dan de baja mediante estado lógico; no se elimina ningún registro de
  forma física.
- Los datos faciales no se capturan ni se almacenan de forma funcional; solo se prevé la relación
  futura con un cliente.
- Los límites de alcance se asumen tal como están definidos: fuera de este sprint quedan las
  membresías funcionales, los pagos funcionales, el reconocimiento facial, el control de acceso,
  el dashboard, los reportes, la auditoría funcional, la recuperación de contraseña por correo, el
  auto-registro de usuarios y cualquier funcionalidad propia de aplicaciones móltiples,
  inventario, nómina, contabilidad o facturación.
- El reconocimiento facial completo, incluida la selección de la librería, corresponde al Sprint 2
  y su especificación se generará en una funcionalidad independiente.
