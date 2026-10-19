// Pruebas de integración de validación de acceso (T051, US-S2-08).
// Recorrido: identificar → validar membresía → autorizar o rechazar →
// registrar SIEMPRE el intento (RN-10).
// Se prueban los cuatro estados de membresía y el caso límite RN-09.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  SEMILLA,
} from '../ayuda/base-pruebas.js';
import { descriptorDePrueba } from '../ayuda/descriptores-faciales.js';

let disponible = false;
let token = null;
let idTipo = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  token = login.body.token;

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
    t.skip('MySQL no está disponible; pruebas de integración omitidas.');
    return true;
  }
  return false;
}

// Crea un cliente con descriptor facial y una membresía en el estado dado.
async function crearClienteConEstado(correo, estado, { fechaInicio, fechaFin } = {}) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const semilla = Math.floor(Math.random() * 100000);
  const descriptor = descriptorDePrueba(semilla);

  const [clientes] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Validación', 'Acceso', correo]
  );
  const idCliente = clientes.insertId;

  // 'ninguna' permite probar el caso límite de cliente sin membresía (RN-09).
  if (estado !== 'ninguna') {
    await obtenerPool().query(
      `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
       VALUES (?, ?, COALESCE(?, CURDATE()), COALESCE(?, DATE_ADD(CURDATE(), INTERVAL 30 DAY)), ?)`,
      [idCliente, idTipo, fechaInicio || null, fechaFin || null, estado]
    );
  }

  await obtenerPool().query('INSERT INTO rostros (id_cliente, descriptor) VALUES (?, ?)', [
    idCliente,
    JSON.stringify(descriptor),
  ]);

  return { idCliente, descriptor };
}

async function contarAccesos(idCliente) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT COUNT(*) AS total FROM accesos WHERE id_cliente = ?',
    [idCliente]
  );
  return Number(filas[0].total);
}

// Devuelve la petición de supertest (sin async: `.expect` debe estar disponible).
function identificar(descriptor) {
  return request(app)
    .post('/api/accesos/identificar')
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptor });
}

test('US-S2-08: con membresía activa y vigente el acceso queda autorizado', async (t) => {
  if (saltar(t)) return;
  const { idCliente, descriptor } = await crearClienteConEstado('activa@valid.test', 'activo');

  const respuesta = await identificar(descriptor).expect(200);
  assert.equal(respuesta.body.identificado, true);
  assert.equal(respuesta.body.autorizado, true);
  assert.equal(respuesta.body.cliente.id_cliente, idCliente);

  assert.equal(await contarAccesos(idCliente), 1, 'el intento debe quedar registrado');
});

test('US-S2-08: con membresía vencida se rechaza con motivo membresia_vencida (sin tolerancia)', async (t) => {
  if (saltar(t)) return;
  // Estado almacenado 'activo' pero con fecha de fin ayer: efectivamente
  // vencida; no hay tolerancia tras el vencimiento (clarificación Q1).
  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { idCliente, descriptor } = await crearClienteConEstado('vencida@valid.test', 'activo', {
    fechaFin: ayer,
  });

  const respuesta = await identificar(descriptor).expect(200);
  assert.equal(respuesta.body.identificado, true, 'sí identifica al cliente');
  assert.equal(respuesta.body.autorizado, false);
  assert.equal(respuesta.body.motivo, 'membresia_vencida');

  // RN-10: el intento rechazado también queda registrado.
  assert.equal(await contarAccesos(idCliente), 1);
});

test('US-S2-08: con membresía suspendida se rechaza con motivo membresia_suspendida', async (t) => {
  if (saltar(t)) return;
  const { idCliente, descriptor } = await crearClienteConEstado('suspendida@valid.test', 'suspendida');

  const respuesta = await identificar(descriptor).expect(200);
  assert.equal(respuesta.body.autorizado, false);
  assert.equal(respuesta.body.motivo, 'membresia_suspendida');
  assert.equal(await contarAccesos(idCliente), 1);
});

test('US-S2-08: con membresía cancelada se rechaza con motivo membresia_cancelada', async (t) => {
  if (saltar(t)) return;
  const { idCliente, descriptor } = await crearClienteConEstado('cancelada@valid.test', 'cancelada');

  const respuesta = await identificar(descriptor).expect(200);
  assert.equal(respuesta.body.autorizado, false);
  assert.equal(respuesta.body.motivo, 'membresia_cancelada');
  assert.equal(await contarAccesos(idCliente), 1);
});

test('US-S2-08: sin membresía se rechaza con motivo membresia_inexistente (RN-09)', async (t) => {
  if (saltar(t)) return;
  const { idCliente, descriptor } = await crearClienteConEstado('sinmembresia@valid.test', 'ninguna');

  const respuesta = await identificar(descriptor).expect(200);
  assert.equal(respuesta.body.identificado, true, 'sí identifica, pero no valida membresía');
  assert.equal(respuesta.body.autorizado, false);
  assert.equal(respuesta.body.motivo, 'membresia_inexistente');
  assert.equal(await contarAccesos(idCliente), 1);
});

test('US-S2-08: sin identificación exitosa no se valida membresía y el intento queda registrado (RN-09)', async (t) => {
  if (saltar(t)) return;

  const desconocido = Array.from({ length: 128 }, (_v, i) =>
    Number((Math.cos(i * 7 + 3) * 0.9).toFixed(6))
  );
  const respuesta = await identificar(desconocido).expect(200);

  assert.equal(respuesta.body.identificado, false);
  assert.equal(respuesta.body.autorizado, false);
  assert.equal(respuesta.body.motivo, 'identificacion_no_reconocida');

  // RN-10: también se registra el intento sin identificación.
  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT COUNT(*) AS total FROM accesos WHERE id_cliente IS NULL'
  );
  assert.ok(Number(filas[0].total) >= 1, 'el intento sin identificación debe quedar registrado');
});

test('US-S2-08: los cuatro estados quedan registrados en la tabla accesos (RN-10)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    `SELECT resultado, motivo, COUNT(*) AS total
     FROM accesos
     WHERE resultado = 'rechazado'
     GROUP BY resultado, motivo`
  );
  const motivos = filas.map((f) => f.motivo);
  for (const motivoEsperado of [
    'membresia_vencida',
    'membresia_suspendida',
    'membresia_cancelada',
    'membresia_inexistente',
    'identificacion_no_reconocida',
  ]) {
    assert.ok(
      motivos.includes(motivoEsperado),
      `debe existir al menos un registro rechazado con motivo ${motivoEsperado}`
    );
  }
});
