# Plan de Implementación: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Rama**: `003-entrenadores-rutinas-dashboard` | **Fecha**: 2026-10-19 | **Especificación**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/003-entrenadores-rutinas-dashboard/spec.md`

**Nota**: este archivo lo genera el comando `/speckit.plan`; su contenido describe el flujo de ejecución de la planificación.

## Resumen

Implementar el Sprint 3 del Sistema de Gestión para Gimnasio: el registro de entrenadores ligado a
cuentas con rol entrenador, la asignación y reasignación de entrenador a cliente con histórico, las
rutinas con sus ejercicios, los objetivos de entrenamiento, el histórico inmutable de progresos, la
vista propia del cliente sobre su entrenamiento, la consulta de la carga del personal y el dashboard
administrativo con indicadores agregados. Todo sobre la base ya entregada en los Sprints 1 y 2
(usuarios, clientes, JWT, membresías, pagos, rostros, accesos y auditoría), sin reimplementar nada,
mediante una API REST en el backend existente (Node.js + Express + ES Modules + `mysql2`) y un
frontend React que amplía las páginas actuales; el dashboard se alimenta de consultas consolidadas
sobre los módulos de origen, sin tablas de resumen adicionales.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES Modules); Node.js >= 20; React 18.3; Vite 5.4

**Dependencias Primarias**: backend: express ^4.21, mysql2 ^3.11 (pool `mysql2/promise`),
bcrypt ^6, jsonwebtoken ^9, cors ^2.8, dotenv ^16; frontend: react ^18.3, react-router-dom ^6.28.
**Sin dependencias nuevas**: este sprint no incorpora librerías; se reutiliza todo lo instalado en
los Sprints 1 y 2 (constitución, principio III).

**Almacenamiento**: MySQL local con InnoDB y `utf8mb4`; pool de conexiones con consultas
parametrizadas; migración SQL versionada en `database/migrations/003_crear_tablas_sprint3.sql`
(sin duplicar nada de los sprints anteriores); semilla `database/seeds/seed-datos-sprint3.sql`.

**Pruebas**: `node:test` nativo + `supertest` (contrato e integración), misma estrategia de los
Sprints 1 y 2; validación funcional de extremo a extremo guiada por [quickstart.md](./quickstart.md)
(principio X).

**Plataforma Objetivo**: navegador de escritorio + servidor Node local + MySQL local; sin servicios
externos.

**Tipo de Proyecto**: aplicación web (frontend + backend + base de datos).

**Metas de Rendimiento**: respuestas de la API en menos de 500 ms en el equipo de desarrollo local
para el volumen del gimnasio; el dashboard resuelve sus agregados en una sola consulta por
sección.

**Restricciones**: constitución `docs/reglas.md` v1.1.0 (principios I-V, VII, IX no negociables en
este sprint); sin dependencias nuevas; ES Modules obligatorio en backend; permisos validados en el
backend; historiales (asignaciones, rutinas, objetivos y progresos) sin eliminación ordinaria.

**Escala/Alcance**: un gimnasio, menos de 500 clientes y una decena de entrenadores; 7 historias
(US-S3-01 a US-S3-07), 32 requisitos funcionales (FR-001 a FR-032) y 13 criterios de éxito
(SC-001 a SC-013).

## Verificación de la Constitución

*COMPUERTA: debe superarse antes de la investigación de la Fase 0. Se vuelve a evaluar después
del diseño de la Fase 1.*

| Principio | Estado | Evidencia en este plan |
|-----------|--------|------------------------|
| I. Alcance, MVP y fuente de verdad | CUMPLE | El alcance es el de `spec.md` (7 historias) y `docs/sprint-3.md`; FR-029 y FR-030 prohíben reimplementar los Sprints 1 y 2 y excluir clases masivas, asistencia grupal y reportes complejos; las reglas RN-15 a RN-24 se incorporan a la documentación cuando el equipo las apruebe. |
| II. Arquitectura separada | CUMPLE | Se mantiene `frontend/`, `backend/` y `database/`; el backend sigue separando rutas, controladores, servicios, modelos, validadores y middlewares; entrenamiento (rutinas, objetivos, progresos) y dashboard quedan como módulos independientes. |
| III. Stack y base de datos local | CUMPLE | React + JavaScript, Node.js + Express + ES Modules, MySQL local InnoDB utf8mb4, JWT, bcrypt, API REST; **sin dependencias nuevas**; credenciales en variables de entorno y usuario dedicado `gimnasio_app`. |
| IV. Base de datos y persistencia | CUMPLE | Migración `003_crear_tablas_sprint3.sql` crea las seis tablas nuevas con claves foráneas e integridad referencial; `progresos_clientes`, `objetivos_entrenamiento`, `rutinas` y `asignaciones_entrenador` conservan histórico sin eliminación ordinaria; `.env` en `.gitignore`. |
| V. Seguridad | CUMPLE | Permisos validados en backend (FR-025) con los middlewares `autenticar`/`autorizar` existentes; validación de todas las entradas (FR-024); el dashboard no expone datos sensibles de clientes ajenos (FR-019); errores centralizados sin detalles internos. |
| VI. Roles y permisos | CUMPLE | Matriz de permisos por módulo en `contracts/`: administrador (todo), recepcionista (asignación y consulta del personal, sin editar rutinas ni progresos), entrenador (solo su carga), cliente (solo su propio entrenamiento); el dashboard completo es exclusivo del administrador (sesión 2026-10-19). |
| VII. Integridad de reglas de negocio | CUMPLE | RN-15 a RN-24 mapeadas a FR-001 a FR-021; una sola asignación activa y una sola rutina activa por cliente; historiales íntegros (FR-004, FR-009, FR-011). |
| VIII. Reconocimiento facial y control de acceso | CUMPLE | Este sprint no modifica el módulo facial ni el de acceso; solo consulta sus datos agregados para el dashboard (FR-029), manteniendo la separación de módulos. |
| IX. API y manejo de errores | CUMPLE | Contratos REST con JSON y códigos HTTP definidos en `contracts/`; middlewares de autenticación y autorización existentes; validación antes de procesar; manejo de errores centralizado. |
| X. Pruebas | CUMPLE | Pruebas de contrato e integración con `node:test` + `supertest` para cada módulo nuevo, más validación de extremo a extremo en `quickstart.md` (incluye el dashboard de SC-009 y SC-010). |
| XI. UX/UI profesional y sencilla | CUMPLE | Nuevas páginas reutilizan `estilos.css` y los patrones de las páginas existentes; mensajes claros para "sin rutina asignada" y "sin progreso registrado" (FR-014); confirmación en acciones sensibles como la baja de un entrenador. |

**Resultado de la compuerta**: TODAS CUMPLEN. No hay violaciones que justificar.

**Re-evaluación tras la Fase 1 (diseño)**: el diseño generado (`research.md`, `data-model.md`,
`contracts/`, `quickstart.md`) no introduce violaciones: la migración `003` solo agrega las seis
tablas nuevas de este sprint sin tocar las existentes (IV), las restricciones de unicidad
(asignación activa y rutina activa por cliente) se resuelven con validación transaccional en el
servicio sin esquemas ni dependencias nuevas (III, VII), el dashboard se resuelve con consultas
consolidadas sobre los módulos de origen sin tablas duplicadas (IV), los contratos mantienen la
matriz de permisos por rol y sin operaciones de eliminación ordinaria sobre historiales (V, VI), y
no se incorpora ninguna dependencia (III). **Compuerta superada tras el diseño.**

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/003-entrenadores-rutinas-dashboard/
├── plan.md              # Este archivo (salida de /speckit.plan)
├── research.md          # Salida de la Fase 0 (/speckit.plan)
├── data-model.md        # Salida de la Fase 1 (/speckit.plan)
├── quickstart.md        # Salida de la Fase 1 (/speckit.plan)
├── contracts/           # Salida de la Fase 1 (/speckit.plan)
│   ├── api-entrenadores-asignaciones.md
│   ├── api-rutinas-progreso.md
│   └── api-dashboard.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Salida de la Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── config/          # database.js, entorno.js (ya existen)
│   ├── routes/          # + entrenadores, asignaciones, rutinas, objetivos, progresos,
│   │                    #   mi-entrenamiento, personal, dashboard
│   ├── controllers/     # + los controladores de cada módulo nuevo
│   ├── services/        # + entrenamiento.service.js (rutinas, objetivos, progresos),
│   │                    #   dashboard.service.js; se reutiliza auditoria.service.js
│   ├── models/          # + entrenador.model.js, asignacion.model.js, rutina.model.js,
│   │                    #   ejercicio-rutina.model.js, objetivo.model.js,
│   │                    #   progreso.model.js, dashboard.model.js
│   ├── middlewares/     # autenticacion.js y autorizacion.js existentes, se reutilizan
│   ├── validators/      # + entrenador.validator.js, rutina.validator.js,
│   │                    #   progreso.validator.js, dashboard.validator.js
│   └── utils/           # respuestas.js existente, se reutiliza
└── tests/
    ├── ayuda/           # base-pruebas.js existente, se reutiliza
    ├── contract/        # + entrenadores, asignaciones, rutinas, progresos, dashboard
    └── integration/     # + historias de US-S3-01 a US-S3-07

frontend/
└── src/
    ├── pages/           # + Entrenadores.jsx, Personal.jsx, Rutinas.jsx,
    │                    #   Dashboard.jsx; se amplían ClienteDetalle.jsx y MiCuenta.jsx
    ├── components/      # + RutinaForm.jsx, EjercicioForm.jsx, RegistroProgreso.jsx,
    │                    #   TarjetaIndicador.jsx; se reutiliza ModalConfirmacion.jsx
    ├── services/        # api.js existente, se amplía con los nuevos recursos
    └── context/         # AuthContext.jsx existente, se reutiliza

database/
├── migrations/         # 001 (Sprint 1), 002 (Sprint 2) + 003_crear_tablas_sprint3.sql
├── seeds/              # + seed-datos-sprint3.sql
└── scripts/            # ejecutar-migraciones.js y crear-base-de-datos.js, se reutilizan
```

**Decisión de estructura**: se conserva la estructura de tres carpetas (`frontend/`, `backend/`
y `database/`) y la organización modular del backend entregada en el Sprint 1
(`specs/001-base-usuarios-clientes`). Los módulos nuevos se añaden siguiendo el mismo patrón
rutas → controladores → servicios → modelos → validadores, sin modificar el comportamiento
entregado salvo los ajustes mínimos de integración previstos en FR-029.

## Seguimiento de Complejidad

Sin violaciones de la constitución que justificar.
