// Pruebas de contrato de rostros (T027, US-S2-06; contracts/api-rostros-accesos.md).
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
import { descriptorDePrueba, DIMENSIONES } from '../ayuda/descriptores-faciales.js';

let disponible = false;
let tokens = {};
let idCliente = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Prueba ${rol}`, `${rol}@rostros.test`, hash, rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  const [clientes] = await obtenerPool().query(
    "INSERT INTO clientes (nombre, apellido, correo) VALUES ('Rostro', 'Prueba', 'rostro@rostros.test')"
  );
  idCliente = clientes.insertId;
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

test('US-S2-06: el recepcionista registra un descriptor válido y recibe 201', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ descriptor: descriptorDePrueba(1) })
    .expect(201);

  assert.equal(respuesta.body.rostro.id_cliente, idCliente);
  assert.equal(respuesta.body.rostro.estado_registro, 'completo');
  assert.ok(respuesta.body.rostro.fecha_registro);
  // FR-017: jamás se expone el descriptor.
  assert.equal(respuesta.body.rostro.descriptor, undefined);
});

test('US-S2-06: registrar de nuevo devuelve 200 (actualiza, no duplica)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ descriptor: descriptorDePrueba(2) })
    .expect(200);

  assert.equal(respuesta.body.rostro.estado_registro, 'completo');
});

test('US-S2-06: un descriptor sin 128 valores responde 400', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ descriptor: descriptorDePrueba(3).slice(0, 100) })
    .expect(400);

  assert.equal(respuesta.body.codigo, 'VALIDACION');
  assert.ok(respuesta.body.mensaje.includes(String(DIMENSIONES)));
});

test('US-S2-06: un descriptor ausente o no numérico responde 400', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({})
    .expect(400);

  const mixto = descriptorDePrueba(4);
  mixto[10] = 'texto';
  await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ descriptor: mixto })
    .expect(400);
});

test('US-S2-06: registrar el rostro de un cliente inexistente responde 404', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/rostros/999999')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ descriptor: descriptorDePrueba(5) })
    .expect(404);

  assert.ok(respuesta.body.mensaje.includes('Cliente'));
});

test('US-S2-06: entrenador y cliente reciben 403', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['entrenador', 'cliente']) {
    await request(app)
      .post(`/api/rostros/${idCliente}`)
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ descriptor: descriptorDePrueba(6) })
      .expect(403);
  }
});

test('US-S2-06: la consulta del estado no expone el descriptor (FR-017)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .expect(200);

  assert.equal(respuesta.body.estado_registro, 'completo');
  assert.equal(respuesta.body.descriptor, undefined);
  assert.ok(respuesta.body.fecha_registro);
});

test('US-S2-06: un cliente sin rostro registrado responde estado pendiente (caso límite)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [clientes] = await obtenerPool().query(
    "INSERT INTO clientes (nombre, apellido, correo) VALUES ('Sin', 'Rostro', 'sinrostro@rostros.test')"
  );

  const respuesta = await request(app)
    .get(`/api/rostros/${clientes.insertId}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.equal(respuesta.body.estado_registro, 'pendiente');
});

test('US-S2-06: sin token la operación responde 401', async (t) => {
  if (saltar(t)) return;

  await request(app).get(`/api/rostros/${idCliente}`).expect(401);
});
