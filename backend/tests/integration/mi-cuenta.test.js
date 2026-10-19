// Pruebas de integración de la consulta de información propia
// (T058, US7; quickstart V6, SC-005, FR-012, RN-14).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  tokenDePrueba,
} from '../ayuda/base-pruebas.js';

let disponible = false;
let pool = null;
let tokenCliente = null;
let tokenOtroCliente = null;
let tokenClienteSinAsociar = null;
let idOtroCliente = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;
  const modulo = await import('../../src/config/database.js');
  pool = modulo.obtenerPool();
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);

  // Cliente A: asociado a un registro de clientes.
  const [clienteA] = await pool.query(
    'INSERT INTO clientes (nombre, apellido, correo, telefono) VALUES (?, ?, ?, ?)',
    ['Cuenta', 'Propia', 'propietaria@mi-cuenta.test', '5500011100']
  );
  const [usuarioA] = await pool.query(
    'INSERT INTO usuarios (nombre, correo, password, rol, cliente_id) VALUES (?, ?, ?, ?, ?)',
    ['Cuenta Propia', 'usuario-propio@mi-cuenta.test', hash, 'cliente', clienteA.insertId]
  );
  tokenCliente = tokenDePrueba({ id_usuario: usuarioA.insertId, rol: 'cliente' });

  // Cliente B: para verificar el aislamiento frente a terceros.
  const [clienteB] = await pool.query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Tercero', 'Ajenx', 'tercero@mi-cuenta.test']
  );
  idOtroCliente = clienteB.insertId;
  const [usuarioB] = await pool.query(
    'INSERT INTO usuarios (nombre, correo, password, rol, cliente_id) VALUES (?, ?, ?, ?, ?)',
    ['Tercero Cliente', 'usuario-tercero@mi-cuenta.test', hash, 'cliente', clienteB.insertId]
  );
  tokenOtroCliente = tokenDePrueba({ id_usuario: usuarioB.insertId, rol: 'cliente' });

  // Cliente C: usuario cliente SIN cliente asociado.
  const [usuarioC] = await pool.query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Sin Asociar', 'usuario-sin-asociar@mi-cuenta.test', hash, 'cliente']
  );
  tokenClienteSinAsociar = tokenDePrueba({ id_usuario: usuarioC.insertId, rol: 'cliente' });
});

after(async () => {
  await finalizarPruebas();
});

function saltar(t) {
  if (!disponible) {
    t.skip('MySQL no está disponible; pruebas de integración omitidas.');
    return true;
  }
  return false;
}

test('US7: el cliente ve únicamente sus propios datos completos (SC-005)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/clientes/mi-cuenta')
    .set('Authorization', `Bearer ${tokenCliente}`)
    .expect(200);

  assert.equal(respuesta.body.cliente.correo, 'propietaria@mi-cuenta.test');
  assert.equal(respuesta.body.cliente.nombre, 'Cuenta');
  assert.equal(respuesta.body.cliente.telefono, '5500011100');
});

test('US7: intentar consultar a otro cliente por id se rechaza sin revelar datos (SC-005)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get(`/api/clientes/${idOtroCliente}`)
    .set('Authorization', `Bearer ${tokenCliente}`)
    .expect(403);

  assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  const cuerpo = JSON.stringify(respuesta.body);
  assert.ok(!cuerpo.includes('tercero@mi-cuenta.test'), 'no revela el correo de terceros');
  assert.ok(!cuerpo.includes('Tercero'), 'no revela el nombre de terceros');
});

test('US7: listar clientes con rol cliente responde 403', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .get('/api/clientes')
    .set('Authorization', `Bearer ${tokenOtroCliente}`)
    .expect(403);
});

test('US7: el cliente no puede modificar su información ni la de otros (403)', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .patch(`/api/clientes/${idOtroCliente}`)
    .set('Authorization', `Bearer ${tokenCliente}`)
    .send({ telefono: '5599998888' })
    .expect(403);
});

test('US7: un usuario cliente sin cliente asociado recibe un mensaje claro (caso límite)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/clientes/mi-cuenta')
    .set('Authorization', `Bearer ${tokenClienteSinAsociar}`)
    .expect(404);

  assert.equal(respuesta.body.codigo, 'CLIENTE_NO_ASOCIADO');
  assert.match(respuesta.body.mensaje, /no tiene un cliente asociado/i);
  assert.ok(!JSON.stringify(respuesta.body).includes('SELECT'), 'sin errores técnicos');
});

test('US7: mi-cuenta sin token responde 401', async (t) => {
  if (saltar(t)) return;

  await request(app).get('/api/clientes/mi-cuenta').expect(401);
});
