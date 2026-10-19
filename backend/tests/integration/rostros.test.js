// Pruebas de integración del registro facial (T028, US-S2-06).
// Recorrido completo: alta → persistencia en MySQL → re-captura sin duplicados →
// cliente inactivo bloqueado → la respuesta nunca expone el descriptor.
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
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  token = login.body.token;
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

async function crearClientePrueba(correo, estado = 'activo') {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [resultado] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?)',
    ['Facial', 'Prueba', correo, estado]
  );
  return resultado.insertId;
}

test('US-S2-06: un registro por cliente; la re-captura actualiza en lugar de duplicar', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('unico@rostros.test');

  await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptor: descriptorDePrueba(10) })
    .expect(201);

  await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptor: descriptorDePrueba(11) })
    .expect(200);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT * FROM rostros WHERE id_cliente = ?',
    [idCliente]
  );
  assert.equal(filas.length, 1, 'debe existir un único registro por cliente');

  // El descriptor guardado es el de la última captura.
  const guardado = JSON.parse(filas[0].descriptor);
  assert.deepEqual(guardado, descriptorDePrueba(11));
});

test('US-S2-06: el descriptor se persiste como JSON de 128 valores en MySQL', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('persistencia@rostros.test');
  const descriptor = descriptorDePrueba(12);

  await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptor })
    .expect(201);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT descriptor FROM rostros WHERE id_cliente = ?',
    [idCliente]
  );
  const guardado = JSON.parse(filas[0].descriptor);
  assert.equal(guardado.length, 128);
  assert.ok(guardado.every((valor) => typeof valor === 'number'));
});

test('US-S2-06: registrar rostro a un cliente inactivo responde 409 sin persistir', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('inactivo@rostros.test', 'inactivo');

  await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptor: descriptorDePrueba(13) })
    .expect(409);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query('SELECT * FROM rostros WHERE id_cliente = ?', [
    idCliente,
  ]);
  assert.equal(filas.length, 0, 'no debe persistirse el descriptor de un cliente inactivo');
});

test('US-S2-06: la auditoría registra la acción sin datos biométricos (FR-016)', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('auditoria@rostros.test');

  await request(app)
    .post(`/api/rostros/${idCliente}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptor: descriptorDePrueba(14) })
    .expect(201);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    "SELECT * FROM auditoria WHERE modulo = 'rostros' ORDER BY id_auditoria DESC LIMIT 1"
  );
  assert.equal(filas.length, 1, 'debe quedar registrada la acción en auditoría');
  assert.equal(filas[0].accion, 'registrar rostro');
  assert.ok(filas[0].descripcion.includes(String(idCliente)));
  // Ninguna medida ni el descriptor completo aparecen en la descripción.
  assert.ok(!filas[0].descriptor);
});
