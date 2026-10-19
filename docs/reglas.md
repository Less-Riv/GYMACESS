<!--

Reporte de Impacto de la Sincronización

- Cambio de versión: 1.0.0 → 1.1.0

- Cambio principal: la base de datos del MVP pasa de MongoDB a MySQL
  ejecutado de forma local.

- Se actualizan los principios III y IV, así como las secciones
  "Tecnologías y Dependencias", "Flujo de Desarrollo" y
  "Decisiones Pendientes".

- La estructura de información pasa de colecciones a tablas relacionales.

- El MVP mantiene las mismas funcionalidades:
  usuarios, clientes, membresías, pagos, reconocimiento facial,
  control de acceso, dashboard y reportes.

- Se mantiene el desarrollo en tres sprints.

-->

# Constitución del Sistema de Gestión para Gimnasio

El Sistema de Gestión para Gimnasio es un proyecto académico cuyo objetivo es
desarrollar una plataforma web para administrar clientes, membresías, pagos y
accesos mediante reconocimiento facial.

El sistema permitirá centralizar la información del gimnasio, controlar el
estado de las membresías, registrar pagos y validar el acceso de los clientes.
También contará con diferentes roles para limitar el acceso a las funciones
según las responsabilidades de cada usuario.

El desarrollo del MVP se realizará en tres sprints y utilizará una arquitectura
basada en React, Node.js, Express y MySQL.

El detalle de los requisitos, módulos, entidades, reglas de negocio y sprints
se encuentra en la documentación del proyecto y constituye la fuente de verdad
para el desarrollo.

## Principios Fundamentales

### I. Alcance, MVP y Fuente de Verdad (NO NEGOCIABLE)

* El desarrollo DEBE respetar el alcance definido para el proyecto.

* NO se deben agregar funcionalidades que no formen parte del alcance sin
  autorización previa del equipo.

* El desarrollo DEBE realizarse en tres sprints y respetar el orden establecido.

* El MVP DEBE concentrarse en las funciones principales del gimnasio:
  clientes, membresías, pagos, reconocimiento facial, control de acceso,
  usuarios, roles, dashboard y reportes.

* Las funciones que no formen parte del alcance actual podrán considerarse
  como mejoras futuras, pero NO deberán implementarse dentro del MVP.

* DEBE mantenerse la relación entre requisito, historia de usuario, sprint
  e implementación.

* Si cambia una regla de negocio, rol, entidad, requisito o sprint, la
  documentación del proyecto DEBE actualizarse.

* Justificación: mantener un alcance definido permite desarrollar un sistema
  funcional y evitar que el proyecto crezca de manera innecesaria.

### II. Arquitectura con Responsabilidades Separadas (NO NEGOCIABLE)

* El proyecto DEBE separar frontend, backend y base de datos.

* El frontend DEBE encargarse de la interfaz y de la interacción con el usuario.

* El backend DEBE encargarse de la lógica de negocio, autenticación,
  autorización y comunicación con la base de datos.

* La base de datos DEBE almacenar la información necesaria para el
  funcionamiento del sistema.

* La lógica de negocio NO DEBE concentrarse directamente en los componentes
  de la interfaz.

* El backend DEBE organizarse de manera modular, separando rutas,
  controladores, modelos, servicios, middlewares y utilidades.

* El reconocimiento facial y el control de acceso DEBEN mantenerse como
  módulos independientes, aunque puedan comunicarse entre ellos.

* Justificación: separar las responsabilidades facilita el mantenimiento,
  las pruebas y futuras modificaciones del sistema.

### III. Stack Tecnológico y Base de Datos Local (NO NEGOCIABLE)

* Frontend: React con JavaScript.

* Backend: Node.js con Express y JavaScript.

* Base de datos: **MySQL**, ejecutada de forma **LOCAL** durante el desarrollo
  y demostración del MVP.

* El backend DEBE utilizar un driver, query builder u ORM compatible con
  MySQL para realizar las operaciones de persistencia.

* La comunicación entre frontend y backend DEBE realizarse mediante una API REST.

* La autenticación DEBE utilizar JWT.

* Las contraseñas DEBEN almacenarse utilizando un algoritmo de hash seguro
  como bcrypt.

* El reconocimiento facial DEBE utilizar una tecnología compatible con
  aplicaciones web y JavaScript.

* NO se deben agregar tecnologías o dependencias innecesarias.

* Toda dependencia nueva DEBE justificarse antes de incorporarse al proyecto.

* La base de datos local DEBE poder reconstruirse a partir de scripts SQL
  versionados.

* La conexión a MySQL DEBE configurarse mediante variables de entorno.

* Las credenciales de MySQL NO deben escribirse directamente en el código.

* El sistema DEBE utilizar un usuario de MySQL dedicado para la aplicación
  y NO depender del usuario `root` en el funcionamiento normal.

* Se DEBE utilizar InnoDB para las tablas que requieran relaciones y llaves
  foráneas.

* La base de datos DEBE utilizar `utf8mb4` para soportar correctamente
  caracteres especiales.

* El frontend NUNCA debe conectarse directamente a MySQL.

* Únicamente el backend DEBE tener acceso a la base de datos.

* Justificación: MySQL permite manejar de forma estructurada la información
  relacionada con clientes, membresías y pagos, además de ser adecuado para
  una instalación local durante el desarrollo académico.

### IV. Base de Datos y Persistencia (NO NEGOCIABLE)

La base de datos del sistema DEBE utilizar un modelo relacional.

Las entidades principales del MVP serán representadas mediante las siguientes
tablas:

#### Información principal

* `usuarios`
* `clientes`
* `tipos_membresia`
* `membresias`
* `pagos`

#### Reconocimiento, acceso y seguridad

* `rostros`
* `accesos`
* `auditoria`

Las relaciones principales serán:

* Un usuario puede realizar diferentes acciones dentro del sistema.
* Un cliente puede tener diferentes membresías a lo largo del tiempo.
* Un tipo de membresía puede estar relacionado con diferentes membresías.
* Un cliente puede realizar diferentes pagos.
* Una membresía puede tener diferentes pagos.
* Un cliente puede tener información facial registrada.
* Un cliente puede tener múltiples registros de acceso.
* Un usuario puede generar múltiples registros de auditoría.

Las relaciones DEBEN utilizar llaves primarias y llaves foráneas cuando
corresponda.

La base de datos DEBE mantener la integridad referencial.

Los registros importantes, como pagos y accesos, NO deben eliminarse de
manera ordinaria si forman parte del historial del sistema.

Los cambios realizados en la estructura de la base de datos DEBEN quedar
documentados mediante scripts SQL.

La estructura recomendada del directorio de base de datos es:

```text
database/
├── migrations/
├── seeds/
├── scripts/
└── README.md
```

Los archivos físicos de la base de datos NO deben subirse al repositorio.

El archivo `.env` DEBE estar incluido en `.gitignore`.

DEBE existir un `.env.example` sin credenciales reales.

Justificación: el modelo relacional permite mantener relaciones claras entre
clientes, membresías, pagos y accesos, además de facilitar la integridad de
la información.

### V. Seguridad y Protección de Información (NO NEGOCIABLE)

* Las contraseñas NUNCA deben almacenarse en texto plano.

* Los secretos, contraseñas y credenciales DEBEN manejarse mediante variables
  de entorno.

* El archivo `.env` NO debe subirse al repositorio.

* DEBE existir un archivo `.env.example` sin información sensible.

* Los permisos de cada rol DEBEN validarse desde el backend.

* Ocultar una opción en la interfaz NO debe considerarse una medida suficiente
  de seguridad.

* Las entradas proporcionadas por los usuarios DEBEN validarse en el backend.

* El sistema NO debe mostrar información técnica interna ni errores que puedan
  comprometer la seguridad.

* La información relacionada con reconocimiento facial DEBE tratarse como
  información sensible.

* Los datos biométricos DEBEN almacenarse y protegerse de acuerdo con las
  necesidades del proyecto.

* Justificación: el sistema maneja información personal, financiera y
  biométrica de los clientes.

### VI. Roles y Permisos

El sistema DEBE manejar diferentes niveles de acceso.

#### Administrador

DEBE tener acceso a:

* Clientes.
* Membresías.
* Pagos.
* Control financiero.
* Reconocimiento facial.
* Control de acceso.
* Usuarios y roles.
* Dashboard.
* Reportes.
* Auditoría.

#### Recepcionista

DEBE poder:

* Registrar clientes.
* Modificar información de clientes.
* Registrar pagos.
* Renovar membresías.
* Consultar membresías.
* Registrar información facial.
* Consultar accesos.

NO debe modificar configuraciones administrativas que correspondan al
administrador.

#### Entrenador

DEBE poder:

* Consultar clientes.
* Consultar información básica.
* Consultar estado de membresías.
* Consultar asistencia o accesos.

NO debe tener acceso a información financiera administrativa.

#### Cliente

DEBE poder:

* Consultar su información personal.
* Consultar su membresía.
* Consultar sus pagos.
* Consultar adeudos.
* Consultar su historial de accesos.

El cliente NO debe poder consultar información de otros clientes.

Justificación: la separación de roles evita accesos innecesarios y protege
la información de los usuarios.

### VII. Integridad de las Reglas de Negocio (NO NEGOCIABLE)

* Un cliente DEBE estar registrado antes de poder asignarle una membresía.

* Una membresía DEBE estar relacionada con un cliente y con un tipo de
  membresía válido.

* Una membresía DEBE tener una fecha de inicio y una fecha de vencimiento.

* El sistema DEBE identificar si una membresía está activa, vencida,
  suspendida o cancelada.

* Un pago DEBE estar relacionado con un cliente y, cuando corresponda, con
  una membresía.

* El sistema DEBE conservar el historial de pagos.

* Un cliente con membresía vencida NO debe recibir acceso como cliente activo.

* El reconocimiento facial DEBE identificar al cliente antes de validar su
  acceso.

* El acceso DEBE registrarse independientemente de si fue autorizado o
  rechazado.

* Cuando un acceso sea rechazado, DEBE registrarse el motivo correspondiente.

* Un registro de acceso NO debe eliminarse de manera ordinaria.

* La información financiera NO debe eliminarse sin autorización.

* Justificación: estas reglas mantienen la consistencia de la información y
  permiten conocer el historial real de clientes, pagos y accesos.

### VIII. Reconocimiento Facial y Control de Acceso

* El reconocimiento facial DEBE utilizarse únicamente para identificar y
  validar el acceso de clientes registrados.

* Un cliente DEBE tener previamente registrada su información facial para
  utilizar esta función.

* El sistema DEBE comprobar que el cliente identificado tenga una membresía
  válida antes de autorizar su entrada.

* Si la membresía está vencida, suspendida o no existe, el acceso DEBE ser
  rechazado.

* Todo intento de acceso DEBE generar un registro.

* El sistema DEBE indicar si el acceso fue autorizado o rechazado.

* El reconocimiento facial NO debe utilizarse para realizar vigilancia,
  seguimiento o funciones diferentes a las definidas en el proyecto.

* El funcionamiento del reconocimiento facial dependerá de factores como
  cámara, iluminación y condiciones del entorno.

* Justificación: el reconocimiento facial es una de las funciones principales
  del sistema y debe utilizarse únicamente para el propósito establecido.

### IX. API y Manejo de Errores

* Las rutas de la API DEBEN mantener una estructura consistente.

* Las respuestas DEBEN utilizar formato JSON.

* DEBEN utilizarse códigos HTTP apropiados.

* DEBE existir middleware de autenticación.

* DEBE existir middleware de autorización para validar los roles.

* Los datos recibidos por la API DEBEN validarse antes de procesarse.

* El manejo de errores DEBE estar centralizado.

* Los mensajes de error DEBEN ser claros para el usuario sin revelar
  información interna del sistema.

### X. Pruebas

* Las funciones principales DEBEN probarse antes de considerarse terminadas.

* Las pruebas DEBEN incluir como mínimo:

  * Registro y modificación de clientes.
  * Registro y renovación de membresías.
  * Registro de pagos.
  * Consulta de adeudos.
  * Autenticación.
  * Validación de roles.
  * Reconocimiento facial.
  * Autorización y rechazo de accesos.
  * Registro de accesos.
  * Dashboard.
  * Reportes.

* Una funcionalidad NO debe considerarse terminada únicamente porque la
  interfaz visual exista.

* Cuando una funcionalidad dependa del backend y la base de datos, DEBE
  comprobarse su funcionamiento de extremo a extremo.

### XI. UX/UI Profesional y Sencilla

* La interfaz DEBE ser clara, sencilla y fácil de utilizar.

* El diseño DEBE mantener una apariencia consistente.

* Las acciones principales DEBEN ser fáciles de identificar.

* Las operaciones de eliminación DEBEN solicitar confirmación.

* El sistema DEBE mostrar mensajes de éxito o error.

* Los estados de las membresías y accesos DEBEN mostrarse de forma clara.

* Los elementos visuales DEBEN utilizarse para facilitar la interpretación
  de la información.

## Tecnologías y Dependencias

* Frontend: React.
* Lenguaje: JavaScript.
* Backend: Node.js.
* Framework: Express.js.
* Base de datos: **MySQL local**.
* Autenticación: JWT.
* Hash de contraseñas: bcrypt.
* API: REST.
* Reconocimiento facial: librería compatible con JavaScript.
* Control de versiones: Git y GitHub.

Para el acceso a MySQL se podrá utilizar un driver, query builder u ORM,
siempre que sea compatible con el proyecto.

Se deberán priorizar herramientas gratuitas o de bajo costo.

NO se deberán agregar librerías o tecnologías innecesarias.

Toda dependencia nueva DEBE justificarse antes de incorporarse al proyecto.

## Flujo de Desarrollo

Para implementar cada sprint, el equipo DEBE:

1. Revisar los requisitos y el alcance.
2. Revisar las historias de usuario.
3. Identificar las funcionalidades pendientes.
4. Definir las tareas del sprint.
5. Implementar únicamente el alcance acordado.
6. Realizar pruebas.
7. Corregir errores.
8. Integrar los cambios.
9. Actualizar la documentación cuando sea necesario.

Una funcionalidad se considera terminada cuando:

* Está implementada.
* Está integrada con el backend.
* Los datos se almacenan y consultan correctamente.
* Se validan permisos.
* Se validan datos de entrada.
* Se manejan errores previsibles.
* Se realizó una prueba funcional.
* No contiene información sensible.
* No afecta funcionalidades existentes.

Las ramas del proyecto DEBEN utilizar nombres relacionados con la funcionalidad,
por ejemplo:

`feature/clientes`

`feature/membresias`

`feature/pagos`

`feature/reconocimiento-facial`

`fix/error-acceso`

Los commits DEBEN ser pequeños y describir claramente el cambio realizado.

## Decisiones Pendientes

Estas decisiones podrán definirse durante el desarrollo, pero DEBEN ser
aprobadas por el equipo:

* Driver, query builder u ORM para MySQL.
* Librería específica para reconocimiento facial.
* Librería de componentes para React.
* Estrategia de manejo de estado.
* Estrategia de pruebas.
* Forma de almacenar los datos faciales.
* Método de generación de reportes.
* Diseño final del dashboard.
* Método de despliegue, si se requiere una demostración en línea.

## Gobernanza

* Esta constitución tiene prioridad sobre las decisiones de desarrollo que
  contradigan los principios establecidos.

* Cualquier modificación importante al alcance, arquitectura, tecnologías,
  roles o reglas de negocio DEBE ser aprobada por el equipo.

* Las modificaciones relevantes DEBEN quedar documentadas.

* La constitución DEBE mantener un control de versiones.

* Los cambios de versión seguirán el siguiente criterio:

  * **MAJOR:** cambio o eliminación de un principio importante.
  * **MINOR:** incorporación de nuevos principios o secciones.
  * **PATCH:** correcciones, aclaraciones o cambios menores de redacción.

* El cumplimiento de estas reglas DEBE revisarse durante cada sprint.

* Cualquier desviación DEBE justificarse y ser conocida por el equipo.

**Versión:** 1.1.0
**Redactada:** 2026-10-06
**Ratificación:** pendiente del equipo
**Última enmienda:** 2026-10-06
