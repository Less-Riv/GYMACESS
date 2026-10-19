# Contrato de la API REST: Auditoría (Sprint 2)

**Funcionalidad**: `002-membresias-pagos-acceso-facial`
**Fecha**: 2026-10-15

Consulta de la tabla `auditoria` con las acciones funcionales de este sprint (FR-016,
`docs/project-context.md` §7.10). Convenciones y envelope: idénticos al Sprint 1.

## Matriz de permisos

| Operación | admin | recepcionista | entrenador | cliente |
|-----------|:-----:|:-------------:|:----------:|:-------:|
| Consultar auditoría | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |

Las inserciones las realiza el propio backend en cada acción registrada (asignar y renovar
membresías, registrar pagos, registrar rostros y resultados del control de acceso); ningún
cliente las envía directamente.

## Endpoints

### `GET /api/auditoria?fecha=2026-10-15&modulo=membresias` 🔒 admin

Lista registros con usuario, acción, módulo, fecha, resultado y descripción. Los filtros de
fecha y módulo son opcionales.

```json
{ "registros": [ { "id_auditoria": 3, "usuario": "Ana", "accion": "asignar membresia", "modulo": "membresias", "fecha": "2026-10-15T10:20:00", "resultado": "exitoso", "descripcion": "Membresía 7 asignada al cliente 1" } ] }
```

- **403** `AUTORIZACION` para cualquier otro rol.
- Las descripciones nunca contienen datos biométricos (research.md §6).
