# Contrato de la API REST: Entrenadores y asignaciones (Sprint 3)

**Funcionalidad**: `003-entrenadores-rutinas-dashboard`
**Fecha**: 2026-10-19

Base URL en desarrollo: `http://localhost:3000/api`. Todas las respuestas usan JSON y todas las
rutas marcadas con 🔒 requieren `Authorization: Bearer <token>`. Los errores usan el envelope
del Sprint 1: `{ "mensaje": "...", "codigo": "CODIGO_INTERNO" }` (ver
`specs/001-base-usuarios-clientes/contracts/api.md`).

## Matriz de permisos

| Operación | admin | recepcionista | entrenador | cliente |
|-----------|:-----:|:-------------:|:----------:|:-------:|
| Consultar entrenadores (listado del personal) | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Crear / modificar entrenador | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| Asignar / reasignar entrenador a cliente | ✅ | ✅ | ❌ 403 | ❌ 403 |
| Consultar asignaciones | ✅ (todas) | ✅ (todas) | ✅ (solo las suyas) | ❌ 403 |
| Consultar la carga del personal | ✅ | ✅ | ✅ (solo su propia carga) | ❌ 403 |

## Endpoints

### Entrenadores

#### `GET /api/entrenadores` 🔒 admin, recepcionista

Lista los entrenadores con su carga (clientes activos asignados). El administrador ve todos;
el recepcionista solo los activos.

```json
{ "entrenadores": [ { "id_entrenador": 1, "nombre": "Ana López", "telefono": "...", "correo_contacto": "...", "estado": "activo", "clientes_asignados": 4 } ] }
```

#### `POST /api/entrenadores` 🔒 admin

Cuerpo: `{ "id_usuario": 5, "nombre": "Ana López", "telefono": "5512345678", "correo_contacto": "ana@gimnasio.test" }`.

- **201** con el entrenador creado.
- **400** `VALIDACION`: id_usuario vacío o nombre vacío.
- **400** `USUARIO_INVALIDO`: la cuenta no existe, está inactiva o su rol no es `entrenador`
  (RN-15, FR-002).
- **409** `USUARIO_YA_ASOCIADO`: la cuenta ya pertenece a otro entrenador (RN-15).

#### `PUT /api/entrenadores/:id` 🔒 admin

Cuerpo con los campos a modificar (nombre, telefono, correo_contacto, estado).

- **200** con el entrenador actualizado.
- **404** `NO_ENCONTRADO` si el id no existe.
- **400** `VALIDACION` con los mismos criterios del alta.
- Efecto especial (FR-001, investigación §6): al pasar `estado = "inactivo"`, el backend cierra
  en la misma operación las asignaciones activas de ese entrenador (`fecha_fin` = hoy), y sus
  clientes quedan como pendientes de asignación.

### Asignaciones

#### `POST /api/asignaciones` 🔒 admin, recepcionista

Cuerpo: `{ "id_cliente": 3, "id_entrenador": 1, "fecha_asignacion": "2026-10-19" }`
(`fecha_asignacion` opcional; por defecto hoy).

- **201** con la asignación creada:

```json
{ "asignacion": { "id_asignacion": 9, "id_cliente": 3, "id_entrenador": 1, "fecha_asignacion": "2026-10-19", "estado": "activa" } }
```

- **400** `VALIDACION`: cliente o entrenador inexistente.
- **400** `CLIENTE_INACTIVO`: el cliente no está activo (RN-01).
- **400** `ENTRENADOR_INACTIVO`: el entrenador no está activo (RN-15).
- **409** `ASIGNACION_ACTIVA_EXISTENTE`: el cliente ya tiene un entrenador principal activo
  (RN-16, FR-004); se debe usar la reasignación.

#### `PUT /api/asignaciones/:id` 🔒 admin, recepcionista

Reasigna el cliente de esa asignación a otro entrenador. Cuerpo: `{ "id_entrenador": 2 }`.

- **200** con la asignación nueva; la anterior queda `cerrada` con su `fecha_fin` (RN-16,
  RN-17; el entrenador anterior pierde acceso a ese cliente, FR-004).
- **404** `NO_ENCONTRADO` si no existe o ya está cerrada.
- **400** `ENTRENADOR_INACTIVO` / `VALIDACION` como en el alta.
- Auditoría: `accion = reasignar_entrenador`, `modulo = asignaciones` (FR-020).

#### `GET /api/asignaciones?cliente_id=3&entrenador_id=1` 🔒 admin, recepcionista, entrenador

Lista asignaciones con el cliente y el entrenador. El entrenador solo recibe las suyas
(propias de su carga); los clientes y entrenadores inactivos se muestran con su estado
(RN-19, FR-006).

### Personal asignado (US-S3-07)

#### `GET /api/personal` 🔒 admin, recepcionista

Vista del equipo con la carga de trabajo; admite filtros `entrenador_id` y `estado_asignacion`
(`activa`/`cerrada`).

```json
{ "personal": [ { "id_entrenador": 1, "nombre": "Ana López", "estado": "activo", "clientes_asignados": 4, "clientes": [ { "id_cliente": 3, "nombre": "Luis Pérez", "fecha_asignacion": "2026-10-19" } ] } ],
  "pendientes_de_asignacion": [ { "id_cliente": 8, "nombre": "Marta Ruiz" } ] }
```

- **403** para entrenador y cliente (FR-015; el entrenador usa su propia carga, abajo).

#### `GET /api/personal/mi-carga` 🔒 entrenador

Devuelve únicamente la carga del entrenador autenticado (clientes asignados con su fecha de
asignación), con la misma forma que el listado anterior. Para cualquier rol distinto del
entrenador responde **403** `AUTORIZACION`: esta ruta es específica del entrenador (el
administrador y el recepcionista usan `/api/personal`).
