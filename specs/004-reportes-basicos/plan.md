# Plan de Implementación: Sprint 4 - Reportes básicos y cierre del MVP

**Rama**: `004-reportes-basicos` | **Fecha**: 2026-11-04 | **Especificación**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/004-reportes-basicos/spec.md`

**Nota**: este archivo lo genera el comando `/speckit.plan`; su contenido describe el flujo de ejecución de la planificación.

## Resumen

Implementar el Sprint 4 del Sistema de Gestión para Gimnasio: los cinco reportes de solo lectura
del administrador (clientes, membresías, pagos, adeudos y accesos), con filtros por periodo y por
estado, paginación en servidor, totales verificables contra el origen, exportación a PDF y el
registro en auditoría de cada generación y cada exportación. Todo sobre la base ya entregada en
los Sprints 1, 2 y 3 (usuarios, clientes, JWT, membresías, pagos, rostros, accesos, métricas de
entrenamiento, dashboard y auditoría), sin reimplementar nada, mediante una API REST en el
backend existente (Node.js + Express + ES Modules + `mysql2`) y una pantalla React de cuatro
pestañas que reutiliza los componentes actuales. El único elemento nuevo del sprint es una
librería de generación de PDF, justificada en [research.md](./research.md) §D1; no se crea ninguna
tabla nueva ni migración `004_`, porque la tabla `auditoria` existente ya tiene los campos
necesarios (research.md §D5).

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES Modules); Node.js >= 20; React 18.3; Vite 5.4

**Dependencias Primarias**: backend: express ^4.21, mysql2 ^3.11 (pool `mysql2/promise`),
bcrypt ^6, jsonwebtoken ^9, cors ^2.8, dotenv ^16, **pdfkit ^0.20 (MIT, nueva)**; frontend:
react ^18.3, react-router-dom ^6.28 (sin cambios). La dependencia nueva está justificada en
research.md §D1 conforme al principio III de la constitución (FR-045).

**Almacenamiento**: MySQL local con InnoDB y `utf8mb4`; pool de conexiones con consultas
parametrizadas; **sin tablas ni migraciones nuevas** (los reportes leen las tablas existentes y la
auditoría reutiliza la tabla `auditoria` del Sprint 2, research.md §D5); semilla nueva
`database/seeds/seed-datos-sprint4.sql` para dar a los reportes datos representativos en varios
periodos y estados.

**Pruebas**: `node:test` nativo + `supertest` (contrato e integración), misma estrategia de los
Sprints 1 a 3; validación funcional de extremo a extremo guiada por [quickstart.md](./quickstart.md)
(principio X).

**Plataforma Objetivo**: navegador de escritorio + servidor Node local + MySQL local; sin servicios
externos ni conexión a la red en tiempo de ejecución.

**Tipo de Proyecto**: aplicación web (frontend + backend + base de datos).

**Metas de Rendimiento**: respuestas de la API en menos de 500 ms en el equipo de desarrollo local
para el volumen del gimnasio (mismo objetivo del Sprint 3); generación del PDF en menos de 3
segundos para el límite de 10.000 filas exportables (research.md §D9).

**Restricciones**: constitución `docs/reglas.md` v1.1.0 (principios I a XI no negociables en este
sprint); ES Modules obligatorio en backend; permisos validados en el backend; el frontend NO accede
a MySQL y el backend es el único componente con acceso al motor (FR-035); reportes de solo
lectura sin ninguna escritura sobre `clientes`, `membresias`, `pagos` ni `accesos` (FR-003, RN-26,
RN-32); sin datos biométricos ni credenciales en respuestas o exportaciones (FR-004, FR-020,
RN-30); una dependencia nueva justificada (FR-045); y el Sprint 3 verificado con base de datos real
como prerrequisito de este sprint (FR-026, `docs/sprint-4.md` §1).

**Escala/Alcance**: un gimnasio, menos de 500 clientes y una decena de entrenadores; 7 historias
(US-S4-01 a US-S4-07), 5 reportes, 45 requisitos funcionales (FR-001 a FR-045) y 16 criterios de
éxito (SC-001 a SC-016).

## Verificación de la Constitución

*COMPUERTA: debe superarse antes de la investigación de la Fase 0. Se vuelve a evaluar después
del diseño de la Fase 1.*

| Principio | Estado | Evidencia en este plan |
|-----------|--------|------------------------|
| I. Alcance, MVP y fuente de verdad | CUMPLE | El alcance es el de `spec.md` (7 historias, US-G17) y `docs/sprint-4.md`; FR-042 excluye todo el apartado §8 (reportes avanzados, gráficos, envío programado, clases grupales, múltiples sucursales, nómina, facturación, biometría de vigilancia); FR-043 no reimplementa los Sprints 1 a 3; las reglas RN-25 a RN-34 se incorporan a `docs/project-context.md` §12 según FR-030. La divergencia de RN-27 y RN-31 respecto de `docs/sprint-4.md` §6 queda anotada para corregirse en el cierre del MVP (research.md §D10). |
| II. Arquitectura separada | CUMPLE | Se mantienen `frontend/`, `backend/` y `database/`; el backend sigue separando rutas, controladores, servicios, modelos, validadores y middlewares; reportes y auditoría quedan como módulos independientes que solo leen datos de otros módulos. |
| III. Stack y base de datos local | CUMPLE | React + JavaScript, Node.js + Express + ES Modules, MySQL local InnoDB utf8mb4, JWT, bcrypt, API REST; el frontend NUNCA accede a MySQL y el backend es el único componente con acceso al motor (FR-035); **una dependencia nueva** (`pdfkit`, MIT, sin binarios ni red) justificada en research.md §D1 y exigida por FR-045; credenciales en variables de entorno. |
| IV. Base de datos y persistencia | CUMPLE | No se crea ninguna tabla ni migración: los reportes consultan `clientes`, `membresias`, `tipos_membresia`, `pagos`, `accesos` y `auditoria` con consultas parametrizadas (FR-039); la auditoría se amplía solo con acciones nuevas dentro de la tabla existente (research.md §D5); `.env` en `.gitignore`. |
| V. Seguridad | CUMPLE | Permisos validados en backend con los middlewares `autenticar`/`autorizar` existentes (FR-001, FR-036); validación de todas las entradas (FR-013, FR-016); los reportes no exponen contraseñas, tokens ni datos biométricos (FR-004, FR-020, FR-040); errores centralizados con el envelope `{ mensaje, codigo }` sin detalles internos. |
| VI. Roles y permisos | CUMPLE | Solo el administrador accede a los reportes (FR-001, RN-25); la matriz por rol queda en `contracts/api-reportes.md` y la auditoría de reportes también es exclusiva del administrador (FR-025). |
| VII. Integridad de reglas de negocio | CUMPLE | RN-25 a RN-34 mapeadas a FR-001 a FR-022; los pagos y accesos son historial y no se modifican ni se eliminan desde los reportes (FR-005, FR-008, RN-32); el adeudo aplica el criterio de RN-31 con la precisión acordada (FR-011). |
| VIII. Reconocimiento facial y control de acceso | CUMPLE | Este sprint no modifica el módulo facial ni el de acceso; solo consulta `accesos` en forma agregada para el reporte de accesos, manteniendo la separación de módulos y sin exponer datos biométricos (FR-040). |
| IX. API y manejo de errores | CUMPLE | Contratos REST con JSON y códigos HTTP definidos en `contracts/api-reportes.md`; middlewares existentes de autenticación y autorización; validación del periodo y de los estados antes de procesar (FR-013, FR-016); manejo de errores centralizado. |
| X. Pruebas | CUMPLE | Pruebas de contrato e integración con `node:test` + `supertest` para cada reporte, más validación de extremo a extremo en `quickstart.md` (incluye la exportación a PDF y la verificación de auditoría de SC-007 y SC-016). |
| XI. UX/UI profesional y sencilla | CUMPLE | Una pantalla de reportes con cuatro pestañas reutiliza `estilos.css`, `TarjetaIndicador.jsx` y los patrones de las páginas existentes; mensajes claros de resultado vacío y de error (FR-015, FR-032); la exportación comunica de forma visible el aviso de límite (FR-019). |

**Resultado de la compuerta**: TODAS CUMPLEN. No hay violaciones que justificar.

**Re-evaluación tras la Fase 1 (diseño)**: el diseño generado (`research.md`, `data-model.md`,
`contracts/`, `quickstart.md`) no introduce violaciones: no se crea ninguna tabla ni migración, y
las dos acciones de auditoría caben en la tabla `auditoria` existente (IV); los reportes se
resuelven con consultas parametrizadas de solo lectura sobre las tablas de origen, sin vistas ni
almacenes duplicados (IV, VII); la dependencia `pdfkit` es la única incorporación y está
justificada con licencia MIT, sin binarios ni red (III); los contratos mantienen la matriz de
permisos por rol y la exclusión de datos biométricos (V, VI); y la estrategia de pruebas reutiliza
`node:test` + `supertest` con la infraestructura existente (X). **Compuerta superada tras el
diseño.**

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/004-reportes-basicos/
├── plan.md              # Este archivo (salida de /speckit.plan)
├── research.md          # Salida de la Fase 0 (/speckit.plan)
├── data-model.md        # Salida de la Fase 1 (/speckit.plan)
├── quickstart.md        # Salida de la Fase 1 (/speckit.plan)
├── contracts/           # Salida de la Fase 1 (/speckit.plan)
│   └── api-reportes.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Salida de la Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── config/          # database.js, entorno.js (ya existen, se reutilizan)
│   ├── routes/          # + reportes.routes.js
│   ├── controllers/     # + reportes.controller.js
│   ├── services/        # + reporte.service.js (consulta, filtros y totales),
│   │                    #   reporte-pdf.service.js (generación del PDF);
│   │                    #   se reutiliza auditoria.service.js
│   ├── models/          # + reporte.model.js (consultas de solo lectura y conteos)
│   ├── middlewares/     # autenticacion.js y autorizacion.js existentes, se reutilizan
│   ├── validators/      # + reporte.validator.js (periodo y estados por reporte)
│   └── utils/           # respuestas.js y fechas.js existentes, se reutilizan
└── tests/
    ├── ayuda/           # base-pruebas.js existente, se amplía para cargar la
    │                    #   semilla del Sprint 4
    ├── contract/        # + reportes.test.js
    └── integration/     # + una historia por cada US-S4-01 a US-S4-07

frontend/
└── src/
    ├── pages/           # + Reportes.jsx (cuatro pestañas); se amplía App.jsx
    ├── components/      # + FiltroReporte.jsx, TablaReporte.jsx;
    │                    #   se reutiliza TarjetaIndicador.jsx y ModalConfirmacion.jsx
    ├── services/        # api.js existente, se amplía con el recurso de reportes
    └── context/         # AuthContext.jsx existente, se reutiliza

database/
├── migrations/         # 001 (Sprint 1), 002 (Sprint 2), 003 (Sprint 3); sin 004
├── seeds/              # + seed-datos-sprint4.sql
└── scripts/            # ejecutar-migraciones.js y crear-base-de-datos.js, se reutilizan
```

**Decisión de estructura**: se conserva la estructura de tres carpetas (`frontend/`, `backend/` y
`database/`) y la organización modular del backend entregada en el Sprint 1
(`specs/001-base-usuarios-clientes`). El módulo de reportes sigue el mismo patrón
rutas → controladores → servicios → modelos → validadores, sin modificar el comportamiento
entregado salvo los ajustes mínimos de integración previstos en FR-043. La semilla del Sprint 4
se carga en `backend/tests/ayuda/base-pruebas.js` junto con las de los sprints anteriores, de modo
que la base de pruebas incluya datos representativos para los reportes.

## Seguimiento de Complejidad

Sin violaciones de la constitución que justificar. La única incorporación al proyecto es la
librería `pdfkit`, cuya justificación obligatoria figura en research.md §D1 conforme a FR-045 y al
principio III de la constitución.
