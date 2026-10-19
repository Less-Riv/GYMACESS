# Modelo de Datos: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Funcionalidad**: `001-base-usuarios-clientes`
**Fecha**: 2026-10-09

Motor: **MySQL local**, tablas **InnoDB**, base de datos y tablas con codificación
**`utf8mb4`** (utf8mb4_general_ci). Todos los nombres de tablas y columnas en
minúsculas. Todas las consultas del backend usarán parámetros posicionales (`?`).

## Resumen de entidades

| Tabla | Sprint 1 | Operaciones |
|-------|----------|-------------|
| `usuarios` | Funcional | Crear, consultar, modificar, asignar rol, activar/desactivar (solo administrador) |
| `clientes` | Funcional | Crear, consultar (con campos según rol), modificar; baja lógica |
| `tipos_membresia` | Solo estructura | Sin operaciones funcionales |
| `membresias` | Solo estructura | Sin operaciones funcionales |
| `pagos` | Solo estructura | Sin operaciones funcionales |
| `esquema_migraciones` | Infraestructura | Registro de migraciones ejecutadas |

```text
usuarios                         clientes
  │                                │
  │ FK opcional (rol cliente)      │
  └──────────────────────────────> │
                                   ├──< membresias ──> tipos_membresia
                                   ├──< pagos (FK a membresias)
                                   └──< [Sprint 2] rostros, accesos
```

## Tablas funcionales del Sprint 1

### `usuarios`

Cuentas de acceso al sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id_usuario` | `INT UNSIGNED AUTO_INCREMENT` | PK | Identificador |
| `nombre` | `VARCHAR(100)` | NOT NULL | Nombre del usuario |
| `correo` | `VARCHAR(150)` | NOT NULL, UNIQUE | Correo de acceso (se compara en minúsculas) |
| `password` | `VARCHAR(255)` | NOT NULL | Hash bcrypt (nunca texto plano) |
| `rol` | `ENUM('administrador','recepcionista','entrenador','cliente')` | NOT NULL | Rol del usuario |
| `estado` | `ENUM('activo','inactivo')` | NOT NULL DEFAULT 'activo' | Baja lógica |
| `cliente_id` | `INT UNSIGNED` | NULL, FK → `clientes.id_cliente` (ON DELETE RESTRICT) | Solo cuando `rol = 'cliente'` |
| `fecha_creacion` | `DATETIME` | NOT NULL DEFAULT CURRENT_TIMESTAMP | Alta del registro |

**Reglas de validación** (FR-007, FR-013):
- `nombre` obligatorio; `correo` obligatorio con formato válido y unicidad (rechazo
  409 en conflicto); `password` obligatoria con longitud mínima de 8 caracteres;
  `rol` obligatorio dentro del ENUM.
- La unicidad del correo está garantida también por `UNIQUE` en MySQL, lo que cubre el
  caso límite de registro concurrente.

**Reglas de estado / transiciones**:
- `activo → inactivo` y `inactivo → activo` solo por administrador (FR-006). El
  registro nunca se elimina físicamente (FR-014).
- Un usuario `inactivo` no puede iniciar sesión y su siguiente petición autenticada
  responde 401.

**Integridad referencial**:
- `cliente_id` referencia a `clientes`; solo debe contener valor cuando `rol =
  'cliente'` (validado en el servicio, dado que ENUM y FK no se pueden condicionar en
  MySQL). Un usuario cliente sin `cliente_id` produce un mensaje claro al consultar su
  información (caso límite del spec).
- En el alta con `rol = 'cliente'` el backend resuelve `cliente_id` dentro de una
  **transacción**: reutiliza el cliente con el mismo correo o lo crea con el `nombre`
  del formulario, el `apellido` recibido (cadena vacía si no viene) y ese correo; si
  ese cliente ya tiene usuario responde 409 y si algo falla hace rollback
  (aclaración 2026-10-14). Con otros roles `cliente_id` se ignora y queda NULL.

### `clientes`

Información de los clientes del gimnasio.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id_cliente` | `INT UNSIGNED AUTO_INCREMENT` | PK | Identificador |
| `nombre` | `VARCHAR(100)` | NOT NULL | Obligatorio (FR-013) |
| `apellido` | `VARCHAR(100)` | NOT NULL | Obligatorio (FR-013) |
| `correo` | `VARCHAR(150)` | NOT NULL, UNIQUE | Obligatorio, formato válido (FR-013) |
| `telefono` | `VARCHAR(20)` | NULL | Opcional (aclaración 2026-10-09) |
| `direccion` | `VARCHAR(200)` | NULL | Opcional (aclaración 2026-10-09) |
| `fecha_registro` | `DATETIME` | NOT NULL DEFAULT CURRENT_TIMESTAMP | Fecha automática de alta |
| `estado` | `ENUM('activo','inactivo')` | NOT NULL DEFAULT 'activo' | Baja lógica; inactivo no elegible para nuevas operaciones |

**Visibilidad por rol en la consulta** (FR-011, FR-025, aclaración 2026-10-09):

| Rol | Campos visibles |
|-----|-----------------|
| administrador, recepcionista | Todos los campos |
| entrenador | `nombre`, `apellido`, `telefono`, `estado` (sin correo, dirección ni información financiera) |
| cliente | Solo su propio registro completo (vía `usuarios.cliente_id`) |

**Reglas de estado**: `activo → inactivo` (baja lógica) sin eliminación física; el
cliente inactivo no debe ser elegible para nuevas operaciones (operaciones funcionales
de membresías/pagos corresponden al Sprint 2).

## Tablas de estructura inicial (sin operaciones funcionales — FR-016)

Se crean en este sprint con PK, FK y estado, sin endpoints ni lógica de negocio.

### `tipos_membresia`

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| `id_tipo_membresia` | `INT UNSIGNED AUTO_INCREMENT` | PK |
| `nombre` | `VARCHAR(100)` | NOT NULL |
| `descripcion` | `VARCHAR(255)` | NULL |
| `duracion` | `INT UNSIGNED` | NOT NULL (días) |
| `precio` | `DECIMAL(10,2)` | NOT NULL |
| `estado` | `ENUM('activo','inactivo')` | NOT NULL DEFAULT 'activo' |

### `membresias`

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| `id_membresia` | `INT UNSIGNED AUTO_INCREMENT` | PK |
| `id_cliente` | `INT UNSIGNED` | NOT NULL, FK → `clientes` (ON DELETE RESTRICT) |
| `id_tipo_membresia` | `INT UNSIGNED` | NOT NULL, FK → `tipos_membresia` (ON DELETE RESTRICT) |
| `fecha_inicio` | `DATE` | NOT NULL |
| `fecha_fin` | `DATE` | NOT NULL |
| `estado` | `ENUM('activo','vencida','suspendida','cancelada')` | NOT NULL DEFAULT 'activo' (RN-04) |

### `pagos`

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| `id_pago` | `INT UNSIGNED AUTO_INCREMENT` | PK |
| `id_cliente` | `INT UNSIGNED` | NOT NULL, FK → `clientes` (ON DELETE RESTRICT) |
| `id_membresia` | `INT UNSIGNED` | NULL, FK → `membresias` (ON DELETE RESTRICT) |
| `monto` | `DECIMAL(10,2)` | NOT NULL |
| `fecha_pago` | `DATETIME` | NOT NULL DEFAULT CURRENT_TIMESTAMP |
| `metodo_pago` | `VARCHAR(50)` | NULL (definición pendiente para Sprint 2) |
| `estado` | `ENUM('completado','pendiente','cancelado')` | NOT NULL DEFAULT 'completado' |

> Nota: el estado por defecto de `pagos` es provisional y no tiene funcionalidad en el
> Sprint 1; la política de pagos se define en la planificación del Sprint 2.

### `esquema_migraciones` (infraestructura)

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| `nombre` | `VARCHAR(255)` | PK (nombre del archivo de migración) |
| `fecha_ejecucion` | `DATETIME` | NOT NULL DEFAULT CURRENT_TIMESTAMP |

## Reglas de validación cruzadas

- **FR-013 — Validación de entrada**: campos obligatorios, formato de correo, longitud
  de contraseña (mínimo 8) y unicidad de correo verificada tanto en la capa de servicio
  como por `UNIQUE` en MySQL.
- **FR-015 — Consultas parametrizadas**: todas las operaciones contra MySQL usarán
  placeholders `?` (mysql2); se prohíbe concatenar entradas del usuario en SQL.
- **FR-002 — bcrypt**: `password` se almacena siempre con hash bcrypt
  (`bcrypt.hash`, factor de costo por defecto o ≥ 10) y se verifica con
  `bcrypt.compare`.
- **Baja lógica (FR-014)**: ninguna sentencia `DELETE` sobre `usuarios` ni `clientes`
  en el código de aplicación del Sprint 1.

## Transiciones de estado de sesión (complemento del modelo)

| Evento | Efecto |
|--------|--------|
| Login correcto (usuario activo) | JWT emitido con expiración de 8 h (FR-024) |
| Login con credenciales inválidas o usuario inexistente | 401, mensaje genérico idéntico en ambos casos |
| Login de usuario inactivo | 401, sin revelar el motivo específico |
| Token expirado | 401; el frontend cierra sesión y redirige al login |
| Usuario desactivado con sesión activa | La siguiente petición autenticada responde 401 |
