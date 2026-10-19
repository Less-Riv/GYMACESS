# Investigación: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Funcionalidad**: `001-base-usuarios-clientes`
**Fecha**: 2026-10-09

Este documento resuelve todas las incógnitas del "Contexto Técnico" del `plan.md` y las
"Decisiones Pendientes" de la constitución aplicables al Sprint 1. Cada decisión está
pendiente de aprobación del equipo antes de implementarse (constitución, sección
Gobernanza).

## D1 — Driver de acceso a MySQL

**Decisión**: usar `mysql2` en modo promesa (`mysql2/promise`) como driver directo,
sin ORM.

**Justificación**: es el driver estándar y más mantenido para MySQL con Node.js;
permite consultas parametrizadas nativas (`?`), que cumplen FR-015 sin configura adicional;
su API con promesas encaja con ES Modules. Un ORM añadiría complejidad y dependencias
innecesarias para cinco tablas (constitución: "NO se deben agregar tecnologías o
dependencias innecesarias").

**Alternativas consideradas**:
- *Sequelize/Knex/Prisma*: aportan migraciones y mapeo, pero exigen configuración y
  peso adicional innecesarios; las migraciones ya se exigen como SQL versionado (FR-023).
- *mysql (callback)*: API con callbacks, peor integración con `async/await`.

## D2 — Herramienta de build del frontend

**Decisión**: Vite con el plugin oficial de React (`@vitejs/plugin-react`), en modo JS
(sin TypeScript).

**Justificación**: configuración mínima, arranque instantáneo, es el estándar de facto
para React en 2026 y no impone opiniones de arquitectura. El proxy de Vite a
`http://localhost:3000/api` en desarrollo evita configurar CORS de forma insegura.

**Alternativas consideradas**:
- *Create React App*: en descontinuación de facto; no conviene iniciarlo hoy.
- *Next.js*: aporta SSR/routing de servidor, innecesario para una app local detrás de
  una API REST propia (constitución: frontend solo consume la API).

## D3 — Estrategia de manejo de estado en React

**Decisión**: estado local con `useState`/`useEffect` + contexto global mínimo
(`AuthContext`) para la sesión (token JWT y usuario autenticado). Datos de listados en
estado de página, sin librería externa.

**Justificación**: el Sprint 1 tiene una única pieza de estado global real (la sesión);
una librería de estado global es una dependencia injustificada. La sesión se hidrata
desde `localStorage` y se valida contra el backend.

**Alternativas consideradas**:
- *Redux/Zustand*: resuelven problemas de estado compartido que este sprint no tiene.
- *TanStack Query*: buena para caché de datos, pero añade una capa más; puede
  reconsiderarse en el Sprint 2 si la caché de datos se vuelve relevante.

## D4 — Estrategia de validación de formularios y entradas

**Decisión**: validación de entrada exclusivamente en el backend con módulos
`validators/` propios (expresiones regulares y comprobaciones manuales); el frontend
repite las comprobaciones solo como ayuda de UX, nunca como medida de seguridad.

**Justificación**: la constitución exige que la validación ocurra en el backend y que no
se agreguen dependencias innecesarias. Con reglas acotadas (correo, longitud de
contraseña, campos obligatorios de FR-013) un validador propio es suficiente y claro.

**Alternativas consideradas**:
- *express-validator/joi/zod*: robustas para esquemas complejos; se evaluarán si el
  Sprint 2 agrega muchos endpoints con reglas elaboradas.

## D5 — Estrategia de pruebas

**Decisión**: `node:test` (runner nativo de Node.js) + `supertest` para pruebas de la
API en dos niveles:
- **Contrato**: verifica códigos HTTP, formatos JSON y mensajes de los endpoints
  descritos en `contracts/api.md`.
- **Integración**: ejecutan el flujo real contra una base de datos de prueba
  (`gym_test`) creada por los scripts de `database/scripts/`, verificando persistencia,
  hash bcrypt y autorización por rol.

El frontend del Sprint 1 se valida manualmente con `quickstart.md` (las pruebas de
componentes pueden añadirse en sprints posteriores con Vitest si el equipo lo aprueba).

**Justificación**: runner nativo = cero dependencias de framework; supertest es la
librería estándar mínima para probar servidores Express; la constitución exige probar
autenticación, roles y clientes antes de dar por terminada cada función.

**Alternativas consideradas**:
- *Jest/Vitest*: más funciones (mocking, jsdom) de las que se necesitan aquí.
- *Playwright end-to-end*: valioso, pero fuera del mínimo del sprint; se plantea para el
  Sprint 2 si el equipo lo aprueba.

## D6 — Patrón de autenticación y sesión

**Decisión**: JWT de acceso único con expiración de **8 horas** (FR-024, decisión de
clarificación), payload `{ id_usuario, rol }`, firmado con `HS256` y el secreto
`JWT_SECRET` de variables de entorno. Sin refresh token en este sprint. El middleware de
autenticación verifica el token en cada petición a rutas protegidas; un segundo
middleware de autorización compara el rol contra la ruta solicitada. La baja lógica de
un usuario se comprueba en cada petición (usuario desactivado → 401), lo que cubre el
caso "desactivado con sesión activa".

**Alternativas consideradas**:
- *Refresh tokens*: aumentan la superficie de seguridad y el almacenamiento en el
  frontend; innecesarios con sesiones de 8 horas en un sistema de uso diurno.
- *Sesiones con cookies httpOnly*: igual de válidas, pero la constitución fija JWT.

## D7 — Estrategia de errores de la API

**Decisión**: middleware central de errores al final del encadenamiento de Express.
Todas las respuestas de error siguen el envelope:

```json
{ "mensaje": "texto claro para el usuario", "codigo": "CODIGO_INTERNO" }
```

Los códigos HTTP: 400 (validación), 401 (sin autenticar/token inválido/usuario
desactivado), 403 (autorización), 409 (conflicto de unicidad), 500 (error interno con
mensaje genérico sin detalles del servidor). Los errores de MySQL se traducen a este
envelope sin exponer mensajes ni stack traces (FR-020, constitución IX).

## D8 — Formato de paginación del listado de clientes

**Decisión**: parámetros `pagina` (por defecto 1) y `limite` fijo en 20 (FR-027);
respuesta:

```json
{
  "clientes": [ ... ],
  "pagina": 1,
  "limite": 20,
  "total": 57,
  "totalPaginas": 3
}
```

**Justificación**: contrato REST predecible, evita respuestas de crecimiento
ilimitado y satisface SC-003 sin sobre-diseñar.

## D9 — Semilla y primer acceso

**Decisión**: `database/seeds/seed-administrador.sql` crea un usuario administrador
inicial con correo y contraseña definidos en `database/README.md` (contraseña hasheada
con bcrypt generada y fijada en la semilla; el correo y la contraseña documentados son
de desarrollo). Ejecutable de forma idempotente (`INSERT ... ON DUPLICATE KEY UPDATE`
o verificación previa por correo).

**Justificación**: garantiza el "Supuesto" del spec (usuario semilla) sin
auto-registro de usuarios, que está fuera de alcance.

## D10 — Orden de migraciones

**Decisión**: scripts numerados `001_crear_tablas.sql`, `002_semilla_administrador.sql`
(movido a `seeds/`), ejecutados por `database/scripts/ejecutar-migraciones.js` (ES
Modules) que lee el orden por nombre de archivo y registra las ejecutadas en una tabla
`esquema_migraciones`. MySQL no soporta "migraciones" nativas; este mecanismo manual
cumple FR-023 (reconstrucción total desde cero).

**Alternativas consideradas**:
- *Knex migrations*: violaría D1 (sin query builder) y añadiría dependencia.

## Riesgos identificados

| Riesgo | Mitigación |
|--------|------------|
| Correo duplicado concurrente entre dos administradores | Restricción `UNIQUE` en MySQL (autoridad final) + manejo de error 1062 → HTTP 409. |
| Token robado dentro de las 8 horas | Expiración acotada; HTTPS queda fuera del alcance local; sin refresh token que prolongue la sesión. |
| Frontend mostrando datos que el backend ya filtró por rol | El backend selecciona los campos visibles del entrenador (FR-025) en la consulta SQL; el frontend nunca filtra como única barrera. |
| Password del usuario semilla conocido en repositorio | Solo en semilla/README de desarrollo; documentado como credencial de demo, no de producción. |

## Salida

Todas las incógnitas del Contexto Técnico están resueltas. Sin `NEEDS CLARIFICATION`
pendientes. La Fase 1 (modelo de datos, contratos, quickstart) puede proceder.
