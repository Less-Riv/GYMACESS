// Pruebas de integración de renovación de membresías (T056, US-S2-03).
// Recorrido: renovación de una activa y de una vencida extendiendo la
// vigencia; rechazo de suspendida y cancelada con mensaje claro.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  SEMILLA,
} from '../ayuda/base-pruebas.js';

let disponible = false;
let token = null;
let idTipoMensual = null;
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
  idTipoMensual = tipos[0].id_tipo_membresia;
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

async function crearMembresia(correo, { estado = 'activo', fechaInicio = null, fechaFin = null } = {}) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [clientes] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Renovación', 'Prueba', correo]
  );
  const [membresias] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, COALESCE(?, CURDATE()), COALESCE(?, DATE_ADD(CURDATE(), INTERVAL 30 DAY)), ?)`,
    [clientes.insertId, idTipoMensual, fechaInicio, fechaFin, estado]
  );
  return { idCliente: clientes.insertId, idMembresia: membresias.insertId };
}

// Devuelve la petición de supertest (sin async: `.expect` debe estar disponible).
function renovar(idMembresia, idTipo = idTipoMensual) {
  return request(app)
    .put(`/api/membresias/${idMembresia}/renovar`)
    .set('Authorization', `Bearer ${token}`)
    .send({ id_tipo_membresia: idTipo });
}

test('US-S2-03: renovar una membresía activa extiende su vigencia y la persiste', async (t) => {
  if (saltar(t)) return;

  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { idMembresia } = await crearMembresia('activa@renovacion.test', { fechaFin: ayer });

  const respuesta = await renovar(idMembresia).expect(200);
  const nuevaFin = new Date(respuesta.body.membresia.fecha_fin).toISOString().slice(0, 10);

  // La membresía estaba vencida (fin ayer); la renovación parte de hoy y suma
  // la duración del tipo (30 días del tipo Mensual).
  const hoy = new Date().toISOString().slice(0, 10);
  const esperada = new Date();
  esperada.setUTCDate(esperada.getUTCDate() + 30);
  assert.equal(nuevaFin, esperada.toISOString().slice(0, 10));
  assert.ok(nuevaFin >= hoy, 'la nueva fecha de fin debe quedar en el futuro');
  assert.equal(respuesta.body.membresia.estado, 'activo');

  // Persistencia: el cambio se guardó en MySQL.
  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT fecha_fin, estado FROM membresias WHERE id_membresia = ?',
    [idMembresia]
  );
  assert.equal(
    new Date(filas[0].fecha_fin).toISOString().slice(0, 10),
    nuevaFin,
    'la nueva fecha debe persistir en MySQL'
  );
});

test('US-S2-03: renovar una membresía vencida la reactiva (una activa por cliente)', async (t) => {
  if (saltar(t)) return;

  const pasada = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { idMembresia } = await crearMembresia('vencida@renovacion.test', {
    estado: 'vencida',
    fechaFin: pasada,
  });

  const respuesta = await renovar(idMembresia).expect(200);
  assert.equal(respuesta.body.membresia.estado, 'activo');

  const nuevaFin = new Date(respuesta.body.membresia.fecha_fin).toISOString().slice(0, 10);
  assert.ok(nuevaFin > new Date().toISOString().slice(0, 10), 'debe quedar vigente');
});

test('US-S2-03: la renovación no crea una membresía nueva; extiende la misma (esc. 1)', async (t) => {
  if (saltar(t)) return;

  const { idCliente, idMembresia } = await crearMembresia('misma@renovacion.test');

  await renovar(idMembresia).expect(200);
  await renovar(idMembresia).expect(200);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT COUNT(*) AS total FROM membresias WHERE id_cliente = ?',
    [idCliente]
  );
  assert.equal(
    Number(filas[0].total),
    1,
    'la renovación debe extender la misma membresía, sin crear otra'
  );
});

test('US-S2-03: una membresía suspendida responde 409 con mensaje claro', async (t) => {
  if (saltar(t)) return;

  const { idMembresia } = await crearMembresia('suspendida@renovacion.test', {
    estado: 'suspendida',
  });

  const respuesta = await renovar(idMembresia).expect(409);
  assert.equal(respuesta.body.codigo, 'MEMBRESIA_NO_RENOVABLE');
  assert.ok(respuesta.body.mensaje.includes('suspendida'));
});

test('US-S2-03: una membresía cancelada responde 409 con mensaje claro', async (t) => {
  if (saltar(t)) return;

  const { idMembresia } = await crearMembresia('cancelada@renovacion.test', {
    estado: 'cancelada',
  });

  const respuesta = await renovar(idMembresia).expect(409);
  assert.equal(respuesta.body.codigo, 'MEMBRESIA_NO_RENOVABLE');
  assert.ok(respuesta.body.mensaje.includes('cancelada'));
});
