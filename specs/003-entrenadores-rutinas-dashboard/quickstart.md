# Quickstart de validación: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Fecha**: 2026-10-19
**Rama**: `003-entrenadores-rutinas-dashboard`

Guía para validar el sprint de extremo a extremo (principio X). Los detalles de endpoints están
en `contracts/`, y los del modelo de datos en `data-model.md`; aquí solo se describe cómo montar
el entorno y qué comprobar.

## 1. Requisitos previos

- Node.js 20 o superior.
- MySQL local corriendo (por defecto `localhost:3306`).
- El Sprint 2 aplicado (base de datos con membresías, accesos y auditoría).

## 2. Preparación del entorno

```powershell
# Base de datos
cd database
node scripts/crear-base-de-datos.js      # crea la base definida en variables de entorno
node scripts/ejecutar-migraciones.js     # aplica 001, 002 y 003_crear_tablas_sprint3.sql

# Semillas (idempotentes: se detienen si el registro ya existe)
mysql -u root -p gym_sistema < seeds/seed-administrador.sql
mysql -u root -p gym_sistema < seeds/seed-datos-sprint2.sql
mysql -u root -p gym_sistema < seeds/seed-datos-sprint3.sql   # usuarios y clientes de prueba del sprint

# Backend
cd ../backend
Copy-Item .env.example .env # completar credenciales y JWT_SECRET
npm install
npm test                    # pruebas de contrato e integración con node:test + supertest

# Frontend
cd ../frontend
npm install
npm run dev
```

El backend debe responder `GET /api/salud` con estado OK antes de continuar. La semilla
`seed-datos-sprint3.sql` crea el usuario entrenador de prueba (rol `entrenador`) y dos clientes
de ejemplo que usan los escenarios siguientes.

## 3. Escenarios de validación

Cada escenario indica la historia que cubre y el resultado esperado. Los códigos HTTP y los
cuerpos exactos están en los contratos.

### 3.1 Registro de entrenadores (US-S3-01)

1. Entrar como administrador, crear un usuario con rol `entrenador` y luego registrar el
   entrenador con ese `id_usuario`.
2. **Esperado**: el entrenador aparece en `GET /api/entrenadores` con carga 0 (201).
3. Intentar registrar un entrenador con una cuenta inexistente o con rol `cliente`.
   **Esperado**: 400 `USUARIO_INVALIDO`.
4. Intentar registrar un segundo entrenador con la misma cuenta. **Esperado**: 409
   `USUARIO_YA_ASOCIADO`.
5. Intentar crear o modificar un entrenador como recepcionista, entrenador o cliente.
   **Esperado**: 403.
6. Desactivar el entrenador mientras tiene clientes asignados. **Esperado**: sus asignaciones
   quedan cerradas y sus clientes aparecen como pendientes de asignación (FR-001).

### 3.2 Asignación de entrenador a cliente (US-S3-02)

1. Entrar como recepcionista y asignar el entrenador a un cliente activo.
2. **Esperado**: la asignación queda `activa` con su fecha (201) y el cliente figura a cargo del
   entrenador.
3. Intentar asignar un segundo entrenador sin reasignar. **Esperado**: 409
   `ASIGNACION_ACTIVA_EXISTENTE`.
4. Reasignar el cliente a otro entrenador. **Esperado**: la asignación anterior queda `cerrada`
   con fecha, la nueva queda activa y el entrenador anterior ya no ve al cliente (403 en sus
   operaciones).
5. Intentar asignar a un cliente inactivo o un entrenador inactivo. **Esperado**: 400
   `CLIENTE_INACTIVO` / `ENTRENADOR_INACTIVO`.
6. Intentar asignar como entrenador o cliente. **Esperado**: 403.
7. Como entrenador, consultar `GET /api/personal/mi-carga`. **Esperado**: solo sus clientes.

### 3.3 Creación de rutinas (US-S3-03)

1. Entrar como entrenador y crear una rutina con al menos tres ejercicios que especifiquen
   series, repeticiones o instrucciones.
2. **Esperado**: la rutina queda `activa` con sus ejercicios en orden (201) y genera registro de
   auditoría `crear_rutina`.
3. Intentar crear una rutina para un cliente que no está en su carga. **Esperado**: 403.
4. Intentar crear un ejercicio sin series, repeticiones ni instrucciones, o una rutina sin
   ejercicios. **Esperado**: 400 `VALIDACION`.
5. Crear una segunda rutina activa para el mismo cliente. **Esperado**: la anterior pasa a
   `finalizada` (una sola activa por cliente).
6. Modificar los ejercicios de la rutina con `PUT /api/rutinas/:id/ejercicios`. **Esperado**: la
   lista se reemplaza y los progresos ya registrados no cambian.
7. Intentar crear o modificar rutinas como recepcionista o cliente. **Esperado**: 403.

### 3.4 Objetivos y progresos (US-S3-04)

1. Como entrenador, registrar un objetivo para el cliente y luego dos progresos con fecha,
   comentario, peso y cintura (uno de ellos solo con fecha y comentario).
2. **Esperado**: los tres registros quedan en el histórico del cliente (201) y la auditoría
   registra `registrar_objetivo` y `registrar_progreso`.
3. Marcar el objetivo como `cumplido`. **Esperado**: se registra la fecha de cierre.
4. Intentar registrar un progreso sin comentario, o con un objetivo de otro cliente.
   **Esperado**: 400 `VALIDACION`.
5. Intentar registrar objetivos o progresos como recepcionista. **Esperado**: 403 (solo
   consulta).
6. Intentar modificar o eliminar un progreso. **Esperado**: la operación no existe en la API; el
   histórico se conserva (FR-011).
7. Consultar `GET /api/progresos?cliente_id=3`. **Esperado**: los registros vienen ordenados de
   forma cronológica.

### 3.5 Vista propia del cliente (US-S3-05)

1. Entrar como el cliente con rutina activa y progresos.
2. **Esperado**: "Mi entrenamiento" muestra la rutina con sus ejercicios, los objetivos con su
   estado y el histórico cronológico de progresos, y el nombre de su entrenador.
3. Entrar como un cliente sin rutina ni progreso. **Esperado**: el sistema informa
   `sin_rutina_asignada` y `sin_progreso_registrado` con mensajes claros, sin errores.
4. Intentar consultar las rutas de rutinas o progresos de otro cliente como rol cliente.
   **Esperado**: 403.

### 3.6 Dashboard administrativo (US-S3-06)

1. Entrar como administrador y abrir el dashboard.
2. **Esperado**: los indicadores coinciden con los datos registrados: clientes activos,
   membresías vigentes y vencidas, accesos recientes y rechazados, entrenadores registrados y
   activos, clientes con y sin entrenador, rutinas activas, objetivos cumplidos y pendientes con
   su porcentaje, y progresos del periodo.
3. Cambiar el filtro de periodo. **Esperado**: los indicadores se recalculan para ese periodo.
4. Verificar el cálculo del porcentaje de objetivos cumplidos contra los datos del periodo.
   **Esperado**: coincide con la fórmula de `api-dashboard.md`.
5. Registrar un progreso nuevo y volver al dashboard. **Esperado**: el contador de progresos
   refleja el dato nuevo sin recargar datos de otra fuente.
6. Entrar como recepcionista, entrenador y cliente, e intentar abrir el dashboard.
   **Esperado**: 403 en los tres casos (SC-010).
7. Con la base sin datos del sprint (o recién sembrada), abrir el dashboard. **Esperado**: las
   secciones vacías muestran cero con su etiqueta, sin errores.

### 3.7 Carga del personal (US-S3-07)

1. Entrar como recepcionista y consultar `GET /api/personal`.
2. **Esperado**: cada entrenador aparece con su estado, su número de clientes y el detalle con
   fechas; los clientes sin asignación aparecen en "pendientes de asignación".
3. Aplicar el filtro por entrenador. **Esperado**: el listado se acota.
4. Intentar consultar `/api/personal` como entrenador. **Esperado**: 403 (usa
   `GET /api/personal/mi-carga`).
5. Entrar como entrenador y consultar `mi-carga`. **Esperado**: solo su propia carga, sin ver la
   de otros entrenadores.
6. Intentar consultar `/api/personal` como cliente. **Esperado**: 403.

### 3.8 Auditoría y regresión (SC-013, FR-029)

1. Entrar como administrador y consultar la auditoría del Sprint 2.
2. **Esperado**: aparecen las acciones del sprint (`asignar_entrenador`,
   `reasignar_entrenador`, `crear_rutina`, `modificar_rutina`, `registrar_objetivo`,
   `registrar_progreso`) con usuario, módulo, fecha, resultado y descripción; para los demás
   roles responde 403.
3. Repasar los escenarios clave de los Sprints 1 y 2 (login, clientes, membresías, pagos,
   identificación facial y validación de acceso). **Esperado**: siguen funcionando sin cambios
   (FR-029).
