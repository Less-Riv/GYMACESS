# Especificación de la Funcionalidad: Sprint 4 - Reportes básicos y cierre del MVP

**Rama de la funcionalidad**: `sprint-4-reportes`

**Creada**: 2026-11-04

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Usa la descripción de docs/sprint-4.md"

## Alcance heredado y no reabierto

Este sprint parte de la base entregada en `specs/001-base-usuarios-clientes` (Sprint 1),
`specs/002-membresias-pagos-acceso-facial` (Sprint 2) y
`specs/003-entrenadores-rutinas-dashboard` (Sprint 3), que ya entregaron: inicio de sesión con
JWT, roles y permisos validados en backend, gestión de usuarios, registro/consulta/modificación
de clientes, tipos de membresía, membresías y sus estados, pagos y adeudos, información facial,
identificación, control de acceso con registro de accesos, auditoría funcional, gestión de
entrenadores, asignaciones, rutinas, objetivos, progresos, vista propia del cliente, consulta de
la carga del personal y dashboard administrativo.

Esta especificación NO redefine ninguna de esas funcionalidades; solo las utiliza como
dependencia. Lo nuevo en este sprint es: la generación de reportes de clientes, membresías,
pagos y adeudos y accesos; los filtros por periodo y estado; la paginación de los listados; la
exportación de cada reporte a un archivo; el registro de auditoría de la generación y la
exportación; y el cierre y verificación integral del MVP.

Conforme a `docs/sprint-4.md` §1, la implementación de este sprint está condicionada a que el
Sprint 3 esté verificado con una base de datos real: migración 003 aplicada, pruebas de
integración ejecutándose sin omitirse y sin pruebas fallidas o canceladas. Esta verificación es
un prerrequisito y no forma parte del alcance nuevo del sprint.

Fuera de este sprint quedan, conforme a `docs/sprint-4.md` §8: reportes avanzados, análisis
predictivo o inteligencia de negocio, gráficos complejos o paneles personalizables, programación
automática o envío de reportes por correo, reportes de rutinas/objetivos/progresos de
entrenamiento, clases grupales, reservas o asistencia a sesiones grupales, notificaciones por
correo/SMS/mensajería, aplicación móvil, gestión de múltiples sucursales, nómina e inventario,
contabilidad completa y facturación electrónica, procesamiento directo de pagos mediante bancos o
plataformas externas y vigilancia mediante reconocimiento facial.

## Clarifications

### Sesión 2026-11-04

- Q: ¿En qué formato se exportan los reportes? (FR-022) → A: En formato PDF, listo para imprimir y
  compartir. La dependencia que se incorpore para generarlo debe justificarse antes de
  integrarse al proyecto (FR-045) y su elección corresponde a `/speckit.plan`.
- Q: ¿Cuántos días antes del vencimiento una membresía se considera "próxima a vencer"? (FR-007)
  → A: 7 días antes de la fecha de vencimiento.
- Q: ¿Cómo se comporta la exportación cuando el conjunto filtrado es muy grande? (FR-019) → A: Se
  limita la exportación e se informa al administrador de forma explícita de que el archivo
  contiene solo una parte del conjunto filtrado y de cuál es el límite aplicado.
- Q: ¿Sobre qué membresía se calcula el adeudo de cada cliente en el reporte de adeudos? (FR-011)
  → A: Sobre su última membresía registrada, aunque esté vencida o cancelada. El reporte marca el
  estado de esa membresía y descuenta los pagos completados del cliente.
- Q: ¿Debe el reporte de adeudos mostrar la misma cifra que la pantalla de consulta de adeudos que
  ya existe del Sprint 2? (FR-011) → A: No. El reporte aplica la decisión anterior sin cambios; la
  pantalla del Sprint 2 no se modifica (FR-043) y la diferencia entre ambas cifras queda
  documentada para que el administrador distinga el origen de cada monto.
- Q: ¿El reporte de clientes debe poder filtrarse por periodo de fecha, igual que los reportes de
  pagos, accesos y membresías? (FR-012) → A: Sí. Se amplía FR-012 y RN-27 para incluir el reporte
  de clientes, y el filtro por periodo se aplica sobre su fecha de registro. La redacción
  provisional de RN-27 en `docs/sprint-4.md` §6 mencionaba solo pagos, accesos y membresías, por lo
  que ese documento debe actualizarse para que coincidan con la regla (FR-030, principio I).
- Q: ¿Los tres grupos del reporte de membresías deben ser excluyentes entre sí y dónde quedan las
  membresías suspendidas y canceladas? (FR-007) → A: Sí, son disjuntos y las suspendidas o
  canceladas forman un cuarto grupo con total propio. La ventana de 7 días de "próxima a vencer" se
  evalúa contra la fecha de hoy, con independencia del periodo filtrado. La suma de los cuatro
  totales coincide con el total de membresías del filtro.
- Q: ¿Qué reportes deben admitir un filtro por estado y con qué valores? (FR-013) → A: Cada reporte
  filtra por el estado de su propio dato, con los valores que ya define el esquema: clientes
  (`activo`, `inactivo`), membresías (`activo`, `vencida`, `suspendida`, `cancelada`) y accesos
  (`autorizado`, `rechazado`). El reporte de pagos y adeudos se filtra solo por periodo. Un valor
  no previsto en el listado se rechaza con error de validación.
- Q: ¿Qué pagos cuentan como ingreso en el reporte de pagos, y el adeudo descuenta el mismo
  conjunto? (FR-008) → A: Solo los pagos en estado `completado`, tanto en el total de ingresos
  como en el descuento del adeudo, de modo que las dos cifras cuadran entre sí. Los pagos que no
  estén en ese estado no se listan, no se contabilizan como ingreso y no se descuentan del adeudo.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Reporte de clientes (Prioridad: P1) [US-S4-01]

Como administrador, quiero generar un reporte de clientes para conocer cuántos hay, su estado y
su situación general.

**Por qué esta prioridad**: es el reporte más simple y el que no depende de ningún otro módulo
para interpretarse. Sirve de referencia para fijar el formato de salida, los totales y la
paginación que repiten el resto de reportes, por lo que conviene resolverlo primero.

**Prueba independiente**: iniciar sesión como administrador, generar el reporte de clientes y
verificar que presenta el total de clientes y el desglose por estado con cifras que coinciden
con los clientes registrados.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y un conjunto de clientes registrados en distintos
   estados, **Cuando** genera el reporte de clientes, **Entonces** el sistema devuelve el total
   de clientes y el desglose por estado, con cifras que coinciden con los datos registrados.
2. **Dado** un administrador autenticado, **Cuando** genera el reporte de clientes con un filtro
   de periodo o estado, **Entonces** el listado y los totales corresponden únicamente a los
   clientes que cumplen ese filtro.
3. **Dado** un administrador autenticado, **Cuando** genera el reporte de clientes sin filtros,
   **Entonces** el listado aparece paginado y la paginación permite recorrer la totalidad de los
   clientes sin perder ni duplicar registros.
4. **Dado** un filtro que no corresponde a ningún cliente, **Cuando** el administrador genera el
   reporte, **Entonces** el sistema muestra un resultado vacío con un mensaje claro y no un error.
5. **Dado** un usuario con rol recepcionista, entrenador o cliente, **Cuando** intenta generar el
   reporte de clientes, **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Historia de usuario 2 - Reporte de membresías (Prioridad: P1) [US-S4-02]

Como administrador, quiero generar un reporte de membresías activas, vencidas y próximas a
vencer para planear renovaciones.

**Por qué esta prioridad**: opera sobre el estado de las membresías, que es la información que
determina quién puede acceder al gimnasio. Es la base operativa de las renovaciones y alimenta
el reporte de adeudos.

**Prueba independiente**: iniciar sesión como administrador, generar el reporte de membresías y
verificar que separa activas, vencidas y próximas a vencer, y que el total por categoría coincide
con las membresías registradas.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y membresías en distintos estados, **Cuando** genera el
   reporte de membresías, **Entonces** el sistema devuelve los totales y el detalle de los cuatro
   grupos disjuntos (activas, próximas a vencer, vencidas y suspendidas o canceladas), y la suma
   de esos cuatro totales coincide con el total de membresías del filtro.
2. **Dado** un administrador autenticado, **Cuando** aplica un filtro de periodo al reporte de
   membresías, **Entonces** solo se incluyen las membresías cuyo periodo de vigencia se
   corresponde con el filtro aplicado.
3. **Dado** un administrador autenticado, **Cuando** genera el reporte de membresías, **Entonces**
   el listado aparece paginado y la paginación permite recorrer la totalidad de las membresías
   del filtro.
4. **Dado** un filtro de periodo sin membresías, **Cuando** el administrador genera el reporte,
   **Entonces** el sistema muestra un resultado vacío con un mensaje claro y no un error.
5. **Dado** un usuario con rol recepcionista, entrenador o cliente, **Cuando** intenta generar el
   reporte de membresías, **Entonces** el sistema rechaza la solicitud con código HTTP 403.

---

### Historia de usuario 3 - Reporte de pagos y adeudos (Prioridad: P1) [US-S4-03]

Como administrador, quiero generar un reporte de pagos e ingresos por periodo y de adeudos
pendientes para controlar la parte económica del gimnasio.

**Por qué esta prioridad**: es la parte económica del gimnasio y la que más depende de que los
totales sean correctos. Requiere que el cálculo de adeudo se comporte exactamente igual que en
el Sprint 2 para no generar contradicciones entre módulos.

**Prueba independiente**: iniciar sesión como administrador, generar el reporte de pagos por
periodo y el reporte de adeudos por cliente, y verificar que los ingresos sumados y los adeudos
calculados coinciden con los pagos y las membresías registradas.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y pagos registrados en varios periodos, **Cuando**
   genera el reporte de pagos por periodo, **Entonces** el sistema devuelve el total de ingresos
   del periodo y el detalle de los pagos que lo componen.
2. **Dado** un administrador autenticado y clientes con membresías pagadas a medias o sin
   pagos, **Cuando** genera el reporte de adeudos, **Entonces** el adeudo de cada cliente se
   calcula como el precio del tipo de su última membresía registrada menos la suma de sus pagos
   completados, y el reporte indica el estado de esa membresía, con el mismo criterio de fórmula
   que aplica en el Sprint 2 (FR-011).
3. **Dado** un administrador autenticado, **Cuando** genera el reporte de pagos, **Entonces** el
   listado aparece paginado y la paginación permite recorrer la totalidad de los pagos del
   periodo.
4. **Dado** un periodo sin pagos registrados, **Cuando** el administrador genera el reporte,
   **Entonces** el sistema muestra un resultado vacío con un mensaje claro y no un error.
5. **Dado** un administrador autenticado, **Cuando** genera cualquiera de los dos reportes, **Entonces**
   ningún pago, membresía o cliente queda modificado por la operación.

---

### Historia de usuario 4 - Reporte de accesos (Prioridad: P2) [US-S4-04]

Como administrador, quiero generar un reporte de accesos autorizados y rechazados por periodo
para supervisar el uso del gimnasio.

**Por qué esta prioridad**: aporta visibilidad operativa, pero depende de que los accesos ya
registrados por el control de acceso estén completos. Por eso va después de los reportes de
clientes, membresías y pagos, que no dependen de ningún otro módulo.

**Prueba independiente**: iniciar sesión como administrador, generar el reporte de accesos por
periodo y verificar que separa los accesos autorizados de los rechazados y que el total
coincide con los accesos registrados.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y accesos autorizados y rechazados registrados,
   **Cuando** genera el reporte de accesos, **Entonces** el sistema devuelve los totales de
   autorizados y rechazados y el detalle de cada acceso, con el motivo de rechazo cuando
   corresponda.
2. **Dado** un administrador autenticado, **Cuando** aplica un filtro de periodo, **Entonces** solo
   se incluyen los accesos registrados dentro del periodo seleccionado.
3. **Dado** un administrador autenticado, **Cuando** genera el reporte de accesos, **Entonces** el
   listado aparece paginado y la paginación permite recorrer la totalidad de los accesos del
   periodo.
4. **Dado** un periodo sin accesos registrados, **Cuando** el administrador genera el reporte,
   **Entonces** el sistema muestra un resultado vacío con un mensaje claro y no un error.
5. **Dado** un administrador autenticado, **Cuando** genera el reporte de accesos, **Entonces**
   ningún acceso queda modificado ni eliminado por la operación.

---

### Historia de usuario 5 - Exportación de reportes (Prioridad: P2) [US-S4-05]

Como administrador, quiero exportar un reporte a un archivo para guardarlo, imprimirlo o
compartirlo.

**Por qué esta prioridad**: la exportación es lo que convierte al reporte en un entregable
utilizable fuera del sistema, pero no aporta información nueva: solo materializa en un archivo
lo que ya se ve en pantalla. Por eso se implementa una vez estabilizado el contenido de los
reportes.

**Prueba independiente**: iniciar sesión como administrador, generar un reporte con un filtro
concreto, exportarlo y verificar que el archivo obtenido contiene exactamente los mismos datos
y bajo el mismo filtro que los mostrados en pantalla.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y un reporte generado con un filtro determinado,
   **Cuando** exporta ese reporte, **Entonces** el sistema genera un archivo con exactamente los
   mismos datos y el mismo filtro que los mostrados en pantalla.
2. **Dado** un administrador autenticado, **Cuando** exporta un reporte cuyos datos incluyen
   acentos y caracteres especiales, **Entonces** el archivo generado se abre correctamente y
   muestra esos caracteres sin alteración.
3. **Dado** un administrador autenticado, **Cuando** exporta cualquier reporte, **Entonces** el
   archivo no contiene contraseñas, tokens ni datos biométricos.
4. **Dado** un usuario con rol recepcionista, entrenador o cliente, **Cuando** intenta exportar
   un reporte, **Entonces** el sistema rechaza la solicitud con código HTTP 403.
5. **Dado** un administrador autenticado, **Cuando** exporta un reporte, **Entonces** la
   exportación no modifica ningún dato de clientes, membresías, pagos ni accesos.

---

### Historia de usuario 6 - Auditoría de reportes (Prioridad: P3) [US-S4-06]

Como administrador, quiero que el sistema registre quién generó o exportó un reporte para
mantener trazabilidad.

**Por qué esta prioridad**: la trazabilidad es una garantía de rendición de cuentas sobre un
módulo que expone información financiera y de uso del gimnasio. Es importante, pero no bloquea
la operación diaria del administrador ni la entrega de los reportes.

**Prueba independiente**: iniciar sesión como administrador, generar y exportar un reporte,
consultar la auditoría y verificar que aparecen los dos registros con el usuario que los
ejecutó y los datos de la operación.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** genera un reporte, **Entonces** queda
   registrado en la auditoría quién lo generó, en qué módulo, con qué fecha, con qué resultado y
   con qué descripción.
2. **Dado** un administrador autenticado, **Cuando** exporta un reporte, **Entonces** queda
   registrado en la auditoría quién lo exportó, en qué módulo, con qué fecha, con qué resultado y
   con qué descripción.
3. **Dado** un administrador autenticado, **Cuando** consulta la auditoría, **Entonces** puede
   distinguir las operaciones de generación de las de exportación, e identificar el reporte y los
   filtros con los que se produjo cada una.
4. **Dado** un usuario con rol recepcionista, entrenador o cliente, **Cuando** intenta consultar
   los registros de auditoría de reportes, **Entonces** el sistema rechaza la solicitud con
   código HTTP 403.
5. **Dado** una generación o exportación rechazada por falta de permisos, **Cuando** se consulta la
   auditoría, **Entonces** el intento queda registrado con el resultado correspondiente.

---

### Historia de usuario 7 - Cierre y calidad del MVP (Prioridad: P3) [US-S4-07]

Como equipo, queremos verificar y documentar todo el MVP para entregar un sistema estable y
coherente con la documentación.

**Por qué esta prioridad**: no aporta una función nueva al usuario final, pero condiciona la
entrega del proyecto completo. Se ejecuta al final del sprint, una vez que las historias
anteriores están implementadas y probadas, y es la que cierra los criterios de cierre del MVP.

**Prueba independiente**: recorrer de punta a punta los flujos principales de los cuatro sprints
sobre una base de datos real, ejecutar la suite completa de pruebas y verificar que la
documentación del proyecto coincide con el sistema entregado.

**Escenarios de aceptación**:

1. **Dado** el Sprint 3 verificado con migración aplicada y pruebas sin omitirse, **Cuando** se
   ejecuta la suite completa de pruebas del backend, **Entonces** termina sin fallos, sin
   cancelaciones y sin omisiones.
2. **Dado** los flujos principales de los cuatro sprints, **Cuando** se validan de punta a punta
   contra una base de datos real, **Entonces** todos se completan sin errores y quedan registrados.
3. **Dado** defectos detectados al verificar el Sprint 3, **Cuando** se revisan, **Entonces** cada
   uno queda corregido o bien documentado de forma explícita con su motivo.
4. **Dado** las reglas de negocio de los Sprints 3 y 4, **Cuando** se revisa la documentación,
   **Entonces** `docs/project-context.md` las incorpora en su sección de reglas de negocio y
   `docs/reglas.md` refleja el número real de sprints.
5. **Dado** las pantallas entregadas, **Cuando** se revisa su diseño y navegación, **Entonces**
   mantienen una apariencia consistente con las pantallas existentes y muestran mensajes claros
   de éxito y de error.
6. **Dado** el reporte de pruebas del proyecto, **Cuando** se revisa, **Entonces** está
   actualizado con los resultados reales de la última ejecución.

---

### Casos límite

- ¿Qué ocurre cuando el filtro de periodo no contiene ningún dato? → Se muestra un resultado
  vacío con un mensaje claro, no un error (FR-015).
- ¿Qué ocurre cuando la fecha inicial del periodo es posterior a la fecha final? → Se rechaza la
  petición con un error de validación y no se ejecuta ninguna consulta (FR-016).
- ¿Qué ocurre cuando el total del reporte no coincide con los datos de origen? → La verificación
  automatizada lo detecta; el sistema NO debe presentar totales calculados de forma distinta a
  la suma de sus propias filas (FR-017).
- ¿Qué ocurre cuando se exporta un reporte con un filtro que no devuelve filas? → El archivo se
  genera con el mismo resultado vacío y su mensaje, o se informa que no hay nada que exportar
  (FR-018, FR-019).
- ¿Qué ocurre cuando el archivo exportado contiene acentos, eñes o caracteres especiales? → El
  archivo PDF se abre correctamente y los caracteres se conservan (FR-021).
- ¿Qué ocurre cuando el conjunto filtrado de un reporte es muy grande? → La exportación se limita
  al máximo de filas exportables y se informa al administrador, de forma explícita y visible, de
  que el archivo contiene solo una parte del conjunto filtrado y de cuál es el límite aplicado
  (FR-019).
- ¿Qué ocurre cuando el administrador cambia el periodo después de haber cargado un reporte? → El
  listado y los totales se recalculan con el nuevo filtro y se descarta la página anterior.
- ¿Qué ocurre cuando se generan dos reportes con el mismo filtro de forma consecutiva? → Cada
  generación produce su propio registro de auditoría y ninguna interfiere con la otra.
- ¿Qué ocurre cuando el filtro por estado recibe un valor que no existe en el esquema? → Se
  rechaza la solicitud con un error de validación, en lugar de devolver una lista vacía (FR-013).
- ¿Qué ocurre cuando una membresía figura en estado `activo` pero su fecha de vencimiento ya
  pasó? → Se cuenta como vencida, porque el grupo se decide por el estado y por la fecha de
  vencimiento (FR-007).
- ¿Qué ocurre cuando una membresía tiene estado `suspendida` o `cancelada`? → Forma el cuarto
  grupo del reporte, con su propio total, y no se cuenta en ninguna de las otras tres categorías
  (FR-007).
- ¿Qué ocurre cuando un cliente tiene varias membresías y la última registrada está vencida o
  cancelada? → El adeudo se calcula sobre el precio del tipo de esa membresía y el reporte muestra
  su estado, de modo que el administrador distingue una deuda vigente de una deuda caducada
  (FR-011).
- ¿Qué ocurre cuando un pago no está en estado `completado`? → No se lista en el reporte de
  pagos, no se contabiliza como ingreso y no se descuenta del adeudo (FR-008, FR-011).
- ¿Qué ocurre cuando un cliente no tiene ningún pago registrado? → Su adeudo corresponde al
  precio completo de su tipo de membresía (FR-011).
- ¿Qué ocurre cuando un acceso fue rechazado? → El reporte muestra el resultado y el motivo de
  rechazo registrado (FR-010).
- ¿Qué ocurre cuando una petición llega sin token o con un token caducado? → El sistema responde
  que se requiere autenticación, sin revelar información interna (FR-002).
- ¿Qué ocurre cuando un usuario no administrador oculta la pantalla de reportes? → El bloqueo se
  mantiene en el servidor: el acceso directo a la funcionalidad es rechazado (FR-001, FR-035).
- ¿Qué ocurre con los datos biométricos al generar o exportar un reporte? → No aparecen en la
  respuesta ni en el archivo exportado (FR-004, FR-020, FR-040).

## Reglas de negocio añadidas por este sprint

Estas reglas continúan la numeración del proyecto y se incorporan a `docs/project-context.md` §12
como RN-25 a RN-34, conforme a `docs/sprint-4.md` §6. Su redacción provisional es:

- **RN-25**: Solo el administrador puede generar, consultar y exportar reportes.
- **RN-26**: Los reportes son de solo lectura y no modifican ningún dato.
- **RN-27**: Los reportes de clientes, pagos, accesos y membresías deben poder filtrarse por periodo.
- **RN-28**: Los listados de un reporte deben estar paginados.
- **RN-29**: La exportación debe reflejar exactamente los mismos datos y filtros que el reporte
  mostrado en pantalla. Si el conjunto filtrado excede el límite de filas exportables, la
  exportación se limita y el administrador recibe el aviso explícito de que el archivo contiene
  solo una parte del conjunto filtrado.
- **RN-30**: Los reportes no deben incluir contraseñas, tokens ni datos biométricos.
- **RN-31**: El adeudo se calcula como el precio del tipo de membresía menos la suma de pagos,
  igual que en el Sprint 2. En el reporte de adeudos del Sprint 4, el precio se toma de la última
  membresía registrada del cliente, sea cual sea su estado, se descuentan solo los pagos
  completados y el reporte indica ese estado.
- **RN-32**: Los pagos y los accesos son historial y no se modifican ni se eliminan desde los
  reportes.
- **RN-33**: Si no hay datos para el filtro elegido, el reporte debe mostrar un resultado vacío
  con un mensaje claro y no un error.
- **RN-34**: La generación y la exportación de un reporte deben quedar registradas en la
  auditoría.

## Requisitos *(obligatorio)*

### Requisitos funcionales

#### Acceso y permisos

- **FR-001**: El sistema DEBE permitir únicamente al rol administrador generar, consultar y
  exportar reportes; los roles recepcionista, entrenador y cliente DEBEN recibir respuesta HTTP
  403 en el 100% de los intentos (RN-25, principio VI de `docs/reglas.md`).
- **FR-002**: El sistema DEBE responder que se requiere autenticación ante una petición sin token
  válido o con token caducado, sin revelar información técnica interna (principio IX).

#### Naturaleza de los reportes

- **FR-003**: Los reportes DEBEN ser de solo lectura y NO DEBEN modificar clientes, membresías,
  pagos, accesos ni ningún otro dato (RN-26, RN-32).
- **FR-004**: Los reportes NO DEBEN incluir contraseñas, tokens ni datos biométricos en ninguna
  parte de su respuesta (RN-30).
- **FR-005**: El sistema NO DEBE ofrecer, desde los reportes, operaciones de modificación o
  eliminación de pagos, membresías o accesos, por tratarse de historial (RN-32, principio VII).

#### Contenido de los reportes

- **FR-006**: El sistema DEBE ofrecer un reporte de clientes que presente el total de clientes y
  el desglose por estado.
- **FR-007**: El sistema DEBE ofrecer un reporte de membresías que separe sus membresías en
  cuatro grupos disjuntos: activas, próximas a vencer, vencidas y suspendidas o canceladas. Una
  membresía cuenta como activa cuando su estado es `activo` y su fecha de vencimiento está a más
  de 7 días de la fecha de hoy; cuenta como próxima a vencer cuando su estado es `activo` y su
  fecha de vencimiento está dentro de los 7 días siguientes a la fecha de hoy; cuenta como vencida
  cuando su estado es `vencida` o su fecha de vencimiento ya pasó; y el resto se cuenta como
  suspendida o cancelada. La fecha de hoy es la fecha de evaluación de la ventana de 7 días, con
  independencia del periodo filtrado. El reporte DEBE presentar el total y el detalle de cada
  grupo, y la suma de los cuatro totales DEBE coincidir con el total de membresías del filtro.
- **FR-008**: El sistema DEBE ofrecer un reporte de pagos e ingresos por periodo, con el detalle
  de los pagos en estado `completado` del periodo y el total de ingresos del periodo, que DEBE ser
  la suma de los montos de esos pagos. Los pagos que no estén en estado `completado` NO se
  incluyen en el listado ni en el total de ingresos, ni se descuentan del adeudo (FR-011).
- **FR-009**: El sistema DEBE ofrecer un reporte de adeudos pendientes por cliente.
- **FR-010**: El sistema DEBE ofrecer un reporte de accesos por periodo que separe los
  autorizados de los rechazados y muestre el motivo de rechazo cuando exista.
- **FR-011**: El adeudo de cada cliente DEBE calcularse como el precio del tipo de su última
  membresía registrada menos la suma de los pagos completados del cliente, con el mismo criterio
  que aplica en el Sprint 2 (RN-31). El reporte DEBE indicar el estado de esa membresía, de modo
  que se distinga una deuda vigente de una deuda que procede de una membresía vencida o
  cancelada. El saldo pendiente DEBE ser cero cuando la suma de los pagos completados iguala o
  supera ese precio.

#### Filtros, paginación y totales

- **FR-012**: Los reportes de clientes, pagos, accesos y membresías DEBEN poder filtrarse por un
  periodo definido por una fecha inicial y una fecha final (RN-27).
- **FR-013**: El reporte de clientes DEBE poder filtrarse por el estado del cliente (`activo` o
  `inactivo`), el reporte de membresías por el estado de la membresía (`activo`, `vencida`,
  `suspendida` o `cancelada`) y el reporte de accesos por el resultado del acceso (`autorizado` o
  `rechazado`). El reporte de pagos y adeudos NO DEBE admitir filtro por estado. El sistema DEBE
  validar el valor recibido contra el listado anterior y DEBE rechazar con un error de validación
  cualquier valor no previsto, en lugar de devolver una lista vacía.
- **FR-014**: El listado de todo reporte DEBE aparecer paginado y la paginación DEBE permitir
  recorrer la totalidad de los registros del filtro sin omitir ni duplicar filas (RN-28).
- **FR-015**: Cuando el filtro elegido no corresponde a ningún registro, el reporte DEBE mostrar
  un resultado vacío con un mensaje claro y NO DEBE devolver un error (RN-33).
- **FR-016**: Cuando la fecha inicial del periodo sea posterior a la fecha final, el sistema DEBE
  rechazar la solicitud con un error de validación y NO DEBE ejecutar la consulta.
- **FR-017**: Los totales presentados en cada reporte DEBEN coincidir con los datos reales de
  origen y con la suma de las filas del conjunto filtrado completo, con independencia de la
  página que se esté mostrando.

#### Exportación

- **FR-018**: El administrador DEBE poder exportar cada uno de los reportes a un archivo.
- **FR-019**: El archivo exportado DEBE contener los mismos datos y bajo el mismo filtro que el
  reporte mostrado en pantalla (RN-29). Cuando el conjunto filtrado exceda el límite de filas
  exportables, el sistema DEBE limitar la exportación e informar al administrador de forma
  explícita de que el archivo contiene solo una parte del conjunto filtrado y de cuál es el
  límite aplicado.
- **FR-020**: El archivo exportado NO DEBE contener contraseñas, tokens ni datos biométricos
  (RN-30).
- **FR-021**: El archivo exportado DEBE abrirse correctamente y conservar los acentos y
  caracteres especiales de los datos exportados.
- **FR-022**: El formato de exportación DEBE ser PDF, de modo que el archivo esté listo para
  imprimirse y compartirse. La dependencia que se incorpore para generarlo DEBE justificarse
  antes de integrarse al proyecto (FR-045) y su elección corresponde a `/speckit.plan`.

#### Auditoría

- **FR-023**: La generación de un reporte DEBE quedar registrada en la auditoría indicando el
  usuario que la ejecutó, el módulo, la fecha, el resultado y la descripción (RN-34).
- **FR-024**: La exportación de un reporte DEBE quedar registrada en la auditoría indicando el
  usuario que la ejecutó, el módulo, la fecha, el resultado y la descripción (RN-34).
- **FR-025**: Solo el administrador DEBE poder consultar los registros de auditoría de generación
  y exportación de reportes.

#### Calidad, documentación y cierre del MVP

- **FR-026**: El Sprint 3 DEBE estar verificado con migración 003 aplicada y sus pruebas de
  integración ejecutándose sin omitirse, sin fallos y sin cancelaciones, como prerrequisito de
  este sprint (`docs/sprint-4.md` §1).
- **FR-027**: La suite completa de pruebas del backend DEBE ejecutarse sin fallos, sin
  cancelaciones y sin omisiones.
- **FR-028**: Los defectos detectados al verificar el Sprint 3 DEBEN estar corregidos o bien
  documentados de forma explícita con su motivo.
- **FR-029**: DEBE existir una validación de punta a punta de los flujos principales de los
  cuatro sprints, con su resultado registrado.
- **FR-030**: `docs/project-context.md` DEBE incorporar en su sección 12 las reglas de negocio de
  los Sprints 3 y 4 (RN-15 a RN-34) conforme al principio I.
- **FR-031**: `docs/reglas.md` y `docs/project-context.md` DEBEN reflejar el número real de sprints
  del proyecto.
- **FR-032**: Las pantallas del frontend DEBEN mantener un diseño y una navegación consistentes
  con las pantallas existentes y DEBEN mostrar mensajes claros de éxito y de error (principio XI).
- **FR-033**: El reporte de pruebas del proyecto DEBE estar actualizado con los resultados reales
  de la última ejecución.

#### Arquitectura y seguridad

- **FR-034**: El frontend DEBE comunicarse con el backend exclusivamente mediante la API REST
  existente, con JSON, códigos HTTP apropiados y manejo de errores centralizado (principio IX).
- **FR-035**: El frontend NO DEBE conectarse directamente a MySQL; el backend DEBE ser el único
  componente con acceso al motor (principio III).
- **FR-036**: Los permisos de cada rol DEBEN validarse en el backend; ocultar la opción en la
  interfaz NO se considera medida de seguridad suficiente (principio V).
- **FR-037**: El backend DEBE continuar utilizando autenticación JWT y protección de contraseñas
  con bcrypt (principio V).
- **FR-038**: El backend DEBE continuar utilizando ES Modules (`"type": "module"`, `import` y
  `export`); NO DEBE utilizarse `require()` ni `module.exports` (principio III).
- **FR-039**: Todas las consultas contra MySQL DEBEN estar parametrizadas (principio IV).
- **FR-040**: Los datos sensibles DEBEN manejarse mediante variables de entorno y los datos
  biométricos NO DEBEN aparecer en reportes ni en sus exportaciones (principio V).
- **FR-041**: El backend DEBE mantener la separación modular entre rutas, controladores, servicios,
  modelos, validadores y middlewares (principio II).

#### Límites de alcance

- **FR-042**: Este sprint NO DEBE incluir reportes avanzados, análisis predictivo, gráficos
  complejos, paneles personalizables, envío programado de reportes por correo, reportes de rutinas,
  objetivos o progresos de entrenamiento, clases grupales, notificaciones, aplicación móvil,
  múltiples sucursales, nómina, inventario, contabilidad completa, facturación electrónica,
  procesamiento directo de pagos mediante bancos o plataformas externas ni vigilancia mediante
  reconocimiento facial (`docs/sprint-4.md` §8, principio I).
- **FR-043**: Este sprint NO DEBE reimplementar ni modificar el comportamiento ya entregado en los
  Sprints 1, 2 y 3, salvo los ajustes mínimos necesarios para que los reportes consulten sus
  datos y para registrar las acciones de auditoría de RN-34.
- **FR-044**: Si se requiere una migración nueva para ampliar las acciones de auditoría o crear
  vistas, esta DEBE versionarse en `database/migrations/` y documentarse (principio IV). En
  caso contrario, este sprint NO DEBE crear tablas nuevas (`docs/sprint-4.md` §5).
- **FR-045**: Toda dependencia nueva que se incorpore para la exportación DEBE justificarse antes
  de integrarse al proyecto (principio III, `docs/sprint-4.md` §9).

### Entidades clave

- **reporte**: vista de solo lectura que el administrador solicita sobre la información ya
  registrada. Atributos: tipo (clientes, membresías, pagos, adeudos o accesos), filtros
  aplicados (periodo con fecha inicial y fecha final, estado cuando aplique), periodo efectivo,
  totales y subtotales, filas del listado y estado de paginación. Relación: no se almacena; se
  calcula a partir de las entidades de origen. El reporte de pagos y el de adeudos pertenecen a
  la misma historia y se muestran en la misma pantalla, pero son dos reportes distintos
  (US-S4-03).
- **filtro_de_reporte**: conjunto de criterios que delimita el conjunto de datos de un reporte.
  Atributos: fecha inicial, fecha final y estado opcional. Relación: se aplica a un reporte y
  determina a la vez sus filas, sus totales y el contenido de su exportación (FR-012, FR-013).
- **archivo_exportado**: representación descargable de un reporte. Atributos: reporte de origen,
  filtros aplicados, formato y contenido. Relación: corresponde a un reporte y a la exportación
  registrada en la auditoría (FR-018, FR-024).
- **registro_de_auditoria_de_reporte**: entrada de la auditoría que evidencia quién generó o
  exportó un reporte. Atributos: usuario, acción (generar o exportar), módulo, fecha, resultado y
  descripción. Relación: referencia al reporte y al usuario que ejecutó la operación (FR-023,
  FR-024).
- **cliente**: fuente del reporte de clientes y de los adeudos. Atributos: identificador, nombre,
  estado y fecha de registro. Relación: uno a muchos con sus membresías y sus pagos.
- **membresia**: fuente del reporte de membresías y del cálculo de adeudos. Atributos:
  identificador, cliente, tipo de membresía, fecha de inicio, fecha de fin y estado. Relación:
  pertenece a un cliente y a un tipo de membresía.
- **tipo_de_membresia**: fuente del precio de referencia del adeudo. Atributos: identificador,
  nombre, duración y precio. Relación: uno a muchos con sus membresías.
- **pago**: fuente del reporte de pagos y de ingresos. Atributos: identificador, cliente,
  membresía, monto, fecha de pago, método de pago y estado. Relación: pertenece a un cliente y a
  una membresía; es historial y no se modifica ni se elimina desde los reportes (FR-005).
- **acceso**: fuente del reporte de accesos. Atributos: identificador, cliente, fecha, hora,
  resultado y motivo de rechazo. Relación: pertenece a un cliente; es historial y no se modifica
  ni se elimina desde los reportes (FR-005).
- **usuario**: referencia al administrador que genera, exporta o consulta reportes y auditoría.
  Atributos: identificador, nombre, correo, rol y estado. Relación: origen de los registros de
  auditoría de reportes.
- **rostros**: fuente biométrica EXPRESAMENTE excluida de los reportes y de sus exportaciones
  (FR-004, FR-020, FR-040).

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: El administrador genera cada uno de los cinco reportes del sprint en menos de 2
  minutos desde la pantalla de reportes, sin ayuda externa.
- **SC-002**: Los totales del 100% de los reportes verificados coinciden exactamente con los
  datos de origen de la base de datos y con la suma de las filas del conjunto filtrado completo,
  con independencia de la página visible.
- **SC-003**: El 100% de las exportaciones verificadas contienen las mismas filas y el mismo
  filtro que el reporte mostrado en pantalla, sin filas de más ni de menos; y en el 100% de las
  exportaciones que alcanzan el límite de filas exportables, el administrador recibe un aviso
  explícito de que el archivo contiene solo una parte del conjunto filtrado.
- **SC-004**: El 100% de las respuestas y de los archivos exportados revisados están libres de
  contraseñas, tokens y datos biométricos.
- **SC-005**: El 100% de los intentos de generar, consultar o exportar reportes por parte de
  recepcionista, entrenador o cliente reciben respuesta HTTP 403, y el 100% de las peticiones sin
  token válido reciben respuesta de autenticación requerida.
- **SC-006**: El 100% de las peticiones con fecha inicial posterior a la fecha final reciben un
  error de validación, y el 100% de las peticiones cuyo filtro no tiene datos devuelven un
  resultado vacío con mensaje claro y ningún error.
- **SC-007**: El 100% de las generaciones y exportaciones de reportes quedan registradas en la
  auditoría con usuario, módulo, fecha, resultado y descripción, y el 100% de los intentos de
  consulta de esos registros por parte de roles no autorizados reciben HTTP 403.
- **SC-008**: El 100% de los listados de reporte son paginados y el recorrido completo de la
  paginación no omite ni duplica ninguna fila del conjunto filtrado.
- **SC-009**: El 100% de los archivos exportados con acentos o caracteres especiales se abren
  correctamente y conservan esos caracteres.
- **SC-010**: El 100% de los reportes se generan sin modificar ningún registro de clientes,
  membresías, pagos ni accesos, verificado por comparación del estado de la base antes y después
  de la consulta.
- **SC-011**: La suite completa de pruebas del backend del proyecto se ejecuta con 0 fallos, 0
  cancelaciones y 0 omisiones.
- **SC-012**: El flujo completo del sprint (generar un reporte, filtrarlo, recorrer su paginación,
  exportarlo y verificar su registro de auditoría) se ejecuta de extremo a punta sin errores en
  el entorno de desarrollo, y los flujos principales de los cuatro sprints quedan validados de
  punta a punta con su resultado registrado.
- **SC-013**: La documentación del proyecto queda actualizada: `docs/project-context.md` incluye
  las reglas RN-15 a RN-34, `docs/reglas.md` y `docs/project-context.md` reflejan el número real
  de sprints, y el reporte de pruebas del proyecto refleja los resultados reales de la última
  ejecución.
- **SC-014**: Los cuatro totales del reporte de membresías son disjuntos y su suma coincide con el
  total de membresías del filtro en el 100% de las verificaciones, sin que ninguna membresía se
  cuente en dos categorías (FR-007).
- **SC-015**: El 100% de las peticiones con un valor de estado no previsto en el esquema se
  rechazan con un error de validación y ninguna devuelve una lista vacía sin avisar (FR-013).
- **SC-016**: El total de ingresos de un periodo y el saldo pendiente del adeudo se calculan
  sobre el mismo conjunto de pagos, de modo que en el 100% de las verificaciones ningún pago se
  contabiliza como ingreso y descuenta el adeudo a la vez, ni a la inversa (FR-008, FR-011).

## Supuestos

- Los usuarios, roles, permisos, autenticación JWT, clientes, membresías, tipos de membresía,
  pagos, adeudos, información facial, control de acceso, auditoria, entrenadores, asignaciones,
  rutinas, objetivos, progresos, dashboard y consulta de personal entregados en los Sprints 1, 2
  y 3 permanecen vigentes y no se redefinen aquí (FR-043).
- La sección de reportes del Sprint 4 no requiere tablas nuevas: los reportes se alimentan de
  consultas o vistas sobre las tablas existentes. Solo se crea una migración `004_...` si hace
  falta ampliar las acciones de auditoría o crear vistas, y en ese caso se versiona en
  `database/migrations/` (FR-044).
- El Sprint 3 se considera verificado cuando la migración 003 está aplicada en la base local y en
  la base de pruebas, la suite del backend se ejecuta sin fallos, cancelaciones ni omisiones y los
  defectos detectados están corregidos o documentados (FR-026, FR-028).
- Los reportes son de solo lectura por definición del alcance; ninguna consulta de reporte
  escribe en la base de datos, ni siquiera para registrar métricas de uso (FR-003).
- El cálculo de adeudo reutiliza el criterio ya implementado en el Sprint 2, de modo que el
  reporte de adeudos y la consulta de adeudos del cliente muestran siempre la misma fórmula
  (FR-011, RN-31).
- «Última membresía registrada» significa la membresía con la fecha de inicio más reciente y, a
  igualdad de fecha, la de identificador más alto, de modo que el cálculo sea determinista y
  verificable en las pruebas (FR-011).
- El reporte de adeudos del Sprint 4 NO replica el filtro de membresía activa de la consulta de
  adeudos del Sprint 2 (`backend/src/models/pago.model.js`): el reporte incluye a los clientes
  cuya última membresía registrada está vencida o cancelada, mientras que la pantalla existente
  solo incluye a los que tienen membresía activa. Tampoco replica que esa consulta sume todos
  los pagos sin mirar su estado: el reporte solo descuenta los completados. Ambas diferencias
  conviven sin modificar la pantalla existente (FR-043) y quedan documentadas para que el
  administrador sepa qué criterio produce cada cifra.
- Hoy ambos criterios coinciden en la práctica, porque el sistema solo crea pagos en estado
  `completado` (`INSERT INTO pagos` no fija esa columna y toma el valor por defecto del esquema).
  Si en el futuro el sistema admitiera pagos `pendiente` o `cancelado`, el reporte de pagos no
  los listaría ni los contaría como ingreso, y el adeudo no los descontaría; esa decisión deberá
  revisarse en la versión que los introduzca (FR-008, FR-011).
- La ampliación de RN-27 al reporte de clientes y el precisado de RN-31 sobre los pagos
  completados implican actualizar `docs/sprint-4.md` §6, cuya redacción actual menciona solo
  pagos, accesos y membresías en el filtro por periodo, para que la regla de negocio y su
  documento de origen coincidan (FR-030, principio I).
- La consulta de auditoría ya existente en el proyecto se amplía con las acciones de generación y
  exportación de reportes, conservando su carácter exclusivo del administrador (FR-025).
- Los filtros por periodo se aplican sobre la fecha propia de cada entidad: fecha de registro para
  los clientes, fecha de pago para los pagos, fecha de acceso para los accesos y periodo de
  vigencia para las membresías.
- La paginación se resuelve en el servidor, de modo que los totales del reporte corresponden
  siempre al conjunto filtrado completo y no solo a la página visible (FR-014, FR-017).
- El estado de las membresías maneja los mismos cuatro valores que ya usa el sistema: activa,
  vencida, suspendida y cancelada, conforme a `docs/project-context.md` §12 RN-04.
- Los reportes no incluyen datos del módulo de entrenamiento (rutinas, objetivos y progresos) ni
  datos biométricos, conforme a `docs/sprint-4.md` §5.
- La estructura de carpetas `frontend/`, `backend/` y `database/`, el uso de ES Modules en el
  backend, MySQL local con InnoDB y `utf8mb4`, y las credenciales en variables de entorno se
  mantienen tal como en los sprints anteriores (FR-038, FR-040).
- La documentación del proyecto y los textos visibles para el usuario se redactan en español; los
  identificadores del código permanecen en inglés.
- La exportación en formato PDF requiere una dependencia que genera el archivo. Se asume que se
  incorpora una única librería de generación de PDF, sin servicio externo ni conexión a la red,
  cuya elección, justificación y licencia se resuelven en `/speckit.plan` conforme a FR-045.
- El límite de filas exportables se fija por defecto en 10.000 filas por exportación. Es un
  parámetro técnico que `/speckit.plan` confirma o ajusta, y que debe quedar registrado en
  `docs/project-context.md` §18 junto con los demás valores por defecto del sprint (tamaño de
  página, periodos predefinidos y formato de fecha).
- Los periodos predefinidos que se ofrecen en el filtro son hoy, semana, mes y personalizado, y
  el filtro de fecha admite además un rango libre de fecha inicial y fecha final (FR-012).
- El tamaño de página por defecto de los listados paginados es de 20 registros, valor que
  `/speckit.plan` confirma o ajusta y que debe quedar registrado en `docs/project-context.md` §18.
- El límite de 7 días para "próxima a vencer" se evalúa contra la fecha de hoy y no contra el
  final del periodo filtrado, de modo que el resultado no cambia durante un mismo día (FR-007).
