# Quickstart de validación: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Fecha**: 2026-10-15
**Rama**: `002-membresias-pagos-acceso-facial`

Guía para validar el sprint de extremo a extremo (principio X). Los detalles de endpoints están
en `contracts/`, y los del modelo de datos en `data-model.md`; aquí solo se describe cómo
montar el entorno y qué comprobar.

## 1. Requisitos previos

- Node.js 20 o superior.
- MySQL local corriendo (por defecto `localhost:3306`).
- Cámara web funcional conectada al equipo de escritorio (para los escenarios faciales).

## 2. Preparación del entorno

```powershell
# Base de datos (incluye la base de pruebas usada por las pruebas de integración)
cd database
node scripts/crear-base-de-datos.js      # crea la base definida en variables de entorno
node scripts/ejecutar-migraciones.js     # aplica 001_crear_tablas.sql y 002_crear_tablas_sprint2.sql

# Semillas iniciales (idempotentes: se detienen si el registro ya existe)
mysql -u root -p gym_sistema < seeds/seed-administrador.sql
mysql -u root -p gym_sistema < seeds/seed-datos-sprint2.sql   # tipos Mensual y Trimestral

# Backend
cd ../backend
Copy-Item .env.example .env # completar credenciales y JWT_SECRET
npm install
npm test                    # pruebas de contrato e integración con node:test + supertest

# Frontend
cd ../frontend
npm install
# Copiar los pesos del modelo facial a public/modelos-faciales/ desde node_modules/@vladmandic/face-api/model
npm run dev
```

El backend debe responder `GET /api/salud` con estado OK antes de continuar. El seed
`database/seeds/seed-administrador.sql` crea el usuario administrador inicial, y
`database/seeds/seed-datos-sprint2.sql` crea los tipos "Mensual" (30 días, 500.00) y
"Trimestral" (90 días, 1350.00) que usan los escenarios siguientes.

## 3. Escenarios de validación

Cada escenario indica la historia que cubre y el resultado esperado. Los códigos HTTP y los
cuerpos exactos están en los contratos.

### 3.1 Tipos de membresía (US-S2-01)

1. Entrar como administrador y crear un tipo "Mensual" con duración 30 y precio 500.
2. **Esperado**: el tipo aparece en el listado (201).
3. Intentar crear un tipo sin nombre o con duración 0. **Esperado**: 400 con mensaje claro.
4. Modificar el precio del tipo. **Esperado**: el cambio persiste y las membresías existentes
   siguen ligadas al tipo.
5. Entrar como recepcionista y consultar `GET /api/tipos-membresia`. **Esperado**: 200, pero
   solo con los tipos activos (necesita elegir el tipo al asignar o renovar; SC-001).
6. Intentar crear o modificar un tipo como recepcionista. **Esperado**: 403.

### 3.2 Asignación de membresía (US-S2-02)

1. Registrar un cliente y entrar como recepcionista.
2. Asignar el tipo "Mensual" con fecha de inicio de hoy.
3. **Esperado**: la membresía queda con estado activo, fecha de inicio hoy y fecha de fin hoy +
   30 días.
4. Intentar asignar una segunda membresía al mismo cliente. **Esperado**: 409 con mensaje "una
   única membresía activa por cliente".
5. Intentar asignar con rol entrenador o cliente. **Esperado**: 403.

### 3.3 Renovación (US-S2-03)

1. Con una membresía activa, renovarla. **Esperado**: la fecha de fin se extiende 30 días más
   desde su fecha de fin actual.
2. Probar con una membresía vencida (insertar/ajustar fecha fin en la base de pruebas).
   **Esperado**: la renovación también extiende la vigencia.
3. Con una membresía suspendida (marcada fuera de la aplicación). **Esperado**: 409, y el
   mensaje indica que debe crearse una membresía nueva.

### 3.4 Pagos y adeudos (US-S2-04, US-S2-05)

1. Registrar un pago parcial en efectivo (250) sobre la membresía del cliente. **Esperado**:
   201 y el pago en el historial con fecha del servidor.
2. Intentar con método "tarjeta". **Esperado**: 400 (solo efectivo y transferencia).
3. Intentar pagar contra una membresía de otro cliente. **Esperado**: 409.
4. Como administrador, consultar el adeudo del cliente. **Esperado**: saldo 250 (500 − 250).
5. Como recepcionista, intentar consultar adeudos. **Esperado**: 403.
6. Intentar eliminar un pago. **Esperado**: no existe la operación; el registro persiste.

### 3.5 Registro facial (US-S2-06)

1. Entrar como recepcionista, abrir el registro facial del cliente y capturar el rostro con la
   cámara (luz frontal, sin contraluz).
2. **Esperado**: el estado del registro cambia a "completo"; la consulta del estado no devuelve
   ningún dato biométrico.
3. Capturar de nuevo el mismo cliente. **Esperado**: se actualiza el registro, sin duplicados.
4. Intentar con rol entrenador o cliente. **Esperado**: 403.

### 3.6 Identificación y validación de acceso (US-S2-07, US-S2-08)

1. Abrir el punto de acceso (rol recepcionista o administrador) y presentar el rostro del
   cliente con membresía activa. **Esperado**: el sistema lo identifica por nombre y autoriza el
   ingreso; hay un registro en accesos con resultado "autorizado".
2. Presentar un rostro no registrado. **Esperado**: "No se reconoció tu rostro. Intenta de nuevo
   o consulta al personal."; el intento queda registrado como rechazado con motivo
   identificacion_no_reconocida.
3. Repetir con un cliente cuya membresía está vencida. **Esperado**: identificado, pero acceso
   rechazado con motivo membresia_vencida (sin tolerancia).
4. Con una membresía suspendida o cancelada (marcada fuera de la aplicación). **Esperado**:
   rechazo con el motivo correspondiente.
5. Verificar en la consulta de accesos que los cuatro intentos anteriores aparecen con su
   resultado y motivo.

### 3.7 Consulta de accesos por rol (US-S2-09)

1. Administrador y recepcionista: listado completo con filtros de fecha y resultado.
2. Entrenador: vista básica (cliente, fecha, hora, resultado), sin motivos.
3. Cliente: intentar ver el listado del gimnasio. **Esperado**: 403.

### 3.8 Mis datos del cliente (US-S2-10)

1. Entrar como cliente con membresía, pagos y accesos registrados.
2. Abrir "Mi cuenta". **Esperado**: membresía con tipo, fechas, días restantes y estado; pagos
   con monto, fecha y método; adeudo con el saldo pendiente; accesos propios con resultado.
3. Registrar el resto del pago. **Esperado**: saldo 0.00 y estado "al_corriente".
4. Probar con un cliente sin membresía. **Esperado**: mensaje claro "sin membresía asignada",
   sin errores ni datos vacíos.
5. Intentar con el cliente consultar datos de otro cliente (por ejemplo, modificando la
   petición). **Esperado**: 403.

### 3.9 Auditoría (FR-016)

1. Tras los escenarios anteriores, entrar como administrador y consultar
   `GET /api/auditoria`. **Esperado**: aparecen asignaciones, renovaciones, pagos, registros
   faciales y resultados de acceso, cada uno con usuario, acción, módulo, fecha y resultado.
2. Filtrar por fecha y por módulo (por ejemplo, `?fecha=2026-10-15&modulo=accesos`).
   **Esperado**: la respuesta se acota a esos criterios.
3. Revisar las descripciones de los registros faciales y de acceso. **Esperado**: no contienen
   ningún dato biométrico (ni descriptor, ni distancia, ni imagen).
4. Intentar con recepcionista, entrenador o cliente. **Esperado**: 403.

## 4. Pruebas automatizadas

```powershell
cd backend
npm test
```

**Esperado**: todas las pruebas de contrato e integración del Sprint 1 y del Sprint 2 pasan
(sin regresiones del Sprint 1: FR-026). En el frontend:

```powershell
cd frontend
npm run build
```

**Esperado**: la compilación termina sin errores.

## 5. Criterios de éxito verificables al cierre

Los SC-001 a SC-011 de `spec.md` se verifican con los escenarios anteriores; el flujo completo
del sprint (crear tipo → asignar membresía → registrar pago → registrar rostro → identificar →
validar → registrar acceso → revisar "Mi cuenta") es el SC-009.
