// Pruebas de integración de consulta de pagos y adeudos (T061, US-S2-05).
// Regla FR-007 (clarificación Q2): saldo = precio vigente del tipo de la
// membresía del cliente − suma de sus pagos registrados, nunca negativo.
// La vista de adeudos es exclusiva del administrador.
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
let precioTipo = null;
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
      [`Prueba ${rol}`, `${rol}@adeudos.test`, hash, rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  const [tipos] = await obtenerPool().query(
    "SELECT id_tipo_membresia, precio FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  idTipo = tipos[0].id_tipo_membresia;
  precioTipo = Number(tipos[0].precio);
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

// Crea un cliente con membresía activa y devuelve su id.
async function crearClienteConMembresia(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [clientes] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Adeudo', 'Prueba', correo]
  );
  const [membresias] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'activo')`,
    [clientes.insertId, idTipo]
  );
  return { idCliente: clientes.insertId, idMembresia: membresias.insertId };
}

// Devuelve la petición de supertest (sin async: `.expect` debe estar disponible).
function pagar(idCliente, idMembresia, monto) {
  return request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_membresia: idMembresia, monto, metodo_pago: 'efectivo' });
}

test('US-S2-05: el saldo pendiente es el precio del tipo menos los pagos registrados (FR-007)', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('parcial@adeudos.test');

  const pagoParcial = precioTipo / 2;
  await pagar(idCliente, idMembresia, pagoParcial).expect(201);

  const respuesta = await request(app)
    .get('/api/pagos/adeudos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const adeudo = respuesta.body.adeudos.find((a) => a.id_cliente === idCliente);
  assert.ok(adeudo, 'el cliente debe aparecer en el listado de adeudos');
  assert.equal(Number(adeudo.precio_membresia), precioTipo);
  assert.equal(Number(adeudo.total_pagado), pagoParcial);
  assert.equal(
    Number(adeudo.saldo_pendiente),
    precioTipo - pagoParcial,
    'saldo = precio vigente − pagos registrados'
  );
});

test('US-S2-05: sin pagos el adeudo es el precio completo del tipo (esc. 7 de US-S2-10)', async (t) => {
  if (saltar(t)) return;
  const { idCliente } = await crearClienteConMembresia('sinpagos@adeudos.test');

  const respuesta = await request(app)
    .get('/api/pagos/adeudos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const adeudo = respuesta.body.adeudos.find((a) => a.id_cliente === idCliente);
  assert.equal(Number(adeudo.total_pagado), 0);
  assert.equal(Number(adeudo.saldo_pendiente), precioTipo);
});

test('US-S2-05: el saldo nunca queda negativo aunque se pague de más (caso límite)', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('demasiado@adeudos.test');

  await pagar(idCliente, idMembresia, precioTipo * 2).expect(201);

  const respuesta = await request(app)
    .get('/api/pagos/adeudos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const adeudo = respuesta.body.adeudos.find((a) => a.id_cliente === idCliente);
  assert.equal(
    Number(adeudo.saldo_pendiente),
    0,
    'el saldo pendiente no puede ser negativo'
  );
});

test('US-S2-05: un cambio de precio del tipo se refleja en el cálculo con el precio vigente', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('vigente@adeudos.test');

  // Se modifica el precio del tipo DESPUÉS de asignar la membresía (caso
  // límite de la spec): el cálculo usa el precio vigente.
  const nuevoPrecio = precioTipo + 100;
  await request(app)
    .put(`/api/tipos-membresia/${idTipo}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ precio: nuevoPrecio })
    .expect(200);

  const respuesta = await request(app)
    .get('/api/pagos/adeudos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const adeudo = respuesta.body.adeudos.find((a) => a.idCliente === idCliente || a.id_cliente === idCliente);
  assert.equal(Number(adeudo.precio_membresia), nuevoPrecio, 'usa el precio vigente del tipo');
  assert.equal(Number(adeudo.saldo_pendiente), nuevoPrecio, 'sin pagos, el saldo es el nuevo precio');

  // Se restaura el precio para no afectar a otras pruebas del mismo archivo.
  await request(app)
    .put(`/api/tipos-membresia/${idTipo}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ precio: precioTipo })
    .expect(200);
});

test('US-S2-05: la vista de adeudos es exclusiva del administrador (403 a los demás)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    await request(app)
      .get('/api/pagos/adeudos')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
  }
});
