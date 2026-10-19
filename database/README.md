# Base de datos del Sistema de Gestión para Gimnasio

Estructura de scripts SQL versionados para MySQL local (InnoDB, `utf8mb4`).

## Estructura

```text
database/
├── migrations/   # Scripts numerados que crean o alteran tablas
├── seeds/        # Datos iniciales (administrador y tipos de membresía)
├── scripts/      # Utilidades en ES Modules (Node.js)
└── README.md     # Este archivo
```

## Requisitos

- MySQL 8.x ejecutándose en local (`localhost:3306` por defecto).
- Un **usuario de MySQL dedicado** para la aplicación (no `root` en el funcionamiento
  normal, conforme a la constitución Principio III). Ejemplo de creación (ejecutado por
  un administrador del motor):

  ```sql
  CREATE USER 'gimnasio_app'@'localhost' IDENTIFIED BY 'clave_segura';
  GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
    ON gym_sistema.* TO 'gimnasio_app'@'localhost';
  FLUSH PRIVILEGES;
  ```

- Node.js 20+ para ejecutar los scripts de `scripts/`.
- Variables de entorno configuradas (copiar `backend/.env.example` a `backend/.env`).

## Cómo reconstruir la base desde cero (SC-006)

```bash
node database/scripts/crear-base-de-datos.js
node database/scripts/ejecutar-migraciones.js
```

El script de migraciones aplica en orden alfabético los archivos pendientes y los
registra en la tabla `esquema_migraciones`. Los archivos físicos de MySQL no se
suben al repositorio (FR-023).

| Migración | Contenido |
|-----------|-----------|
| `001_crear_tablas.sql` | `usuarios`, `clientes`, `tipos_membresia`, `membresias`, `pagos` |
| `002_crear_tablas_sprint2.sql` | `rostros`, `accesos`, `auditoria` y el ajuste de `pagos.id_membresia` |

## Semillas

### `seeds/seed-administrador.sql`

Crea el usuario inicial que garantiza el primer acceso:

| Campo | Valor |
|-------|-------|
| Correo | `admin@gimnasio.test` |
| Contraseña | `Admin1234!` (solo para desarrollo; almacenada con hash bcrypt) |
| Rol | `administrador` |

> Esta credencial es exclusiva del entorno de desarrollo y demostración. La semilla es
> idempotente: reejecutarla no duplica el usuario.

### `seeds/seed-datos-sprint2.sql`

Crea los tipos de membresía que usan los escenarios de membresías, pagos y "Mi cuenta":

| Tipo | Duración | Precio |
|------|----------|--------|
| Mensual | 30 días | 500.00 |
| Trimestral | 90 días | 1350.00 |

> También es idempotente: cada tipo se inserta solo si no existe ya otro con ese nombre.

```bash
mysql -u root -p gym_sistema < database/seeds/seed-administrador.sql
mysql -u root -p gym_sistema < database/seeds/seed-datos-sprint2.sql
```

## Tablas

| Tabla | Sprint | Estado |
|-------|:------:|--------|
| `usuarios` | 1 | Funcional (crear, consultar, modificar, rol, activar/desactivar) |
| `clientes` | 1 | Funcional (crear, consultar, modificar; baja lógica) |
| `tipos_membresia` | 2 | Funcional (alta, consulta y modificación por el administrador) |
| `membresias` | 2 | Funcional (asignación y renovación; una activa por cliente) |
| `pagos` | 2 | Funcional (registros de pago inmutables y consulta de adeudos) |
| `rostros` | 2 | Funcional (descriptor de 128 componentes; índice único por cliente) |
| `accesos` | 2 | Funcional (solo inserción y consulta; sin modificación ni borrado) |
| `auditoria` | 2 | Funcional (solo inserción por el backend y consulta del administrador) |
| `esquema_migraciones` | 1 | Infraestructura de migraciones |

Ningún registro de `usuarios`, `clientes`, `membresias`, `pagos`, `rostros` ni `accesos`
se elimina físicamente (FR-014); la baja es lógica mediante el campo `estado`.

## Datos biométricos

La tabla `rostros` almacena **únicamente** el descriptor facial como JSON de 128 números
calculados en el navegador. No se guardan imágenes, fotogramas ni rutas de archivo, y la
tabla no tiene ninguna columna de imagen. El umbral de comparación se controla con la
variable de entorno `FACIAL_UMBRAL` (por defecto `0.5`).
