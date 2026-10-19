// Pruebas de integración de "Mi cuenta" del Sprint 2 (T070, US-S2-10).
// Recorrido: el cliente autenticado ve su membresía con días restantes, sus
// pagos, su adeudo (fórmula FR-007) y sus accesos; y NO puede ver datos de
// terceros (403).
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
let token = null;
let tokenOtroCliente = null;
let idTipo = null;
let precioTipo = null;
let idCliente = null;
let idMembresia = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;

  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  token = login.body.token;

  const [tipos] = await obtenerPool().query(
    "SELECT id_tipo_membresia, precio FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  idTipo = tipos[0].id_tipo_membresia;
  precioTipo = Number(tipos[0].precio);

  // Cliente de prueba con usuario cliente asociado (como en el Sprint 1).
  const [clientes] = await obtenerPool().query(
    "INSERT INTO clientes (nombre, apellido, correo) VALUES ('Mi', 'Cuenta', 'micuenta@test.test')"
  );
  idCliente = clientes.insertId;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [usuarios] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol, cliente_id) VALUES (?, ?, ?, ?, ?)',
    ['Cliente Mi Cuenta', 'cliente@micuenta.test', hash, 'cliente', idCliente]
  );
  token = tokenDePrueba({ id_usuario: usuarios.insertId, rol: 'cliente' });

  // Membresía activa + un pago parcial.
  const [membresias] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'activo')`,
    [idCliente, idTipo]
  );
  idMembresia = membresias.insertId;
  await obtenerPool().query(
    'INSERT INTO pagos (id_cliente, id_membresia, monto, metodo_pago) VALUES (?, ?, ?, ?)',
    [idCliente, idMembresia, precioTipo / 2, 'efectivo']
  );
  await obtenerPool().query(
    `INSERT INTO accesos (id_cliente, fecha, hora, resultado, motivo)
     VALUES (?, CURDATE(), '08:00:00', 'autorizado', NULL)`,
    [idCliente]
  );

  // Segundo cliente: sus datos NO deben ser visibles desde el primero.
  const [otrosClientes] = await obtenerPool().query(
    "INSERT INTO clientes (nombre, apellido, correo) VALUES ('Otro', 'Cliente', 'otro@micuenta.test')"
  );
  const [otrosUsuarios] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol, cliente_id) VALUES (?, ?, ?, ?, ?)',
    ['Otro Cliente', 'otro@micuenta.test', hash, 'cliente', otrosClientes.insertId]
  );
  tokenOtroCliente = tokenDePrueba({ id_usuario: otrosUsuarios.insertId, rol: 'cliente' });
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

test('US-S2-10 esc.1: la membresía propia muestra tipo, vigencia, días restantes y estado', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/mi-cuenta/membresia')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.ok(respuesta.body.membresia, 'debe devolver la membresía');
  assert.equal(respuesta.body.membresia.tipo, 'Mensual');
  assert.equal(respuesta.body.membresia.estado, 'activo');
  assert.ok(respuesta.body.membresia.dias_restantes > 0, 'deben quedar días');
  assert.ok(respuesta.body.membresia.fecha_fin);
});

test('US-S2-10 esc.6: sin membresía el backend informa con un mensaje claro', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [clientes] = await obtenerPool().query(
    "INSERT INTO clientes (nombre, apellido, correo) VALUES ('Sin', 'Membresia', 'sinmembresia@micuenta.test')"
  );
  const [usuarios] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol, cliente_id) VALUES (?, ?, ?, ?, ?)',
    ['Sin Membresia', 'sinmembresia@micuenta.test', hash, 'cliente', clientes.insertId]
  );
  const tokenSin = tokenDePrueba({ id_usuario: usuarios.insertId, rol: 'cliente' });

  const respuesta = await request(app)
    .get('/api/mi-cuenta/membresia')
    .set('Authorization', `Bearer ${tokenSin}`)
    .expect(200);

  assert.equal(respuesta.body.membresia, null);
  assert.ok(respuesta.body.mensaje.includes('membresía'));

  // Esc. 6 también para el adeudo: mensaje claro en lugar de datos vacíos.
  const adeudo = await request(app)
    .get('/api/mi-cuenta/adeudo')
    .set('Authorization', `Bearer ${tokenSin}`)
    .expect(200);
  assert.ok(adeudo.body.mensaje, 'debe informar con un mensaje claro');
});

test('US-S2-10 esc.2: el historial de pagos propio muestra monto, fecha, método y membresía', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/mi-cuenta/pagos')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(respuesta.body.pagos.length, 1);
  const pago = respuesta.body.pagos[0];
  assert.equal(pago.monto, (precioTipo / 2).toFixed(2));
  assert.equal(pago.metodo_pago, 'efectivo');
  assert.equal(pago.tipo_membresia, 'Mensual');
  assert.ok(pago.fecha_pago);
});

test('US-S2-10 esc.3: el adeudo usa la fórmula FR-007 y queda "pendiente"', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/mi-cuenta/adeudo')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(Number(respuesta.body.precio_membresia), precioTipo);
  assert.equal(Number(respuesta.body.total_pagado), precioTipo / 2);
  assert.equal(Number(respuesta.body.saldo_pendiente), precioTipo / 2);
  assert.equal(respuesta.body.estado_cuenta, 'pendiente');
});

test('US-S2-10 esc.4: los accesos propios muestran fecha, hora, resultado y motivo', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/mi-cuenta/accesos')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(respuesta.body.accesos.length, 1);
  assert.equal(respuesta.body.accesos[0].resultado, 'autorizado');
  assert.ok(respuesta.body.accesos[0].fecha);
  assert.ok(respuesta.body.accesos[0].hora);
});

test('US-S2-10: los endpoints de mi-cuenta rechazan a los no clientes con 403', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [admin] = await obtenerPool().query(
    'SELECT id_usuario FROM usuarios WHERE rol = ? LIMIT 1',
    ['administrador']
  );
  const tokenAdmin = tokenDePrueba({ id_usuario: admin[0].id_usuario, rol: 'administrador' });

  for (const ruta of ['/membresia', '/pagos', '/adeudo', '/accesos']) {
    await request(app)
      .get(`/api/mi-cuenta${ruta}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(403);
  }
  assert.ok(hash, 'se usa el hash solo para dejar preparado el entorno');
});

test('US-S2-10: el cliente no puede consultar datos de otro cliente (403 o vacío)', async (t) => {
  if (saltar(t)) return;

  // El segundo cliente recibe SUS propios datos, nunca los del primero.
  const respuesta = await request(app)
    .get('/api/mi-cuenta/pagos')
    .set('Authorization', `Bearer ${tokenOtroCliente}`)
    .expect(200);

  assert.equal(
    respuesta.body.pagos.length,
    0,
    'el otro cliente no debe ver los pagos del primero'
  );

  // Tampoco existen rutas con parámetros para consultar a terceros.
  const conParametro = await request(app)
    .get(`/api/mi-cuenta/pagos?cliente_id=${idCliente}`)
    .set('Authorization', `Bearer ${tokenOtroCliente}`);
  assert.ok([200, 404].includes(conParametro.status));
  if (conParametro.status === 200) {
    assert.equal(
      conParametro.body.pagos.length,
      0,
      'el parámetro cliente_id debe ser ignorado: siempre se usa el token'
    );
  }
});

test('US-S2-10: sin token mi-cuenta responde 401', async (t) => {
  if (saltar(t)) return;

  await request(app).get('/api/mi-cuenta/membresia').expect(401);
});
