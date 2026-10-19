# Plan de Implementación: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Rama**: `001-base-usuarios-clientes` | **Fecha**: 2026-10-09 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/001-base-usuarios-clientes/spec.md`

## Resumen

Construir la base del Sistema de Gestión para Gimnasio: estructura del proyecto
(`frontend/`, `backend/`, `database/`), autenticación con JWT y bcrypt, gestión de
usuarios y roles (exclusiva del administrador), y registro, consulta y modificación de
clientes con permisos por rol validados en el backend. La base de datos MySQL local se
crea con scripts SQL versionados (InnoDB, `utf8mb4`), incluyendo las tablas
`tipos_membresia`, `membresias` y `pagos` como estructura inicial sin operaciones
funcionales. El backend usa Node.js con Express y ES Modules; el frontend usa React con
JavaScript consumiendo únicamente la API REST.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022+); Node.js 20 LTS en backend y scripts de
`database/`; frontend React 18 con navegador moderno (Chrome/Edge/Firefox actuales).

**Dependencias Principales**:
- Backend: `express`, `mysql2` (driver con soporte de promesas y consultas parametrizadas),
  `bcrypt`, `jsonwebtoken`, `dotenv`; `cors` para desarrollo local del frontend.
- Frontend: `react`, `react-dom`, `react-router-dom`; herramienta de build Vite;
  sin librería de componentes externa (CSS propio) para cumplir "sin dependencias
  innecesarias".
- Pruebas backend: `node:test` (nativo) + `supertest`.

**Almacenamiento**: MySQL local (InnoDB, `utf8mb4`), reconstruible desde
`database/migrations/` con semilla administradora en `database/seeds/`. Tablas del
sprint: `usuarios`, `clientes` (operativas); `tipos_membresia`, `membresias`, `pagos`
(solo estructura).

**Pruebas**: `node:test` + `supertest` para pruebas de contrato e integración de la API
(pueden ejecutarse contra una base de datos de prueba creada por scripts); pruebas
manuales end-to-end según `quickstart.md`.

**Plataforma Objetivo**: Aplicación web local (navegador + servidor Node.js en
`localhost`); base de datos MySQL local.

**Tipo de Proyecto**: Aplicación web (frontend React + backend Express + base de datos).

**Metas de Rendimiento**: latencia de respuesta de la API < 300 ms para operaciones
CRUD en el entorno de desarrollo; el listado de clientes responde 20 registros por
página (FR-027).

**Restricciones**: JWT con expiración de 8 horas (FR-024); contraseñas con bcrypt y
nunca en texto plano; permisos validados exclusivamente en el backend; variables de
entorno para secretos (`.env` ignorado por Git, `.env.example` sin secretos); ES
Modules obligatorio en backend y scripts de `database/` (sin `require` ni
`module.exports`); sin eliminación física de usuarios y clientes (baja lógica por
estado); frontend sin acceso directo a MySQL.

**Escala/Alcance**: gimnasio de tamaño pequeño/medio; orden de magnitud esperado: cientos
de clientes y decenas de usuarios; 7 historias de usuario, 5 tablas tocadas, ~20
endpoints REST.

## Verificación de la Constitución *(GATE)*

Debe pasar antes de la investigación de la Fase 0. Revisada tras el diseño de la Fase 1.

| Principio | Estado | Evidencia en el diseño |
|-----------|--------|------------------------|
| I. Alcance, MVP y fuente de verdad | ✅ Pasa | Solo alcance de Sprint 1; membresías, pagos funcionales y reconocimiento facial quedan fuera (FR-016, FR-026). |
| II. Arquitectura con responsabilidades separadas | ✅ Pasa | Carpetas `frontend/`, `backend/`, `database/`; backend modular (routes, controllers, services, models, middlewares, validators, utils). |
| III. Stack tecnológico y base de datos local | ✅ Pasa | React + Node.js/Express + MySQL local; JWT + bcrypt; InnoDB + `utf8mb4`; usuario de MySQL dedicado (no `root`); variables de entorno. |
| IV. Base de datos y persistencia | ✅ Pasa | Modelo relacional con claves primarias/foráneas; migraciones y semillas versionadas; sin archivos físicos en el repositorio. |
| V. Seguridad y protección de información | ✅ Pasa | bcrypt, `.env` fuera de Git, `.env.example`, validación de entradas en backend, mensajes de error sin detalles internos. |
| VI. Roles y permisos | ✅ Pasa | Cuatro roles definidos; matriz de permisos del Sprint 1 en `contracts/`; validación de autorización en backend. |
| VII. Integridad de reglas de negocio | ✅ Pasa | Cliente registrado antes de cualquier relación futura; sin borrado físico. |
| VIII. Reconocimiento facial | ✅ Pasa | Sin instalación ni procesamiento facial en Sprint 1; solo estructura preparada (FR-017, FR-026). |
| IX. API y manejo de errores | ✅ Pasa | API REST JSON, middleware de autenticación y autorización, manejo de errores centralizado. |
| X. Pruebas | ✅ Pasa | Autenticación, validación de roles, registro y modificación de clientes incluidos en la estrategia de pruebas. |
| XI. UX/UI profesional y sencilla | ✅ Pasa | Frontend con mensajes de éxito/error, confirmación en acciones destructivas, estados claros. |

**Resultado del GATE**: ✅ Sin violaciones; no se requiere tabla de justificación de
complejidad. La decisión de driver (`mysql2` directo), librería de componentes (ninguna,
CSS propio) y estrategia de estado (Context API) queda documentada en `research.md`
como recomendación del equipo (constitución: "Decisiones Pendientes" requieren
aprobación del equipo antes de implementar).

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-base-usuarios-clientes/
├── plan.md              # Este archivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/           # Fase 1
│   └── api.md
└── tasks.md             # Fase 2 (/speckit.tasks, no creado por este comando)
```

### Código fuente (raíz del repositorio)

```text
frontend/
├── package.json
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── pages/            # Login, Clientes, ClienteDetalle, MiCuenta, Usuarios
    ├── components/       # Formularios, tablas, mensajes
    └── services/         # Cliente HTTP con token (fetch)

backend/
├── package.json          # "type": "module"
├── .env.example
└── src/
    ├── config/           # pool de MySQL, variables de entorno
    ├── routes/           # auth, usuarios, clientes
    ├── controllers/      # authController, usuariosController, clientesController
    ├── services/         # lógica de negocio (auth, usuarios, clientes)
    ├── models/           # consultas parametrizadas (mysql2)
    ├── middlewares/      # autenticacion (JWT), autorizacion (roles), errores
    ├── validators/       # validación de datos de entrada
    └── utils/            # helpers (respuestas, errores)

backend/tests/            # node:test + supertest (contrato e integración)

database/
├── README.md
├── migrations/           # 001_*.sql (tablas), numerados
├── seeds/                # usuario administrador semilla
└── scripts/              # scripts ES Modules (crear BD, ejecutar migraciones)

.gitignore                # incluye .env
.env.example              # raíz del backend, sin secretos
README.md
```

**Decisión de estructura**: se adopta la opción de aplicación web (frontend + backend +
database) impuesta por la constitución (Principio II) y `docs/sprint-1.md` §10. No se
crean carpetas alternativas (`client/`, `server/`, `dataBase/`) (FR-019). El backend
sigue la estructura modular exigida en `docs/sprint-1.md` (routes, controllers,
services, models, middlewares, validators, utils).

## Seguimiento de Complejidad

> Completar SOLO si la Verificación de la Constitución tiene violaciones que deban justificarse.

Sin violaciones. Tabla no aplicable.
