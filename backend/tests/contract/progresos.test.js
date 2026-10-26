// Pruebas de contrato de objetivos y progresos (T033, US4;
// contracts/api-rutinas-progreso.md).
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

async function crearFicha(correo, nombre) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [cuenta] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    [`Contrato entrenador`, correo, hash, 'entrenador']
  );
  const respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: cuenta.insertId, nombre });
  return { idEntrenador: respuesta.body.entrenador.id_entrenador, idUsuario: cuenta.insertId };
}

async function crearCliente(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [resultado] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Contrato', 'Progreso', correo]
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

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  for (const rol of ['recepcionista', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Contrato ${rol}`, `${rol}@progresos.test`, 'x', rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  const ana = await crearFicha('ana@progresos.test', 'Ana López');
  const luis = await crearFicha('luis@progresos.test', 'Luis Sánchez');
  ids.entrenador1 = ana;
  ids.entrenador2 = luis;
  tokens.entrenador1 = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });
  tokens.entrenador2 = tokenDePrueba({ id_usuario: luis.idUsuario, rol: 'entrenador' });

  ids.clienteAsignado = await crearCliente('asignado@progresos.test');
  ids.clienteAjeno = await crearCliente('ajeno@progresos.test');
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
// US-S3-04: objetivos (POST/GET/PUT /api/objetivos)
// ---------------------------------------------------------------------------

test('US-S3-04: el entrenador registra un objetivo de su carga (201)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/objetivos')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({
      id_cliente: ids.clienteAsignado,
      descripcion: 'Reducir cintura a 85 cm',
      fecha_objetivo: '2026-12-31',
    })
    .expect(201);

  assert.equal(respuesta.body.objetivo.estado, 'pendiente');
  assert.equal(respuesta.body.objetivo.descripcion, 'Reducir cintura a 85 cm');
  assert.equal(respuesta.body.objetivo.fecha_cierre, null);
  ids.objetivoCreado = respuesta.body.objetivo.id_objetivo;
});

test('US-S3-04: la descripción vacía responde 400 VALIDACION', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/objetivos')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({ id_cliente: ids.clienteAsignado, descripcion: '' })
    .expect(400);
  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

test('US-S3-04: un cliente fuera de la carga responde 403 (RN-19)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/objetivos')
    .set('Authorization', `Bearer ${tokens.entrenador2}`)
    .send({ id_cliente: ids.clienteAsignado, descripcion: 'Intento ajeno' })
    .expect(403);
  assert.equal(respuesta.body.codigo, 'AUTORIZACION');
});

test('US-S3-04: al cumplir el objetivo se registra fecha_cierre (FR-010)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .put(`/api/objetivos/${ids.objetivoCreado}`)
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({ estado: 'cumplido' })
    .expect(200);

  assert.equal(respuesta.body.objetivo.estado, 'cumplido');
  assert.ok(respuesta.body.objetivo.fecha_cierre, 'cumplido exige fecha_cierre');
});

test('US-S3-04: un estado fuera del ENUM responde 400 y uno inexistente 404', async (t) => {
  if (saltar(t)) return;

  const invalido = await request(app)
    .put(`/api/objetivos/${ids.objetivoCreado}`)
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({ estado: 'logrado' })
    .expect(400);
  assert.equal(invalido.body.codigo, 'VALIDACION');

  await request(app)
    .put('/api/objetivos/999999')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({ estado: 'en_curso' })
    .expect(404);
});

test('US-S3-04: el recepcionista consulta en modo lectura y el cliente recibe 403', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .get('/api/objetivos')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .expect(200);

  await request(app)
    .get('/api/objetivos')
    .set('Authorization', `Bearer ${tokens.cliente}`)
    .expect(403);

  // Ni el recepcionista ni el administrador registran ni modifican (RN-20).
  for (const rol of ['recepcionista', 'administrador']) {
    await request(app)
      .post('/api/objetivos')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ id_cliente: ids.clienteAsignado, descripcion: `Intento ${rol}` })
      .expect(403);
  }
});

// ---------------------------------------------------------------------------
// US-S3-04: progresos (POST/GET /api/progresos)
// ---------------------------------------------------------------------------

test('US-S3-04: se registra un progreso mínimo (fecha y comentario) (201)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({
      id_cliente: ids.clienteAsignado,
      fecha: '2026-10-05',
      comentario: 'Primera sesión, buena actitud',
    })
    .expect(201);

  assert.equal(respuesta.body.progreso.peso, null, 'el peso es opcional');
  assert.equal(respuesta.body.progreso.cintura, null, 'las medidas son opcionales');
  ids.progresoMinimo = respuesta.body.progreso.id_progreso;
});

test('US-S3-04: se registra un progreso completo con peso, medidas y objetivo (201)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({
      id_cliente: ids.clienteAsignado,
      fecha: '2026-10-12',
      comentario: 'Buena mejora en sentadilla',
      peso: 82.5,
      pecho: 100.5,
      cintura: 88.0,
      cadera: 98.5,
      muslos: 60.0,
      id_objetivo: ids.objetivoCreado,
    })
    .expect(201);

  assert.equal(respuesta.body.progreso.peso, '82.50');
  assert.equal(respuesta.body.progreso.id_objetivo, ids.objetivoCreado);
});

test('US-S3-04: datos inválidos responden 400 VALIDACION (FR-011)', async (t) => {
  if (saltar(t)) return;

  const casos = [
    { id_cliente: ids.clienteAsignado, fecha: '2026-10-01', comentario: '' },
    { id_cliente: ids.clienteAsignado, fecha: '2026-10-01', comentario: 'Con peso', peso: 0 },
    { id_cliente: ids.clienteAsignado, fecha: '2026-10-01', comentario: 'Con peso', peso: -3 },
    { id_cliente: ids.clienteAsignado, fecha: '2026-10-01', comentario: 'Con medida', cintura: -5 },
    { id_cliente: ids.clienteAsignado, fecha: 'no-es-fecha', comentario: 'Fecha mala' },
  ];

  for (const cuerpo of casos) {
    const respuesta = await request(app)
      .post('/api/progresos')
      .set('Authorization', `Bearer ${tokens.entrenador1}`)
      .send(cuerpo)
      .expect(400);
    assert.equal(respuesta.body.codigo, 'VALIDACION', JSON.stringify(cuerpo));
  }
});

test('US-S3-04: un objetivo de otro cliente responde 400 (FR-011)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({
      id_cliente: ids.clienteAsignado,
      fecha: '2026-10-15',
      comentario: 'Objetivo ajeno',
      id_objetivo: 999999,
    })
    .expect(400);
  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

test('US-S3-04: el histórico se devuelve ordenado por fecha ascendente (FR-012)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get(`/api/progresos?cliente_id=${ids.clienteAsignado}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const fechas = respuesta.body.progresos.map((p) => p.fecha);
  const ordenadas = [...fechas].sort();
  assert.deepEqual(fechas, ordenadas, 'los progresos van en orden cronológico');
  assert.ok(respuesta.body.progresos.length >= 2);
});

test('US-S3-04: el entrenador recibe solo los progresos de su carga (RN-19)', async (t) => {
  if (saltar(t)) return;

  const propia = await request(app)
    .get('/api/progresos')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .expect(200);
  assert.ok(propia.body.progresos.length > 0);

  const ajena = await request(app)
    .get('/api/progresos')
    .set('Authorization', `Bearer ${tokens.entrenador2}`)
    .expect(200);
  assert.equal(ajena.body.progresos.length, 0, 'sin carga no hay progresos que ver');
});

test('US-S3-04: el histórico es inmutable: no existen PUT ni DELETE (RN-17)', async (t) => {
  if (saltar(t)) return;

  const ruta = `/api/progresos/${ids.progresoMinimo}`;
  const put = await request(app)
    .put(ruta)
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .send({ comentario: 'Intento de edición' })
    .expect(404);
  assert.equal(put.body.codigo, 'NO_ENCONTRADA');

  const del = await request(app)
    .delete(ruta)
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .expect(404);
  assert.equal(del.body.codigo, 'NO_ENCONTRADA');

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT * FROM progresos_clientes WHERE id_progreso = ?',
    [ids.progresoMinimo]
  );
  assert.equal(filas[0].comentario, 'Primera sesión, buena actitud', 'el registro queda intacto');
});

test('US-S3-04: las acciones quedan auditadas (FR-020)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [auditoria] = await obtenerPool().query(
    `SELECT accion, modulo FROM auditoria
     WHERE accion IN ('registrar_objetivo', 'registrar_progreso')
     ORDER BY id_auditoria DESC LIMIT 4`
  );
  assert.ok(auditoria.length >= 2);
  const modulos = new Set(auditoria.map((fila) => fila.modulo));
  assert.ok(modulos.has('objetivos'));
  assert.ok(modulos.has('progresos'));
});
