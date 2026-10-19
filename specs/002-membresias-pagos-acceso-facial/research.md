# Investigación: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Fecha**: 2026-10-15
**Rama**: `002-membresias-pagos-acceso-facial`
**Plan asociado**: [plan.md](./plan.md)

Este documento resuelve todas las decisiones técnicas pendientes de `docs/sprint-2.md` §9 y de
la sección "Decisiones Pendientes" de la constitución (`docs/reglas.md`) aplicables a este
sprint, tal como exige FR-010: la librería de reconocimiento facial y su procesamiento no se
eligen de forma arbitraria.

## 1. Librería de reconocimiento facial

**Decisión**: `@vladmandic/face-api` (instalada en el frontend, pesos del modelo servidos
localmente desde `frontend/public/modelos-faciales/`).

**Justificación**:

- Es un fork activamente mantenido de `face-api.js`, con licencia MIT (uso gratuito, adecuado
  para proyecto académico) y compatible con TensorFlow.js en navegador (backend WebGL).
- Funciona en JavaScript puro con React: detecta rostros y genera un descriptor facial de 128
  dimensiones, que es exactamente lo que el sistema necesita para identificar clientes.
- No requiere servicios externos ni claves de API: todo se procesa en el equipo local
  (principio III, herramientas gratuitas o de bajo costo, sin servicios externos no aprobados).
- Sus pesos de modelo se distribuyen en el propio paquete npm, por lo que se copian a
  `frontend/public/modelos-faciales/` y se sirven en local (sin CDN en tiempo de ejecución).

**Alternativas consideradas**:

- `face-api.js` (original): sin mantenimiento desde 2020 y ligado a versiones antiguas de
  TensorFlow.js; descartado por obsolescencia.
- `@tensorflow-models/face-landmarks-detection` (MediaPipe): excelente detección de
  landmarks, pero no produce descriptores de identificación; requeriría entrenar un modelo
  propio, fuera de alcance y del conocimiento del equipo.
- APIs comerciales (Azure Face, AWS Rekognition): servicios externos con costo y con
  implicaciones de privacidad; prohibidos por `docs/sprint-2.md` §8.
- `opencv.js`: peso elevado en el navegador y sin descriptores listos para identificación;
  descartado por complejidad.

## 2. Lugar de procesamiento facial

**Decisión**: combinación frontend + backend (opción prevista en FR-010):

1. **Frontend** (`CapturaFacial.jsx` + `@vladmandic/face-api`): captura el rostro con
   `getUserMedia`, detecta la cara y calcula el descriptor de 128 números.
2. **Backend**: recibe el descriptor por una API REST autenticada, lo almacena en `rostros`,
   lo compara con los descriptores registrados, decide la identificación, valida la membresía
   y registra el resultado en `accesos`.

**Justificación**:

- Los datos biométricos de los clientes nunca llegan al frontend: el navegador solo calcula
  un descriptor a partir de la captura en vivo de la persona que está frente a la cámara, y
  el backend nunca devuelve descriptores almacenados (FR-017, principio V).
- Evita instalar `@tensorflow/tfjs-node` en el backend, una dependencia nativa (node-gyp)
  propensa a fallos de compilación en Windows, innecesaria cuando la comparación es aritmética
  simple (distancia euclidiana) que el backend hace en JavaScript puro sin dependencias.
- La comparación se hace siempre en el mismo entorno (el navegador del gimnasio), por lo que
  los descriptores de registro y de identificación son consistentes entre sí.

**Alternativas consideradas**:

- Todo en el backend: exigiría `tfjs-node` (compilación nativa) o enviar la imagen en base64
  por cada intento; más pesado y más frágil de instalar.
- Todo en el frontend: obligaría a enviar los descriptores de todos los clientes al
  navegador, exponiendo datos biométricos crudos; incompatible con FR-017.

## 3. Umbral de coincidencia

**Decisión**: identificación por distancia euclidiana ponderada entre el descriptor capturado y
cada descriptor registrado, con umbral **0.5** (valor por defecto recomendado por la documentación
de la librería), configurable mediante la variable de entorno `FACIAL_UMBRAL` y documentable en
`research.md` sin cambiar código. Si la menor distancia es menor o igual al umbral, hay
identificación; si no, se rechaza (por seguridad, ante empates o dudas no se identifica).

**Justificación**: cumple FR-011 (umbral por defecto de la librería, configurable) y el caso
límite de "rostros parecidos cerca del umbral" (se rechaza en lugar de arriesgar una
identificación errónea).

**Alternativas consideradas**: umbral fijo más estricto (0.3) o más laxo (0.6): descartados
porque ajustarlos sin datos reales del gimnasio empeoraría la tasa de rechazos correctos o
aceptaría falsos positivos; el umbral queda configurable para ajuste posterior.

## 4. Captura de cámara

**Decisión**: `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })` en el
navegador de escritorio, con el video mostrado en pantalla para que el usuario se posicione; la
captura se toma en un `<canvas>` y se envía al proceso facial en el mismo navegador
(animación `requestAnimationFrame`). Condiciones: luz frontal sin contraluz (FR-011). La cámara
de prueba es la webcam USB o integrada del equipo de desarrollo.

**Justificación**: es la API estándar de los navegadores, sin dependencias adicionales, y
cumple FR-025 (cámara web estándar desde navegador de escritorio).

## 5. Almacenamiento de la información facial

**Decisión**: la tabla `rostros` almacena **únicamente el descriptor** como arreglo JSON de 128
números en una columna `TEXT`, con un registro por cliente (índice único sobre `id_cliente`),
fecha de registro y estado. **No se almacenan imágenes faciales**, ni temporales: la captura
vive solo en la memoria del navegador durante el registro o la identificación y se descarta.

**Justificación**: cumple FR-017 y el principio V (mínima exposición de información biométrica),
y responde la pregunta §9 "si se almacenarán únicamente descriptores o también imágenes
temporales". Re-capturar es trivial (se repite el registro), mientras que almacenar imágenes
agregaría riesgo sin valor para el MVP.

**Alternativas consideradas**: columna `BLOB` con los 128 floats en binario (más compacta,
512 bytes frente a ~1.7 KB de JSON): se descarta por legibilidad y por la simplicidad de
depurar valores en texto; el ahorro es irrelevante a esta escala. Almacenar imágenes: descartado
por el punto anterior.

## 6. Protección de los datos biométricos

**Decisión**: varias capas, todas verificables:

1. Los descriptores **nunca** se devuelven en ninguna respuesta de la API; los endpoints de
   `rostros` solo exponen el estado del registro (completo/pendiente) y metadatos.
2. Los endpoints de registro facial requieren JWT con rol administrador o recepcionista.
3. El endpoint de identificación del punto de acceso requiere JWT con rol administrador o
   recepcionista (la recepción opera el equipo del punto de acceso); no existe ningún endpoint
   biométrico público.
4. La comparación se hace en el backend sin escribir los descriptores en registros de auditoría
   ni en mensajes de error.

**Justificación**: principio V, FR-017 y FR-021; un endpoint público de identificación permitiría
sondear quién está registrado, algo que la constitución prohíbe implícitamente al exigir permisos
validados en backend.

## 7. Métodos de pago y adeudos (respuesta Q2)

**Decisión**: catálogo cerrado `efectivo` y `transferencia` (validado en backend, FR-020);
pagos parciales permitidos; adeudo = precio vigente del tipo de la membresía del cliente menos
la suma de sus pagos registrados; sin operación de anulación (RN-06).

## 8. Política de membresías (respuesta Q1) y suspensión (respuesta Q4)

**Decisión**: una única membresía activa por cliente; la renovación extiende la fecha de
finalización de la misma membresía sumando la duración del tipo elegido; estados renovables
activo y vencido; sin tolerancia tras el vencimiento; los estados suspendida y cancelada solo se
consideran en la validación de acceso, sin operación de cambio de estado en este sprint (se
marcan directamente en la base de datos si el gimnasio las necesita).

## 9. Identificación y acceso (respuesta Q3)

**Decisión**: reintentos ilimitados con cada intento registrado en `accesos`; mensaje "No se
reconoció tu rostro. Intenta de nuevo o consulta al personal."; la validación de membresía solo
ocurre tras una identificación exitosa (RN-09) y todo intento genera registro (RN-10, RN-11).

## 10. Vistas propias del cliente (respuesta Q5)

**Decisión**: el cliente consulta en "Mi cuenta" su membresía (con días restantes y estado),
sus pagos, su adeudo y su historial de accesos, siempre filtrados por el cliente autenticado
(FR-028); cualquier consulta sobre datos de otro cliente responde HTTP 403.

## 11. Acceso a datos (decisión heredada del Sprint 1)

**Decisión**: mantener `mysql2/promise` con pool de conexiones y consultas parametrizadas
(`backend/src/config/database.js`), sin ORM ni query builder.

**Justificación**: ya está entregado, probado y cumple el principio III; introducir un ORM en el
Sprint 2 agregaría dependencia y rework sin beneficio.

**Alternativas consideradas**: Sequelize o Knex: descartados por la justificación anterior.

## 12. Auditoría funcional de este sprint (§9)

**Decisión**: la tabla `auditoria` se crea en este sprint y se registra una entrada por cada
acción de este módulo: asignación y renovación de membresías, registro de pagos, registro de
información facial y resultados del control de acceso; campos según `docs/project-context.md`
§7.10 (usuario, acción, módulo, fecha, resultado, descripción). La consulta es exclusiva del
administrador (FR-016). No se auditan acciones del Sprint 1 (ya entregado).

## 13. Frontend: estado, componentes y estilos (decisiones pendientes de la constitución)

**Decisión**:

- **Estado**: estado local de componentes + `AuthContext` existente; no se incorpora librería de
  estado global (Redux/Zustand) porque el alcance no lo requiere.
- **Componentes**: sin librería de componentes; se reutilizan los patrones y `estilos.css` del
  Sprint 1, agregando `CapturaFacial.jsx` y `ModalConfirmacion.jsx` (confirmaciones del
  principio XI).
- **Pruebas**: se mantiene `node:test` + `supertest` (contrato e integración), la estrategia ya
  aprobada en el Sprint 1.

**Justificación**: principio III ("no agregar tecnologías o dependencias innecesarias") y
continuidad con la base entregada.

## 14. Decisiones fuera del alcance de este sprint

- **Reportes y dashboard**: diseño final y método de generación quedan para el Sprint 3
  (fuera de alcance de `docs/sprint-2.md` §8).
- **Método de despliegue en línea**: no se requiere; la demostración es local.

## Resumen de pendientes §9 resueltos

| Pendiente de `docs/sprint-2.md` §9 | Decisión |
|------------------------------------|----------|
| Librería de reconocimiento facial | `@vladmandic/face-api` (MIT, mantenida) |
| Compatibilidad con React y Node.js | Se usa en React (navegador); el backend compara con aritmética simple en JS puro |
| Lugar de procesamiento | Combinado: frontend calcula descriptor, backend almacena y compara |
| Forma de captura | `getUserMedia` + `<canvas>`, luz frontal sin contraluz |
| Almacenamiento de descriptores | Columna `TEXT` (JSON de 128 floats) en `rostros`, un registro por cliente |
| Protección de datos biométricos | Sin devolución de descriptores, endpoints autenticados, sin imágenes |
| Descriptores vs imágenes temporales | Solo descriptores; sin imágenes almacenadas |
| Umbral de coincidencia | 0.5 por defecto de la librería, configurable vía `FACIAL_UMBRAL` |
| Condiciones de iluminación | Luz frontal sin contraluz |
| Cámara de prueba | Webcam del equipo de escritorio |
| Intentos fallidos | Reintentos ilimitados, cada intento registrado |
| Máximo de intentos | Sin límite |
| Mensaje al no reconocer | "No se reconoció tu rostro. Intenta de nuevo o consulta al personal." |
| Métodos de pago | Efectivo y transferencia |
| Pagos parciales | Permitidos; adeudo = precio vigente − pagos registrados |
| Membresías suspendidas | Solo en validación de acceso; sin operación en este sprint |
| Tolerancia para vencidas | Ninguna |
| Renovación antes de finalizar | Permitida en estado activo; extiende la fecha de finalización |
| Reglas de auditoría funcionales | Acciones del sprint en `auditoria`; consulta exclusiva del administrador |
