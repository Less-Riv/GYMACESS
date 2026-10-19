// Pruebas de contrato de pagos (T036, US-S2-04; contracts/api-pagos.md).
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
let idTipo = null;
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
      [`Prueba ${rol}`, `${rol}@pagos.test`, hash, rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  const [tipos] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  idTipo = tipos[0].id_tipo_membresia;
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

// Crea un cliente con su membresía activa y devuelve ambos identificadores.
async function crearClienteConMembresia(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [clientes] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Pago', 'Prueba', correo]
  );
  const [membresias] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'activo')`,
    [clientes.insertId, idTipo]
  );
  return { idCliente: clientes.insertId, idMembresia: membresias.insertId };
}

test('US-S2-04: el recepcionista registra un pago en efectivo y recibe 201', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('pago1@pagos.test');

  const respuesta = await request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_cliente: idCliente, id_membresia: idMembresia, monto: 250, metodo_pago: 'efectivo' })
    .expect(201);

  assert.equal(respuesta.body.pago.id_cliente, idCliente);
  assert.equal(respuesta.body.pago.monto, '250.00');
  assert.equal(respuesta.body.pago.metodo_pago, 'efectivo');
  assert.ok(respuesta.body.pago.fecha_pago, 'la fecha la pone el servidor');
  assert.ok(respuesta.body.pago.id_pago);
});

test('US-S2-04: un monto igual a 0 o negativo responde 400 (RN-05)', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('pago2@pagos.test');

  for (const monto of [0, -10]) {
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokens.administrador}`)
      .send({ id_cliente: idCliente, id_membresia: idMembresia, monto, metodo_pago: 'efectivo' })
      .expect(400);
    assert.equal(respuesta.body.codigo, 'VALIDACION');
    assert.ok(respuesta.body.mensaje.includes('monto'));
  }
});

test('US-S2-04: un método fuera del catálogo {efectivo, transferencia} responde 400', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('pago3@pagos.test');

  const respuesta = await request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_membresia: idMembresia, monto: 100, metodo_pago: 'tarjeta' })
    .expect(400);

  assert.ok(respuesta.body.mensaje.includes('efectivo'));
});

test('US-S2-04: una membresía de otro cliente responde 409 PAGO_MEMBRESIA_AJENA (RN-05)', async (t) => {
  if (saltar(t)) return;
  const primera = await crearClienteConMembresia('ajena1@pagos.test');
  const segunda = await crearClienteConMembresia('ajena2@pagos.test');

  const respuesta = await request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({
      id_cliente: primera.idCliente,
      id_membresia: segunda.idMembresia,
      monto: 100,
      metodo_pago: 'efectivo',
    })
    .expect(409);

  assert.equal(respuesta.body.codigo, 'PAGO_MEMBRESIA_AJENA');
});

test('US-S2-04: los roles entrenador y cliente reciben 403', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('pago4@pagos.test');

  for (const rol of ['entrenador', 'cliente']) {
    await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ id_cliente: idCliente, id_membresia: idMembresia, monto: 100, metodo_pago: 'efectivo' })
      .expect(403);
  }
});

test('US-S2-04: el adeudo es exclusivo del administrador (403 a recepcionista, entrenador y cliente)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    await request(app)
      .get('/api/pagos/adeudos')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
  }

  await request(app)
    .get('/api/pagos/adeudos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
});

test('US-S2-04: sin token la operación responde 401', async (t) => {
  if (saltar(t)) return;

  await request(app).post('/api/pagos').send({}).expect(401);
});
