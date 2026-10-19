# Sistema de Gestión para Gimnasio

Sistema web de gestión para gimnasio: clientes, usuarios, roles, autenticación,
membresías, pagos, reconocimiento facial y control de acceso.
Proyecto académico desarrollado con **React** (frontend), **Node.js con Express**
(backend) y **MySQL local** (base de datos).

> **Estado**: Sprint 2 — membresías, pagos y adeudos, registro e identificación
> facial y control de acceso (ver `docs/sprint-2.md`).

## Estructura del proyecto

```text
├── frontend/          # Aplicación React (JavaScript, Vite)
│   ├── public/        # Pesos del modelo facial (modelos-faciales/)
│   └── src/           # pages/, components/, services/, context/
├── backend/           # API REST con Express y ES Modules
│   └── src/           # config/, routes/, controllers/, services/, models/,
│                      # middlewares/, validators/, utils/
├── database/          # Scripts SQL versionados de MySQL
│   ├── migrations/    # Estructura de tablas (InnoDB, utf8mb4)
│   ├── seeds/         # Usuario administrador y datos de prueba
│   └── scripts/       # Utilidades en ES Modules
├── docs/              # Contexto del proyecto, reglas y alcance de sprints
└── specs/             # Especificaciones y planes de cada funcionalidad
```

## Requisitos

- Node.js 20 o superior.
- MySQL 8.x en ejecución local, con un **usuario dedicado** para la aplicación
  (no `root`); ver `database/README.md`.

## Puesta en marcha

1. **Variables de entorno** (credenciales de desarrollo):

   ```bash
   cp backend/.env.example backend/.env
   # Editar backend/.env con los datos de tu MySQL local
   ```

2. **Base de datos**:

   ```bash
   node database/scripts/crear-base-de-datos.js
   node database/scripts/ejecutar-migraciones.js
   ```

   Las migraciones `001_crear_tablas.sql` y `002_crear_tablas_sprint2.sql` dejan la
   estructura completa del sistema (tablas base y tablas `tipos_membresia`,
   `membresias`, `pagos`, `rostros`, `accesos` y `auditoria`).

3. **Semillas** (ambas idempotentes: se detienen si el registro ya existe):

   ```bash
   mysql -u root -p gym_sistema < database/seeds/seed-administrador.sql
   mysql -u root -p gym_sistema < database/seeds/seed-datos-sprint2.sql
   ```

   El usuario administrador semilla queda creado con estas credenciales de
   desarrollo (almacenadas con hash bcrypt):

   - Correo: `admin@gimnasio.test`
   - Contraseña: `Admin1234!`

   La segunda semilla crea los tipos de membresía "Mensual" (30 días, 500.00) y
   "Trimestral" (90 días, 1350.00) que usan los escenarios de membresías y pagos.

4. **Backend** (puerto 3000):

   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. **Frontend** (puerto 5173, con proxy hacia el backend):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Para los módulos faciales hay que copiar los pesos del modelo una sola vez
   (el paquete no expone un comando de copia, se hace a mano):

   ```bash
   cd frontend
   # PowerShell
   New-Item -ItemType Directory -Force public/modelos-faciales
   Copy-Item node_modules/@vladmandic/face-api/model/* public/modelos-faciales/
   ```

   Abrir `http://localhost:5173`.

## Pruebas

```bash
cd backend
npm test
```

Si MySQL no está disponible, las pruebas de integración se omiten con un
aviso (las pruebas que no requieren motor se ejecutan igualmente).

La guía de validación completa de extremo a extremo está en
`specs/001-base-usuarios-clientes/quickstart.md` y
`specs/002-membresias-pagos-acceso-facial/quickstart.md`.

## Roles del sistema

| Rol | Funciones en el Sprint 2 |
|-----|--------------------------|
| administrador | Gestión completa de usuarios, roles y clientes; tipos de membresía; asignar y renovar membresías; pagos y consulta de adeudos; registrar y consultar rostros; punto de acceso y consulta completa de accesos; auditoría |
| recepcionista | Registrar y modificar clientes; consultar tipos activos para asignar o renovar; asignar y renovar membresías; registrar pagos; registrar rostros; identificar en el punto de acceso; consulta completa de accesos |
| entrenador | Consultar clientes y membresías (solo lectura); consulta básica de accesos, **sin** motivos de rechazo |
| cliente | Únicamente "Mi cuenta": su membresía, sus pagos, su adeudo y sus accesos |

Los permisos se validan **siempre** en el backend; ocultar opciones en la
interfaz no es una medida de seguridad.

## Módulos del Sprint 2

| Módulo | Rutas | Notas |
|--------|-------|-------|
| Tipos de membresía | `/tipos-membresia` | Alta y modificación solo administrador |
| Membresías | `/membresias` | Una membresía activa por cliente; estados activo, vencido, suspendido y cancelado |
| Pagos y adeudos | `/pagos` | Efectivo y transferencia, pagos parciales, sin anulación |
| Registro facial | ficha del cliente | Descriptor de 128 componentes; nunca se guardan imágenes |
| Punto de acceso | `/punto-acceso` | Identifica, valida la membresía y registra el resultado |
| Consulta de accesos | `/accesos` | Vista completa o básica según el rol |
| Mi cuenta | `/mi-cuenta` | Reservado al cliente autenticado |
| Auditoría | backend | `GET /api/auditoria`, solo administrador |

### Configuración del reconocimiento facial

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `FACIAL_UMBRAL` | Distancia euclidiana máxima para considerar que dos descriptores son la misma persona. A menor valor, más estricto. | `0.5` |

Los pesos del modelo viven en `frontend/public/modelos-faciales/` y **no** se
versionan dentro de `node_modules`; se copian al preparar el entorno.

## Seguridad

- Contraseñas almacenadas con hash bcrypt (nunca en texto plano).
- Autenticación mediante JWT con expiración de 8 horas.
- Secretos en variables de entorno; `.env` está en `.gitignore` y existe
  `.env.example` sin valores reales.
- Consultas parametrizadas contra MySQL (sin inyección SQL).
- Sin eliminación física de usuarios, clientes, membresías, pagos ni accesos:
  la baja es lógica por estado.
- **Datos biométricos**: solo se almacena el descriptor facial (128 números).
  No se guardan imágenes ni fotogramas, y ni las respuestas ni la auditoría
  exponen descriptores ni distancias.
- La identificación facial solo se puede invocar desde un endpoint
  autenticado; no existe una ruta pública de identificación.
- Los resultados del control de acceso son de solo escritura para el backend
  (no existen operaciones de modificación ni borrado).

## Documentación relacionada

- `docs/project-context.md` — contexto maestro del proyecto.
- `docs/reglas.md` — reglas y principios del desarrollo (constitución).
- `docs/sprint-1.md` — alcance detallado del Sprint 1.
- `docs/sprint-2.md` — alcance detallado del Sprint 2.
- `database/README.md` — instrucciones de la base de datos.
