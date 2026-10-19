// Pruebas de integración de identificación facial (T045, US-S2-07).
// Recorrido: descriptor registrado → identificación → registro del intento en
// `accesos` (RN-10) → reintentos ilimitados siempre registrados.
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
let idCliente = null;
const app = crearApp();

const DESCRIPTOR_REGISTRADO = descriptorDePrueba(30);

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  token = login.body.token;

  const [clientes] = await obtenerPool().query(
    "INSERT INTO clientes (nombre, apellido, correo) VALUES ('Identificacion', 'Prueba', 'ident@ident.test')"
  );
  idCliente = clientes.insertId;

  const [tipos] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'activo')`,
    [idCliente, tipos[0].id_tipo_membresia]
  );
  await obtenerPool().query('INSERT INTO rostros (id_cliente, descriptor) VALUES (?, ?)', [
    idCliente,
    JSON.stringify(DESCRIPTOR_REGISTRADO),
  ]);
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

function descriptorDesconocido() {
  return Array.from({ length: 128 }, (_v, i) => Number((Math.cos(i * 7 + 3) * 0.9).toFixed(6)));
}

test('US-S2-07: identificar genera un registro de acceso autorizado en MySQL (RN-10)', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/accesos/identificar')
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptor: DESCRIPTOR_REGISTRADO })
    .expect(200);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT * FROM accesos WHERE id_cliente = ? ORDER BY id_acceso DESC LIMIT 1',
    [idCliente]
  );
  assert.equal(filas.length, 1, 'debe quedar registrado el intento');
  assert.equal(filas[0].resultado, 'autorizado');
  assert.equal(filas[0].motivo, null);
  assert.ok(filas[0].fecha, 'la fecha la pone el servidor');
  assert.ok(filas[0].hora, 'la hora la pone el servidor');
});

test('US-S2-07: los reintentos ilimitados quedan siempre registrados (RN-10)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [antes] = await obtenerPool().query('SELECT COUNT(*) AS total FROM accesos');
  const totalAntes = Number(antes[0].total);

  // Cinco intentos fallidos seguidos (sin identificación): todos registrados.
  for (let i = 0; i < 5; i += 1) {
    await request(app)
      .post('/api/accesos/identificar')
      .set('Authorization', `Bearer ${token}`)
      .send({ descriptor: descriptorDesconocido() })
      .expect(200);
  }

  const [despues] = await obtenerPool().query('SELECT COUNT(*) AS total FROM accesos');
  assert.equal(Number(despues[0].total), totalAntes + 5, 'cada intento debe generar un registro');
});

test('US-S2-07: el intento sin identificación queda con id_cliente NULL y motivo', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/accesos/identificar')
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptor: descriptorDesconocido() })
    .expect(200);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT * FROM accesos WHERE id_cliente IS NULL ORDER BY id_acceso DESC LIMIT 1'
  );
  assert.equal(filas.length, 1);
  assert.equal(filas[0].resultado, 'rechazado');
  assert.equal(filas[0].motivo, 'identificacion_no_reconocida');
});

test('US-S2-07: la auditoría registra el resultado del control de acceso sin datos biométricos', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/accesos/identificar')
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptor: DESCRIPTOR_REGISTRADO })
    .expect(200);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    "SELECT * FROM auditoria WHERE modulo = 'accesos' ORDER BY id_auditoria DESC LIMIT 1"
  );
  assert.equal(filas.length, 1);
  assert.equal(filas[0].accion, 'control de acceso');
  assert.ok(filas[0].descripcion.includes(String(idCliente)));
  // Nunca datos biométricos en la auditoría (FR-016).
  assert.ok(!/[\d\.\-]{20,}/.test(filas[0].descripcion), 'sin descriptores en la descripción');
});
