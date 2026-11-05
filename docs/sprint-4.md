<!--

Plantilla de insumo para /speckit.specify.

NO lo pongas dentro de specs/ (esa carpeta la genera Spec Kit).

-->

# Insumo de especificación - Sprint 4: Reportes básicos y cierre del MVP

> **Referencias obligatorias para el agente:**
>
> * Contexto maestro: `docs/project-context.md`
> * Constitución: `docs/reglas.md` (y `.specify/memory/constitution.md` una vez ratificada)
> * Sprint 1: `docs/sprint-1.md`
> * Sprint 2: `docs/sprint-2.md`
> * Sprint 3: `docs/sprint-3.md`
> * Este documento describe únicamente el alcance de este sprint.

> **Nota de alcance (borrador para validar con el equipo):** la constitución actual establece un desarrollo en tres sprints (Principio I) y el contexto maestro menciona dos. Este Sprint 4 solo es válido si el equipo o el profesor lo autorizan, y en ese caso `docs/reglas.md` y `docs/project-context.md` deben actualizarse. Su contenido se limita a la única función del MVP que ningún sprint cubrió: **reportes básicos** (US-G17).

## 1. Contexto del sprint

Los Sprints 1, 2 y 3 dejaron operativos los usuarios, los clientes, las membresías, los pagos, el reconocimiento facial, el control de acceso, la gestión de entrenadores, las rutinas y el dashboard administrativo.

Del MVP definido en `docs/project-context.md` solo falta una función: los **reportes básicos** de clientes, membresías, pagos, adeudos y accesos (sección 7.9 y US-G17). Los sprints anteriores los dejaron fuera de alcance de forma explícita (reportes avanzados o complejos).

Este sprint implementa esos reportes y además cierra el MVP: verifica de forma completa lo construido en el Sprint 3, corrige los defectos que se encuentren, actualiza la documentación y deja la interfaz consistente.

**Prerrequisito:** el Sprint 3 debe estar verificado con una base de datos real (migración 003 aplicada, pruebas de integración ejecutándose sin omitirse y sin pruebas fallidas o canceladas) antes de implementar este sprint.

La aplicación mantendrá la arquitectura establecida en los sprints anteriores:

* `frontend/`: aplicación React con JavaScript.
* `backend/`: aplicación Node.js + Express con JavaScript.
* `database/`: scripts, migraciones y semillas de MySQL.

El backend utilizará **ES Modules**, mediante `import` y `export`. No se utilizará CommonJS mediante `require()` o `module.exports`.

El archivo `backend/package.json` deberá mantener:

```json
{
  "type": "module"
}
```

El frontend no tendrá acceso directo a MySQL. Toda comunicación con la base de datos se realizará mediante la API REST del backend.

Los reportes serán de **solo lectura**: consultan información ya registrada y no modifican clientes, membresías, pagos ni accesos.

## 2. Objetivo

Implementar los reportes básicos del gimnasio para el administrador, con filtros y exportación, y cerrar el MVP con pruebas completas, documentación actualizada y una interfaz consistente.

## 3. Historias de usuario del sprint

### US-S4-01 — Reporte de clientes

Como administrador, quiero generar un reporte de clientes para conocer cuántos hay, su estado y su situación general.

### US-S4-02 — Reporte de membresías

Como administrador, quiero generar un reporte de membresías activas, vencidas y próximas a vencer para planear renovaciones.

### US-S4-03 — Reporte de pagos y adeudos

Como administrador, quiero generar un reporte de pagos e ingresos por periodo y de adeudos pendientes para controlar la parte económica del gimnasio.

### US-S4-04 — Reporte de accesos

Como administrador, quiero generar un reporte de accesos autorizados y rechazados por periodo para supervisar el uso del gimnasio.

### US-S4-05 — Exportación de reportes

Como administrador, quiero exportar un reporte a un archivo para guardarlo, imprimirlo o compartirlo.

### US-S4-06 — Auditoría de reportes

Como administrador, quiero que el sistema registre quién generó o exportó un reporte para mantener trazabilidad.

### US-S4-07 — Cierre y calidad del MVP

Como equipo, queremos verificar y documentar todo el MVP para entregar un sistema estable y coherente con la documentación.

## 4. Flujo demostrable al cierre del sprint

1. El administrador inicia sesión y entra a la sección de reportes.
2. Elige un tipo de reporte: clientes, membresías, pagos y adeudos, o accesos.
3. Aplica filtros, como el periodo o el estado.
4. El sistema muestra el reporte con totales y detalle, de forma paginada.
5. El administrador exporta el reporte a un archivo.
6. El administrador consulta la auditoría y encuentra el registro de la generación y la exportación.
7. Un usuario de otro rol intenta entrar a los reportes y el sistema se lo impide.

## 5. Entidades y tablas que toca este sprint

| Tabla                    | Operaciones principales                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `usuarios`               | Consultar y validar permisos                                         |
| `clientes`               | Consultar para reportes                                              |
| `tipos_membresia`        | Consultar para reportes                                              |
| `membresias`             | Consultar para reportes                                              |
| `pagos`                  | Consultar para reportes                                              |
| `accesos`                | Consultar para reportes                                              |
| `auditoria`              | Registrar la generación y la exportación de reportes                 |

Este sprint **no requiere tablas nuevas**. Los reportes se alimentan de consultas o vistas sobre las tablas de los Sprints 1 y 2. Solo se creará una migración (`004_...`) si hace falta ampliar las acciones de auditoría o crear vistas. En ese caso se versionará en `database/migrations/`.

Los datos biométricos de la tabla `rostros` y los datos de entrenamiento (rutinas, objetivos y progresos) **no forman parte de los reportes** de este sprint.

La tabla `auditoria` se utilizará de acuerdo con las reglas establecidas en `docs/project-context.md` y `docs/reglas.md`.

## 6. Reglas de negocio aplicables

* Solo el administrador puede generar, consultar y exportar reportes.
* Los reportes son de solo lectura y no modifican ningún dato.
* Los reportes de clientes, pagos, accesos y membresías deben poder filtrarse por periodo.
* Los listados de un reporte deben estar paginados.
* La exportación debe reflejar exactamente los mismos datos y filtros que el reporte mostrado en pantalla. Si el conjunto filtrado excede el límite de filas exportables, la exportación se limita y el administrador recibe el aviso explícito de que el archivo contiene solo una parte del conjunto.
* Los reportes no deben incluir contraseñas, tokens ni datos biométricos.
* El adeudo se calcula como el precio del tipo de la última membresía registrada del cliente menos la suma de sus pagos completados, igual que en el Sprint 2, y el reporte muestra el estado de esa membresía.
* Los pagos y los accesos son historial y no se modifican ni se eliminan desde los reportes.
* Si no hay datos para el filtro elegido, el reporte debe mostrar un resultado vacío con un mensaje claro y no un error.
* La generación y la exportación de un reporte deben quedar registradas en la auditoría.

> Estas reglas continúan la numeración del proyecto como **RN-25 a RN-34** y ya están incorporadas a `docs/project-context.md` §12.

## 7. Criterios de aceptación

### 7.1 Reportes

* [ ] El administrador puede generar el reporte de clientes con totales por estado.
* [ ] El administrador puede generar el reporte de membresías activas, vencidas y próximas a vencer.
* [ ] El administrador puede generar el reporte de pagos e ingresos por periodo.
* [ ] El administrador puede generar el reporte de adeudos pendientes por cliente.
* [ ] El administrador puede generar el reporte de accesos autorizados y rechazados por periodo.
* [ ] Los reportes se pueden filtrar por fechas y, cuando aplique, por estado.
* [ ] Los listados están paginados.
* [ ] Un periodo sin datos muestra un resultado vacío con mensaje claro.
* [ ] Un periodo con la fecha inicial posterior a la final responde con un error de validación.
* [ ] Los totales del reporte coinciden con los datos reales de la base.

### 7.2 Exportación

* [ ] El administrador puede exportar cada reporte a un archivo.
* [ ] El archivo exportado contiene los mismos datos y filtros que el reporte en pantalla.
* [ ] El archivo no incluye contraseñas, tokens ni datos biométricos.
* [ ] El archivo se abre correctamente con acentos y caracteres especiales.

### 7.3 Permisos y auditoría

* [ ] Recepcionista, entrenador y cliente reciben acceso denegado a los reportes.
* [ ] Una petición sin token responde que se requiere autenticación.
* [ ] La generación de un reporte queda registrada en la auditoría.
* [ ] La exportación de un reporte queda registrada en la auditoría.
* [ ] Solo el administrador puede consultar esos registros.

### 7.4 Cierre y calidad del MVP

* [ ] El Sprint 3 está verificado: migración aplicada y sus pruebas ejecutándose sin omitirse.
* [ ] La suite completa de pruebas del backend se ejecuta sin fallos, sin cancelaciones y sin omisiones.
* [ ] Los defectos encontrados al verificar el Sprint 3 están corregidos o documentados.
* [ ] Existe una validación de punta a punta de los flujos principales de los cuatro sprints.
* [ ] `docs/project-context.md` incluye las reglas de los Sprints 3 y 4.
* [ ] `docs/reglas.md` y `docs/project-context.md` reflejan el número real de sprints.
* [ ] Las pantallas del frontend mantienen un diseño y una navegación consistentes.
* [ ] El reporte de pruebas del proyecto está actualizado con los resultados reales.

### 7.5 Arquitectura y seguridad

* [ ] El frontend se comunica con el backend mediante API REST.
* [ ] El frontend no accede directamente a MySQL.
* [ ] El backend es el único componente con acceso directo a MySQL.
* [ ] Los permisos se validan en el backend.
* [ ] Se mantiene la autenticación mediante JWT.
* [ ] Las contraseñas continúan protegidas mediante `bcrypt`.
* [ ] El backend continúa utilizando ES Modules.
* [ ] Los archivos JavaScript utilizan `import` y `export`.
* [ ] No se utiliza `require()` ni `module.exports`.
* [ ] Las consultas son parametrizadas.
* [ ] Los datos sensibles utilizan variables de entorno.
* [ ] Los datos biométricos no aparecen en reportes ni exportaciones.

## 8. Fuera de alcance

En este sprint no se implementará:

* Reportes avanzados, análisis predictivo o inteligencia de negocio.
* Gráficos complejos o paneles personalizables.
* Programación automática o envío de reportes por correo.
* Reportes de rutinas, objetivos o progresos de entrenamiento.
* Clases grupales, reservas o asistencia a sesiones grupales.
* Notificaciones por correo, SMS o mensajería.
* Aplicación móvil.
* Gestión de múltiples sucursales.
* Nómina e inventario.
* Contabilidad completa y facturación electrónica.
* Procesamiento directo de pagos mediante bancos o plataformas externas.
* Vigilancia mediante reconocimiento facial.
* Funciones que no formen parte del MVP definido en `docs/project-context.md`.

## 9. Decisiones pendientes para `/speckit.clarify`

Las siguientes decisiones deberán resolverse antes de la implementación definitiva:

* Formato de exportación de los reportes: CSV, PDF u otro.
* Si el reporte se genera siempre en el servidor o también en la pantalla.
* Periodos predefinidos que se ofrecerán (hoy, semana, mes, personalizado).
* Cuántos días antes del vencimiento se considera una membresía "próxima a vencer".
* Tamaño de página de los listados de reportes.
* Si los reportes incluirán totales y subtotales y cómo se presentarán.
* Si se usará una vista de MySQL o consultas directas para cada reporte.
* Si hará falta una migración para ampliar las acciones de auditoría.
* Cómo se manejan los reportes muy grandes (límite de filas exportadas).
* Zona horaria y formato de fecha para los reportes.
* Dependencias nuevas necesarias para exportar, que deberán justificarse antes de incorporarse.

## 10. Restricciones técnicas heredadas

El Sprint 4 deberá mantener todas las restricciones establecidas en los sprints anteriores, `docs/reglas.md` y `docs/project-context.md`.

### Frontend

* React.
* JavaScript.
* API REST para comunicarse con el backend.
* Sin conexión directa a MySQL.
* Interfaz sencilla y consistente.

### Backend

* Node.js.
* Express.
* JavaScript.
* ES Modules.
* Uso obligatorio de `import` y `export`.
* `backend/package.json` con `"type": "module"`.
* No utilizar `require()` ni `module.exports`.
* API REST.
* JWT para autenticación.
* `bcrypt` para protección de contraseñas.
* Validación de permisos en backend.
* Separación entre rutas, controladores, servicios, modelos y middlewares.

### Base de datos

* MySQL local.
* Motor InnoDB.
* Codificación `utf8mb4`.
* Claves primarias y foráneas.
* Integridad referencial.
* Consultas parametrizadas.
* Scripts SQL versionados.
* Carpeta oficial: `database/`.
* No crear una carpeta alternativa `dataBase/`.

### Seguridad

* Las credenciales deberán manejarse mediante variables de entorno.
* `.env` deberá estar incluido en `.gitignore`.
* `.env.example` no deberá contener secretos.
* Las contraseñas no deberán almacenarse en texto plano.
* Los permisos deberán validarse en el backend.
* Los errores no deberán revelar información interna.
* Los datos biométricos no deberán exponerse.
* Los registros históricos de pagos y accesos no deberán eliminarse.

### Git y organización

* El desarrollo deberá realizarse mediante ramas de Git.
* No se deberá trabajar directamente sobre `main`.
* La documentación y los nombres definidos para el proyecto deberán mantenerse en español.
* No se deberán introducir tecnologías o dependencias no justificadas.
* La estructura de carpetas de los sprints anteriores deberá mantenerse.

## 11. Entregables esperados

* Reportes de clientes, membresías, pagos y adeudos, y accesos, con filtros y paginación.
* Exportación de reportes.
* Auditoría de la generación y la exportación de reportes.
* Pantalla de reportes solo para el administrador.
* Pruebas de contrato e integración de cada reporte.
* Suite completa de pruebas del MVP en verde.
* Informe de calidad aplicada a la nueva funcionalidad (plan de aseguramiento de calidad), llenado durante los comandos de Spec Kit y terminado antes de `/speckit.implement`.
* Reporte de pruebas actualizado.
* Documentación actualizada (`project-context.md` y `reglas.md`).

## 12. Criterios de cierre del sprint

El sprint se considera completado cuando:

1. El administrador puede generar los reportes de clientes, membresías, pagos y adeudos, y accesos.
2. Los reportes se pueden filtrar, están paginados y sus totales coinciden con los datos reales.
3. Los reportes se pueden exportar y el archivo coincide con lo mostrado en pantalla.
4. Los demás roles no pueden acceder a los reportes.
5. La generación y la exportación quedan registradas en la auditoría.
6. Todas las pruebas del MVP se ejecutan sin fallos, cancelaciones ni omisiones.
7. La documentación del proyecto está actualizada y coincide con el sistema.
8. El informe de calidad aplicada a la nueva funcionalidad está completo y revisado antes de implementar.
