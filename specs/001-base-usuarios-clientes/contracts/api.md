# Contrato de la API REST: Sprint 1

**Funcionalidad**: `001-base-usuarios-clientes`
**Fecha**: 2026-10-09

Base URL en desarrollo: `http://localhost:3000/api`. Todas las respuestas usan JSON.
Todas las rutas marcadas con 🔒 requieren el encabezado `Authorization: Bearer <token>`.

## Convenciones generales

### Autenticación

- `POST /api/auth/login` → cuerpo `{ "correo": "...", "password": "..." }`.
- Respuesta exitosa (200):

```json
{
  "token": "<JWT, expiración 8 horas>",
  "usuario": {
    "id_usuario": 1,
    "nombre": "Ana",
    "correo": "ana@gimnasio.test",
    "rol": "administrador"
  }
}
```

- Credenciales incorrectas, correo inexistente o usuario inactivo → **401** con el
  mismo mensaje genérico: `{ "mensaje": "Credenciales inválidas", "codigo": "AUTH_CREDENCIALES" }`.

### Manejo de errores (envelope único)

```json
{ "mensaje": "texto claro para el usuario", "codigo": "CODIGO_INTERNO" }
```

| Código HTTP | Cuándo | Ejemplo de `codigo` |
|-------------|--------|---------------------|
| 400 | Validación de entrada fallida | `VALIDACION` |
| 401 | Sin token, token inválido/expirado, usuario inactivo | `AUTH_REQUERIDA`, `AUTH_CREDENCIALES`, `AUTH_TOKEN` |
| 403 | Rol insuficiente para la operación | `AUTORIZACION` |
| 409 | Conflicto de unicidad (correo duplicado) | `CONFLICTO_CORREO` |
| 500 | Error interno (mensaje genérico, sin detalles del servidor) | `INTERNO` |

El backend nunca expone stack traces ni detalles internos de MySQL.

### Paginación (listado de clientes)

Parámetros de consulta: `pagina` (entero ≥ 1, por defecto 1). El límite de página es fijo
en 20 registros (FR-027).

```json
{
  "clientes": [],
  "pagina": 1,
  "limite": 20,
  "total": 0,
  "totalPaginas": 0
}
```

## Matriz de permisos del Sprint 1

| Operación | admin | recepcionista | entrenador | cliente |
|-----------|:-----:|:-------------:|:----------:|:-------:|
| Login | ✅ | ✅ | ✅ | ✅ |
| Gestionar usuarios (crear, consultar, modificar, rol, activar/desactivar) | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| Registrar clientes | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Modificar clientes | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Listar clientes | ✅ (todos los campos) | ✅ (todos los campos) | ✅ (solo nombre, apellido, teléfono, estado) | ❌ 403 |
| Ver cliente por id | ✅ | ✅ | ✅ (campos restringidos) | ❌ 403 (solo el propio) |
| Consultar mi información (cliente autenticado) | ❌ | ❌ | ❌ | ✅ (solo la propia) |

La autorización se valida **siempre** en el backend (FR-005); ocultar opciones en el
frontend no es una medida de seguridad.

## Endpoints

### Auth

| Método y ruta | Autenticación | Descripción | Respuestas |
|---------------|---------------|-------------|------------|
| `POST /api/auth/login` | Pública | Inicia sesión (FR-001) | 200, 400, 401 |

### Usuarios (solo administrador — FR-006)

| Método y ruta | Descripción | Cuerpo | Respuestas |
|---------------|-------------|--------|------------|
| `POST /api/usuarios` 🔒 | Crea usuario (FR-007); con `rol: "cliente"` crea o reutiliza el cliente en la misma transacción | `{ nombre, apellido?, correo, password, rol }` | 201, 400, 403, 409, 500 |
| `GET /api/usuarios` 🔒 | Lista usuarios | — | 200, 403 |
| `GET /api/usuarios/:id` 🔒 | Detalle de usuario | — | 200, 403, 404 |
| `PATCH /api/usuarios/:id` 🔒 | Modifica nombre, correo o password | `{ nombre?, correo?, password? }` | 200, 400, 403, 404, 409 |
| `PATCH /api/usuarios/:id/rol` 🔒 | Asigna rol (FR-008) | `{ rol }` | 200, 400, 403, 404 |
| `PATCH /api/usuarios/:id/estado` 🔒 | Activa/desactiva | `{ estado }` (`activo`\|`inactivo`) | 200, 400, 403, 404 |

- `password` siempre viaja como texto plano en el cuerpo (HTTPS fuera del alcance
  local) y se almacena con hash bcrypt; nunca se devuelve en las respuestas.
- **Alta con `rol: "cliente"`** (aclaración 2026-10-14): el cuerpo NO acepta
  `cliente_id`. Dentro de **una transacción de MySQL** el backend busca en
  `clientes` un registro con el mismo correo; si no existe lo crea con el `nombre`
  del formulario, el `apellido` recibido (cadena vacía si no viene) y ese mismo
  correo, y si ya existe lo reutiliza. Después crea el usuario con
  `cliente_id` igual al id del cliente. Si el cliente ya tiene un usuario
  asociado responde **409** `{ "mensaje": "Ya existe un usuario para este cliente",
  "codigo": "CONFLICTO_CLIENTE_USUARIO" }`. Si algo falla se hace **rollback**:
  no quedan clientes ni usuarios a medias (500 con mensaje genérico).
- Con cualquier otro rol no se crea cliente y un `cliente_id` enviado en el cuerpo
  se **ignora** (el usuario queda con `cliente_id` en NULL).
- Asignar `rol: "cliente"` vía `PATCH /api/usuarios/:id/rol` sí requiere
  `cliente_id` válido de un cliente existente (la vinculación manual existente se
  mantiene); asignar otro rol deja `cliente_id` en NULL.

### Clientes (FR-009, FR-010, FR-011, FR-012, FR-025, FR-027)

| Método y ruta | Operadores | Descripción | Respuestas |
|---------------|------------|-------------|------------|
| `POST /api/clientes` 🔒 | admin, recepcionista | Registra cliente (FR-009) | 201, 400, 403, 409 |
| `GET /api/clientes` 🔒 | admin, recepcionista, entrenador | Lista paginada (FR-011, FR-027); el entrenador recibe campos restringidos (FR-025) | 200, 403 |
| `GET /api/clientes/:id` 🔒 | admin, recepcionista, entrenador | Detalle; campos según rol | 200, 403, 404 |
| `PATCH /api/clientes/:id` 🔒 | admin, recepcionista | Modifica cliente (FR-010) | 200, 400, 403, 404 |
| `GET /api/clientes/mi-cuenta` 🔒 | cliente | Consulta la información propia; mensaje claro si el usuario no tiene cliente asociado (FR-012) | 200, 403, 404 |

Cuerpo de registro/modificación de cliente:

```json
{
  "nombre": "María",
  "apellido": "López",
  "correo": "maria@correo.test",
  "telefono": "5512345678",
  "direccion": "Calle Falsa 123"
}
```

Obligatorios: `nombre`, `apellido`, `correo` (formato válido y único). Opcionales:
`telefono`, `direccion` (aclaración 2026-10-09). `fecha_registro` y `estado` los gestiona
el servidor.

### Salud del servicio

| Método y ruta | Autenticación | Descripción | Respuesta |
|---------------|---------------|-------------|-----------|
| `GET /api/salud` | Pública | Comprobación de vida del backend | 200 `{ "estado": "ok" }` |

> `GET /api/salud` es un endpoint de infraestructura para el quickstart y las pruebas;
> no agrega funcionalidad fuera del alcance.

## Ejemplo de recorrido completo (SC-007)

1. `POST /api/auth/login` con el usuario semilla → token de administrador.
2. `POST /api/usuarios` crea un recepcionista → 201.
3. `POST /api/auth/login` como recepcionista → 200.
4. `POST /api/clientes` → 201; `GET /api/clientes` lo lista.
5. `PATCH /api/clientes/:id` modifica el teléfono → 200; verificar con `GET`.
6. Crear un usuario `cliente` (el backend crea o reutiliza el cliente con el mismo
   correo) y `GET /api/clientes/mi-cuenta` con su token → solo sus datos.
7. Repetir pasos clave con un entrenador y verificar que no ve correo, dirección, ni
   puede gestionar usuarios (403).
