// Pruebas de contrato de rutinas (T024, US3; contracts/api-rutinas-progreso.md).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  tokenDePrueba,
  SEMILLA,
} from '../ayuda/base-pruebas.js';

let disponible = false;
let tokens = {};
let ids = {};
const app = crearApp();

async function crearCuenta(correo, rol) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [resultado] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    [`Contrato ${rol}`, correo, hash, rol]
  );
  return resultado.insertId;
}

async function crearFicha(correo, nombre) {
  const idUsuario = await crearCuenta(correo, 'entrenador');
  const respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: idUsuario, nombre });
  return { idEntrenador: respuesta.body.entrenador.id_entrenador, idUsuario };
}

async function crearCliente(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [resultado] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Contrato', 'Rutina', correo]
  );
  return resultado.insertId;
}

async function asignar(idCliente, idEntrenador) {
  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_entrenador: idEntrenador })
    .expect(201);
}

const EJERCICIOS_VALIDOS = [
  { nombre: 'Sentadilla', series: 3, repeticiones: '10-12', instrucciones: 'Bajar controlado' },
  { nombre: 'Press de banca', series: 4, repeticiones: '8-10' },
];

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  for (const rol of ['recepcionista', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Contrato ${rol}`, `${rol}@rutinas.test`, 'x', rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  const ana = await crearFicha('ana@rutinas.test', 'Ana López');
  const luis = await crearFicha('luis@rutinas.test', 'Luis Sánchez');
  ids.entrenador1 = ana;
  ids.entrenador2 = luis;
  tokens.entrenador1 = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });
  tokens.entrenador2 = tokenDePrueba({ id_usuario: luis.idUsuario, rol: 'entrenador' });

  ids.clienteAsignado = await crearCliente('asignado@rutinas.test');
  ids.clienteSinAsignar = await crearCliente('sin-asignar@rutinas.test');
  await asignar(ids.clienteAsignado, ana.idEntrenador);
});

after(async () => {
  await finalizarPruebas();
});

function saltar(t) {
  if (!disponible) {
    t.skip('MySQL no está disponible; pruebas de contrato omitidas.');
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// US-S3-03: creación de rutinas (POST /api/rutinas)
// ---------------------------------------------------------------------------

test('US-S3-03: el entrenador crea una rutina con ejercicios válidos (201)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({
      id_cliente: ids.clienteAsignado,
      nombre: 'Full body inicial',
      descripcion: 'Primeras 4 semanas',
      ejercicios: EJERCICIOS_VALIDOS,
    })
    .expect(201);

  assert.equal(respuesta.body.rutina.nombre, 'Full body inicial');
  assert.equal(respuesta.body.rutina.estado, 'activa');
  assert.equal(respuesta.body.rutina.ejercicios.length, 2);
  assert.equal(respuesta.body.rutina.ejercicios[0].orden, 1);
  assert.equal(respuesta.body.rutina.ejercicios[1].orden, 2);
  ids.rutinaCreada = respuesta.body.rutina.id_rutina;
});

test('US-S3-03: datos inválidos responden 400 VALIDACION (RN-18, FR-008)', async (t) => {
  if (saltar(t)) return;

  const casos = [
    // Nombre vacío.
    { id_cliente: ids.clienteAsignado, nombre: '', ejercicios: EJERCICIOS_VALIDOS },
    // Sin ejercicios.
    { id_cliente: ids.clienteAsignado, nombre: 'Sin ejercicios', ejercicios: [] },
    // Ejercicio sin series, repeticiones ni instrucciones.
    {
      id_cliente: ids.clienteAsignado,
      nombre: 'Ejercicio vacío',
      ejercicios: [{ nombre: 'Plancha' }],
    },
    // Series en cero o negativas.
    {
      id_cliente: ids.clienteAsignado,
      nombre: 'Series inválidas',
      ejercicios: [{ nombre: 'Plancha', series: 0 }],
    },
    {
      id_cliente: ids.clienteAsignado,
      nombre: 'Series negativas',
      ejercicios: [{ nombre: 'Plancha', series: -3 }],
    },
  ];

  for (const cuerpo of casos) {
    const respuesta = await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokens.entrenador1}`)
      .send(cuerpo)
      .expect(400);
    assert.equal(respuesta.body.codigo, 'VALIDACION', JSON.stringify(cuerpo));
  }
});

test('US-S3-03: un cliente fuera de la carga responde 403 AUTORIZACION (RN-19)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${tokens.entrenador2}`)
    .send({
      id_cliente: ids.clienteAsignado,
      nombre: 'Intento ajeno',
      ejercicios: EJERCICIOS_VALIDOS,
    })
    .expect(403);
  assert.equal(respuesta.body.codigo, 'AUTORIZACION');
});

test('US-S3-03: el administrador, el recepcionista y el cliente no crean rutinas (403)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['administrador', 'recepcionista', 'cliente']) {
    await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({
        id_cliente: ids.clienteAsignado,
        nombre: `Intento ${rol}`,
        ejercicios: EJERCICIOS_VALIDOS,
      })
      .expect(403);
  }
});

test('US-S3-03: al crear una nueva, la rutina activa anterior queda finalizada (FR-009)', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({
      id_cliente: ids.clienteAsignado,
      nombre: 'Segunda fase',
      ejercicios: EJERCICIOS_VALIDOS,
    })
    .expect(201);

  const listado = await request(app)
    .get(`/api/rutinas?cliente_id=${ids.clienteAsignado}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const activas = listado.body.rutinas.filter((r) => r.estado === 'activa');
  assert.equal(activas.length, 1, 'solo puede haber una rutina activa por cliente');
  const finalizadas = listado.body.rutinas.filter((r) => r.estado === 'finalizada');
  assert.ok(finalizadas.length >= 1, 'la anterior queda finalizada');
});

// ---------------------------------------------------------------------------
// US-S3-03: consulta (GET /api/rutinas)
// ---------------------------------------------------------------------------

test('US-S3-03: el entrenador solo recibe las rutinas de su carga (RN-19)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/rutinas')
    .set('Authorization', `Bearer ${tokens.entrenador2}`)
    .expect(200);
  assert.ok(Array.isArray(respuesta.body.rutinas));
  assert.equal(respuesta.body.rutinas.length, 0, 'sin carga no hay rutinas que ver');

  const propia = await request(app)
    .get('/api/rutinas')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .expect(200);
  assert.ok(propia.body.rutinas.length > 0, 'su carga sí tiene rutinas');
});

test('US-S3-03: el recepcionista consulta en modo lectura y el cliente recibe 403', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .get('/api/rutinas')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .expect(200);

  const respuesta = await request(app)
    .get('/api/rutinas')
    .set('Authorization', `Bearer ${tokens.cliente}`)
    .expect(403);
  assert.equal(respuesta.body.codigo, 'AUTORIZACION');
});

// ---------------------------------------------------------------------------
// US-S3-03: modificación (PUT /api/rutinas/:id y /ejercicios)
// ---------------------------------------------------------------------------

test('US-S3-03: el entrenador modifica el nombre y conserva la estructura (200)', async (t) => {
  if (saltar(t)) return;

  // Busca la rutina activa del cliente asignado.
  const listado = await request(app)
    .get(`/api/rutinas?cliente_id=${ids.clienteAsignado}&estado=activa`)
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .expect(200);
  const rutina = listado.body.rutinas[0];

  const respuesta = await request(app)
    .put(`/api/rutinas/${rutina.id_rutina}`)
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({ nombre: 'Full body avanzado' })
    .expect(200);
  assert.equal(respuesta.body.rutina.nombre, 'Full body avanzado');
  assert.ok(respuesta.body.rutina.fecha_actualizacion, 'la modificación marca fecha_actualizacion');
});

test('US-S3-03: el reemplazo de ejercicios es en conjunto (200)', async (t) => {
  if (saltar(t)) return;

  const listado = await request(app)
    .get(`/api/rutinas?cliente_id=${ids.clienteAsignado}&estado=activa`)
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .expect(200);
  const rutina = listado.body.rutinas[0];

  const respuesta = await request(app)
    .put(`/api/rutinas/${rutina.id_rutina}/ejercicios`)
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({
      ejercicios: [{ nombre: 'Peso muerto', series: 3, repeticiones: '5', carga: '80 kg' }],
    })
    .expect(200);

  assert.equal(respuesta.body.rutina.ejercicios.length, 1, 'la lista se reemplaza por completo');
  assert.equal(respuesta.body.rutina.ejercicios[0].nombre, 'Peso muerto');
});

test('US-S3-03: una rutina inexistente responde 404 y otra de un ajeno 403', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .put('/api/rutinas/999999')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({ nombre: 'Nadie' })
    .expect(404);

  // El entrenador 2 no puede tocar la rutina del entrenador 1.
  const respuesta = await request(app)
    .put(`/api/rutinas/${ids.rutinaCreada}`)
    .set('Authorization', `Bearer ${tokens.entrenador2}`)
    .send({ nombre: 'Intento ajeno' })
    .expect(403);
  assert.equal(respuesta.body.codigo, 'AUTORIZACION');
});

test('US-S3-03: las rutinas modificadas quedan auditadas (FR-020)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [auditoria] = await obtenerPool().query(
    `SELECT accion, modulo FROM auditoria
     WHERE accion IN ('crear_rutina', 'modificar_rutina')
     ORDER BY id_auditoria DESC LIMIT 4`
  );
  assert.ok(auditoria.length >= 2, 'deben quedar registradas las acciones del módulo');
  assert.ok(auditoria.every((fila) => fila.modulo === 'rutinas'));
});
