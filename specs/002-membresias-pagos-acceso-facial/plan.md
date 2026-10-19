# Plan de Implementación: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Rama**: `002-membresias-pagos-acceso-facial` | **Fecha**: 2026-10-15 | **Especificación**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/002-membresias-pagos-acceso-facial/spec.md`

**Nota**: este archivo lo genera el comando `/speckit.plan`; su contenido describe el flujo de ejecución de la planificación.

## Resumen

Implementar el Sprint 2 del Sistema de Gestión para Gimnasio: operaciones funcionales sobre
tipos de membresía, membresías y pagos; las tablas nuevas `rostros`, `accesos` y `auditoria`;
el registro e identificación facial en el punto de acceso; la validación de membresía posterior
a la identificación; y las vistas propias del cliente. Todo sobre la base ya entregada en el
Sprint 1 (usuarios, clientes, JWT, roles), sin reimplementar nada, mediante una API REST en el
backend existente (Node.js + Express + ES Modules + `mysql2`), un frontend React con captura de
cámara y un módulo de reconocimiento facial que se procesa en el navegador enviando solo
descriptores al backend, que es quien los almacena, compara y valida el acceso.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES Modules); Node.js >= 20; React 18.3; Vite 5.4

**Dependencias Primarias**: backend: express ^4.21, mysql2 ^3.11 (pool `mysql2/promise`),
bcrypt ^6, jsonwebtoken ^9, cors ^2.8, dotenv ^16; frontend: react ^18.3, react-router-dom ^6.28.
Única dependencia nueva: `@vladmandic/face-api` (frontend, justificada en [research.md](./research.md)).

**Almacenamiento**: MySQL local con InnoDB y `utf8mb4`; pool de conexiones con consultas
parametrizadas; migraciones SQL versionadas en `database/migrations/` (se agrega
`002_crear_tablas_sprint2.sql` sin duplicar lo creado en el Sprint 1).

**Pruebas**: `node:test` nativo + `supertest` (contrato e integración), misma estrategia del
Sprint 1; validación funcional de extremo a extremo guiada por [quickstart.md](./quickstart.md)
(principio X).

**Plataforma Objetivo**: navegador de escritorio con cámara (getUserMedia/WebGL) + servidor
Node local + MySQL local; sin servicios externos.

**Tipo de Proyecto**: aplicación web (frontend + backend + base de datos).

**Metas de Rendimiento**: identificación facial en menos de 2 s por captura en el equipo de
desarrollo local; volumen de decenas de clientes simultáneos.

**Restricciones**: constitución `docs/reglas.md` v1.1.0 (principios I-V y VII no negociables);
datos biométricos sin exponer crudos al frontend; sin dependencias no justificadas; ES Modules
obligatorio en backend.

**Escala/Alcance**: un gimnasio, menos de 500 clientes; 10 historias (US-S2-01 a US-S2-10),
28 requisitos funcionales (FR-001 a FR-028) y 11 criterios de éxito (SC-001 a SC-011).

## Verificación de la Constitución

*COMPUERTA: debe superarse antes de la investigación de la Fase 0. Se vuelve a evaluar después
del diseño de la Fase 1.*

| Principio | Estado | Evidencia en este plan |
|-----------|--------|------------------------|
| I. Alcance, MVP y fuente de verdad | CUMPLE | El alcance es el de `spec.md` (10 historias) y `docs/sprint-2.md`; la historia US-S2-10 fue autorizada explícitamente por el equipo en la sesión de clarificación 2026-10-15 (respuesta Q5-A); lo demás de "Fuera de alcance" no se toca. |
| II. Arquitectura separada | CUMPLE | Se mantiene `frontend/`, `backend/` y `database/`; el backend sigue separando rutas, controladores, servicios, modelos, validadores y middlewares; el reconocimiento facial (captura y descriptor) y el control de acceso (validación y registro) quedan como módulos independientes. |
| III. Stack y base de datos local | CUMPLE | React + JavaScript, Node.js + Express + ES Modules, MySQL local InnoDB utf8mb4, JWT, bcrypt, API REST; única dependencia nueva `@vladmandic/face-api`, justificada en `research.md`; credenciales en variables de entorno y usuario dedicado `gimnasio_app`. |
| IV. Base de datos y persistencia | CUMPLE | Migración `002_crear_tablas_sprint2.sql` crea `rostros`, `accesos` y `auditoria` con claves foráneas e integridad referencial; `pagos` y `accesos` no admiten eliminación ordinaria; `.env` en `.gitignore` y `.env.example` sin secretos. |
| V. Seguridad | CUMPLE | Los descriptores faciales no se devuelven crudos al frontend (FR-017); los endpoints faciales y de acceso requieren JWT; permisos validados en backend (FR-021); validación de todas las entradas (FR-020); errores centralizados sin detalles internos. |
| VI. Roles y permisos | CUMPLE | Matriz de permisos por módulo (membresías, pagos, rostros, accesos, auditoría, vistas del cliente) con los middlewares `autenticar`/`autorizar` existentes; el cliente solo ve su propia información (FR-028). |
| VII. Integridad de reglas de negocio | CUMPLE | RN-01 a RN-14 mapeadas a requisitos FR-002 a FR-014; pago obligatoriamente asociado a una membresía del mismo cliente (RN-05); historiales sin eliminación ordinaria. |
| VIII. Reconocimiento facial y control de acceso | CUMPLE | Flujo identificar → validar membresía → autorizar o rechazar → registrar; la coincidencia facial por sí sola no autoriza (FR-012); sin vigilancia ni seguimiento (FR-018). |
| IX. API y manejo de errores | CUMPLE | Contratos REST con JSON y códigos HTTP definidos en `contracts/`; middlewares de autenticación y autorización existentes; validación antes de procesar; manejo de errores centralizado. |
| X. Pruebas | CUMPLE | Pruebas de contrato e integración con `node:test` + `supertest` para cada módulo nuevo, más validación de extremo a extremo en `quickstart.md` (dashboard y reportes pertenecen al Sprint 3, fuera de este alcance). |
| XI. UX/UI profesional y sencilla | CUMPLE | Nuevas páginas reutilizan `estilos.css` y los patrones del Sprint 1; mensajes de éxito/error, confirmación en acciones sensibles y estados de membresías/accesos visibles. |

**Resultado de la compuerta**: TODAS CUMPLEN. No hay violaciones que justificar.

**Re-evaluación tras la Fase 1 (diseño)**: el diseño generado (`research.md`, `data-model.md`,
`contracts/`, `quickstart.md`) no introduce violaciones: la comparación facial se hace en el
backend sin exponer descriptores (V), los contratos mantienen la matriz de permisos por rol (VI)
y no ofrecen eliminación de historiales (IV, VII), la migración `002` solo agrega las tres
tablas nuevas y el ajuste `NOT NULL` de `pagos.id_membresia` (IV), y no se incorporan
dependencias además de `@vladmandic/face-api` (III). **Compuerta superada tras el diseño.**

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/002-membresias-pagos-acceso-facial/
├── plan.md              # Este archivo (salida de /speckit.plan)
├── research.md          # Salida de la Fase 0 (/speckit.plan)
├── data-model.md        # Salida de la Fase 1 (/speckit.plan)
├── quickstart.md        # Salida de la Fase 1 (/speckit.plan)
├── contracts/           # Salida de la Fase 1 (/speckit.plan)
│   ├── api-membresias.md
│   ├── api-pagos.md
│   ├── api-rostros-accesos.md
│   ├── api-mi-cuenta.md
│   └── api-auditoria.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Salida de la Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── config/          # database.js, entorno.js (ya existen)
│   ├── routes/          # + tipos-membresia, membresias, pagos, rostros, accesos, auditoria
│   ├── controllers/     # + los controladores de cada módulo nuevo
│   ├── services/        # + servicios incluido acceso-facial.service.js y auditoria.service.js
│   ├── models/          # + modelo de acceso con consultas de membresías, pagos, rostros y accesos
│   ├── middlewares/     # autenticacion.js y autorizacion.js existentes, se reutilizan
│   ├── validators/      # + validadores de cada módulo nuevo
│   └── utils/           # respuestas.js existente, se reutiliza
└── tests/
    ├── ayuda/           # base-pruebas.js existente, se reutiliza
    ├── contract/        # + tipos-membresia, membresias, pagos, rostros, accesos, auditoria
    └── integration/     # + historias de US-S2-01 a US-S2-10

frontend/
├── public/
│   └── modelos-faciales/  # pesos locales de la librería facial (sin CDNs)
└── src/
    ├── pages/           # + TiposMembresia.jsx, Membresias.jsx, Pagos.jsx,
    │                    #   PuntoAcceso.jsx, Accesos.jsx; MiCuenta.jsx ampliada
    ├── components/      # + CapturaFacial.jsx, ModalConfirmacion.jsx
    ├── services/        # api.js existente, se amplía con los nuevos recursos
    └── context/         # AuthContext.jsx existente, se reutiliza

database/
├── migrations/         # 001_crear_tablas.sql (Sprint 1) + 002_crear_tablas_sprint2.sql
├── seeds/              # seed-administrador.sql (Sprint 1) + seed-datos-sprint2.sql
└── scripts/            # ejecutar-migraciones.js y crear-base-de-datos.js, se reutilizan
```

**Decisión de estructura**: se conserva la estructura de tres carpetas (`frontend/`, `backend/`
y `database/`) y la organización modular del backend entregada en el Sprint 1
(`specs/001-base-usuarios-clientes`). Los módulos nuevos se añaden siguiendo el mismo patrón
rutas → controladores → servicios → modelos → validadores, sin modificar el comportamiento
entregado salvo los ajustes mínimos de integración previstos en FR-026.

## Seguimiento de Complejidad

Sin violaciones de la constitución que justificar.
