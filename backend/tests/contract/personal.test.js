// Pruebas de contrato del personal (T057, US7;
// contracts/api-entrenadores-asignaciones.md).
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
    ['Contrato entrenador', correo, hash, 'entrenador']
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
    ['Contrato', 'Personal', correo]
  );
  return resultado.insertId;
}

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Contrato ${rol}`, `${rol}@personal.test`, 'x', rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  const ana = await crearFicha('ana@personal.test', 'Ana Personal');
  ids.entrenador1 = ana;
  tokens.entrenador1 = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });

  ids.clienteAsignado = await crearCliente('asignado@personal.test');
  ids.clientePendiente = await crearCliente('pendiente@personal.test');

  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: ids.clienteAsignado, id_entrenador: ana.idEntrenador })
    .expect(201);
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

test('US-S3-07: administrador y recepcionista reciben el personal con su carga (200)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['administrador', 'recepcionista']) {
    const respuesta = await request(app)
      .get('/api/personal')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(200);

    assert.ok(Array.isArray(respuesta.body.personal));
    assert.ok(Array.isArray(respuesta.body.pendientes_de_asignacion));

    const ana = respuesta.body.personal.find((p) => p.id_entrenador === ids.entrenador1.idEntrenador);
    assert.ok(ana, 'la entrenadora aparece en el listado');
    assert.ok(ana.clientes_asignados >= 1, 'incluye su carga de clientes');
    assert.ok(
      ana.clientes.some((c) => c.id_cliente === ids.clienteAsignado),
      'el detalle lista a sus clientes'
    );

    const pendiente = respuesta.body.pendientes_de_asignacion.find(
      (c) => c.id_cliente === ids.clientePendiente
    );
    assert.ok(pendiente, 'el cliente sin entrenador aparece como pendiente');
  }
});

test('US-S3-07: los filtros entrenador_id y estado_asignacion funcionan (200)', async (t) => {
  if (saltar(t)) return;

  const filtrada = await request(app)
    .get(`/api/personal?entrenador_id=${ids.entrenador1.idEntrenador}&estado_asignacion=activa`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.equal(filtrada.body.personal.length, 1);
  assert.equal(filtrada.body.personal[0].id_entrenador, ids.entrenador1.idEntrenador);
  assert.ok(filtrada.body.personal[0].clientes.every((c) => c.estado === 'activa'));

  const cerradas = await request(app)
    .get('/api/personal?estado_asignacion=cerrada')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  for (const persona of cerrada.body.personal) {
    assert.ok(persona.clientes.every((c) => c.estado === 'cerrada'));
  }

  const invalida = await request(app)
    .get('/api/personal?estado_asignacion=no_existe')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(invalida.body.codigo, 'VALIDACION');
});

test('US-S3-07: el entrenador recibe SOLO su propia carga en mi-carga (RN-19)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/personal/mi-carga')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .expect(200);

  assert.equal(respuesta.body.personal.length, 1, 'solo aparece él mismo');
  assert.equal(respuesta.body.personal[0].id_entrenador, ids.entrenador1.idEntrenador);
  assert.ok(
    respuesta.body.personal[0].clientes.some((c) => c.id_cliente === ids.clienteAsignado),
    'su carga incluye a su cliente'
  );
});

test('US-S3-07: los permisos se validan en el backend (403)', async (t) => {
  if (saltar(t)) return;

  // El entrenador no consulta /api/personal…
  await request(app)
    .get('/api/personal')
    .set('Authorization', `Bearer ${tokens.entrenador1}`)
    .expect(403);

  // …y ni el cliente ni el recepcionista consultan mi-carga.
  for (const rol of ['cliente', 'recepcionista']) {
    const respuesta = await request(app)
      .get('/api/personal/mi-carga')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }

  // Sin token, 401 en ambas rutas.
  await request(app).get('/api/personal').expect(401);
  await request(app).get('/api/personal/mi-carga').expect(401);
});
