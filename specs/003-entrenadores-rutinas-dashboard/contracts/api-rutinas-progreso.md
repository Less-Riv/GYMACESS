# Contrato de la API REST: Rutinas, objetivos y progreso (Sprint 3)

**Funcionalidad**: `003-entrenadores-rutinas-dashboard`
**Fecha**: 2026-10-19

Base URL en desarrollo: `http://localhost:3000/api`. Todas las respuestas usan JSON y todas las
rutas marcadas con 🔒 requieren `Authorization: Bearer <token>`. Los errores usan el envelope
del Sprint 1 (`{ "mensaje": "...", "codigo": "CODIGO_INTERNO" }`).

## Matriz de permisos

| Operación | admin | recepcionista | entrenador | cliente |
|-----------|:-----:|:-------------:|:----------:|:-------:|
| Consultar rutinas | ✅ (todas) | ✅ (todas) | ✅ (solo de su carga) | ❌ 403 (la propia, en `/api/mi-entrenamiento`) |
| Crear / modificar rutina | ❌ 403 | ❌ 403 | ✅ (solo de su carga) | ❌ 403 |
| Consultar objetivos y progresos | ✅ (todos) | ✅ (solo consulta) | ✅ (solo de su carga) | ❌ 403 (los propios, en `/api/mi-entrenamiento`) |
| Registrar objetivo o progreso | ❌ 403 | ❌ 403 | ✅ (solo de su carga) | ❌ 403 |
| Modificar objetivo | ❌ 403 | ❌ 403 | ✅ (solo de su carga) | ❌ 403 |
| Modificar o eliminar progreso | ❌ 403 | ❌ 403 | ❌ 403 (no existe la operación) | ❌ 403 |

> El recepcionista **consulta** el entrenamiento de los clientes pero **no lo edita**
> (RN-20, US-S3-04 esc. 5).

## Rutinas

#### `GET /api/rutinas?cliente_id=3&estado=activa` 🔒 admin, recepcionista, entrenador

Lista rutinas con sus ejercicios. El entrenador solo recibe las de su carga (RN-19); los filtros
son opcionales.

```json
{ "rutinas": [ { "id_rutina": 4, "id_cliente": 3, "id_entrenador": 1, "nombre": "Full body inicial", "descripcion": "...", "estado": "activa", "fecha_creacion": "2026-10-19", "ejercicios": [ { "id_ejercicio_rutina": 11, "nombre": "Sentadilla", "series": 3, "repeticiones": "10-12", "carga": "20 kg", "instrucciones": "Bajar controlado", "orden": 1 } ] } ] }
```

#### `POST /api/rutinas` 🔒 entrenador

Cuerpo:

```json
{ "id_cliente": 3, "nombre": "Full body inicial", "descripcion": "Plan de las primeras 4 semanas", "ejercicios": [ { "nombre": "Sentadilla", "series": 3, "repeticiones": "10-12", "instrucciones": "Bajar controlado" } ] }
```

- **201** con la rutina creada y sus ejercicios.
- **403** `AUTORIZACION`: el cliente no está asignado al entrenador autenticado (RN-19).
- **400** `VALIDACION`: nombre vacío, lista de ejercicios vacía, ejercicio sin series,
  repeticiones ni instrucciones, o series ≤ 0 (RN-18, FR-008).
- Efecto (FR-009): si el cliente ya tenía una rutina activa, esta queda `finalizada`; el
  cliente siempre tiene como máximo una rutina activa.
- Auditoría: `accion = crear_rutina`, `modulo = rutinas` (FR-020).

#### `PUT /api/rutinas/:id` 🔒 entrenador

Cuerpo con los campos a modificar (nombre, descripcion). Solo el entrenador que la creó y que
aún tenga al cliente en su carga (FR-004, RN-19).

- **200** con la rutina actualizada; los progresos ya registrados no se alteran (US-S3-03
  esc. 6).
- **404** `NO_ENCONTRADO` si no existe.
- **403** `AUTORIZACION` si el cliente ya no está asignado a ese entrenador.
- Auditoría: `accion = modificar_rutina`, `modulo = rutinas`.

#### `PUT /api/rutinas/:id/ejercicios` 🔒 entrenador

Reemplaza la lista de ejercicios de la rutina en su conjunto (mismo cuerpo que el campo
`ejercicios` del alta). Mismos códigos y validaciones que el alta.

## Objetivos

#### `POST /api/objetivos` 🔒 entrenador

Cuerpo: `{ "id_cliente": 3, "descripcion": "Reducir cintura a 85 cm", "fecha_objetivo": "2026-12-31" }`
(`fecha_objetivo` opcional).

- **201** con el objetivo creado (estado `pendiente`).
- **403** `AUTORIZACION` si el cliente no está en la carga del entrenador (RN-19, RN-21).
- **400** `VALIDACION` si la descripción está vacía.
- Auditoría: `accion = registrar_objetivo`, `modulo = objetivos` (FR-020).

#### `GET /api/objetivos?cliente_id=3&estado=cumplido` 🔒 admin, recepcionista, entrenador

Lista objetivos. El entrenador solo los de su carga; el recepcionista solo consulta (RN-20).

#### `PUT /api/objetivos/:id` 🔒 entrenador

Cuerpo: `{ "estado": "en_curso" }` (valores: `pendiente`, `en_curso`, `cumplido`, `cancelado`).

- **200** con el objetivo actualizado; al pasar a `cumplido` o `cancelado`, el backend registra
  `fecha_cierre` con la fecha de hoy (FR-010).
- **404** `NO_ENCONTRADO`; **403** `AUTORIZACION` si no es de su carga.

## Progresos

#### `POST /api/progresos` 🔒 entrenador

Cuerpo (peso, medidas y objetivo son opcionales; sesión 2026-10-19):

```json
{ "id_cliente": 3, "fecha": "2026-10-19", "comentario": "Buena sesión, mejora en sentadilla", "peso": 82.5, "cintura": 88.0, "id_objetivo": 2 }
```

- **201** con el progreso registrado.
- **403** `AUTORIZACION` si el cliente no está en la carga del entrenador (RN-19).
- **400** `VALIDACION`: comentario vacío, peso ≤ 0 o medida negativa; `id_objetivo` que no
  pertenezca al mismo cliente (FR-011).
- Auditoría: `accion = registrar_progreso`, `modulo = progresos` (FR-020).

#### `GET /api/progresos?cliente_id=3&desde=2026-09-01&hasta=2026-10-19` 🔒 admin, recepcionista, entrenador

Lista progresos ordenados por fecha ascendente para comparar la evolución (RN-17, FR-012). El
entrenador solo los de su carga; los filtros de periodo son opcionales.

- **No existe** `PUT` ni `DELETE` sobre progresos: el histórico es inmutable (FR-011, RN-17).

## Vista propia del cliente (US-S3-05)

#### `GET /api/mi-entrenamiento` 🔒 cliente

Devuelve **solo** los datos del cliente autenticado (FR-013, FR-022):

```json
{ "entrenador": { "nombre": "Ana López" },
  "rutina_activa": { "id_rutina": 4, "nombre": "Full body inicial", "fecha_actualizacion": "2026-10-19", "ejercicios": [ { "nombre": "Sentadilla", "series": 3, "repeticiones": "10-12", "instrucciones": "Bajar controlado", "orden": 1 } ] },
  "objetivos": [ { "descripcion": "Reducir cintura a 85 cm", "estado": "en_curso", "fecha_objetivo": "2026-12-31" } ],
  "progresos": [ { "fecha": "2026-10-19", "comentario": "...", "peso": "82.50", "cintura": "88.0" } ] }
```

- Sin rutina activa: `rutina_activa` viene en `null` y `mensaje` = `sin_rutina_asignada`
  (FR-014).
- Sin registros de progreso: `progresos` viene vacío y `mensaje` = `sin_progreso_registrado`
  (FR-014).
- Cualquier intento de consultar la ruta de otro cliente no aplica: el filtro siempre es el
  usuario autenticado (RN-22); consultar rutas de rutinas ajenas como cliente responde **403**.
