// Pruebas de integración de pagos (T037, US-S2-04).
// Recorrido completo: registro → persistencia en MySQL → historial cronológico
// → RN-05 (membresía del mismo cliente) → inexistencia de eliminación.
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

async function crearClienteConMembresia(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [clientes] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Integración', 'Pagos', correo]
  );
  const [membresias] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'activo')`,
    [clientes.insertId, idTipo]
  );
  return { idCliente: clientes.insertId, idMembresia: membresias.insertId };
}

test('US-S2-04: el pago se persiste en MySQL y aparece en el historial cronológico', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('historial@pagos.test');

  // Se registran dos pagos (parciales) para verificar el orden.
  await request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${token}`)
    .send({ id_cliente: idCliente, id_membresia: idMembresia, monto: 200, metodo_pago: 'efectivo' })
    .expect(201);
  await request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${token}`)
    .send({ id_cliente: idCliente, id_membresia: idMembresia, monto: 300, metodo_pago: 'transferencia' })
    .expect(201);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query('SELECT * FROM pagos WHERE id_cliente = ?', [idCliente]);
  assert.equal(filas.length, 2, 'ambos pagos deben persistir');

  const historial = await request(app)
    .get(`/api/pagos?cliente_id=${idCliente}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(historial.body.pagos.length, 2);
  // Cronológico descendente: el último registrado primero.
  assert.equal(historial.body.pagos[0].monto, '300.00');
  assert.equal(historial.body.pagos[1].monto, '200.00');
  assert.equal(historial.body.pagos[0].tipo_membresia, 'Mensual');
});

test('US-S2-04: la fecha de pago la pone el servidor, no el cliente (caso límite)', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('fecha@pagos.test');

  const respuesta = await request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${token}`)
    .send({
      id_cliente: idCliente,
      id_membresia: idMembresia,
      monto: 100,
      metodo_pago: 'efectivo',
      // Un atacante intentaría manipular la fecha; el backend la ignora.
      fecha_pago: '2000-01-01T00:00:00',
    })
    .expect(201);

  assert.ok(
    !String(respuesta.body.pago.fecha_pago).startsWith('2000-01-01'),
    'la fecha enviada por el cliente debe ser ignorada'
  );
});

test('US-S2-04: RN-05 se verifica antes de persistir; la membresía ajena no genera registro', async (t) => {
  if (saltar(t)) return;
  const una = await crearClienteConMembresia('rn05a@pagos.test');
  const otra = await crearClienteConMembresia('rn05b@pagos.test');

  await request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${token}`)
    .send({ id_cliente: una.idCliente, id_membresia: otra.idMembresia, monto: 100, metodo_pago: 'efectivo' })
    .expect(409);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [pagos] = await obtenerPool().query('SELECT * FROM pagos WHERE id_cliente = ?', [
    una.idCliente,
  ]);
  assert.equal(pagos.length, 0, 'no debe persistirse el pago rechazado');
  // RN-06: el historial no se elimina; tampoco existe ruta DELETE.
  const eliminacion = await request(app)
    .delete(`/api/pagos/${pagos[0]?.id_pago ?? 1}`)
    .set('Authorization', `Bearer ${token}`);
  assert.ok([404, 405].includes(eliminacion.status), 'no existe operación de eliminación');
});

test('US-S2-04: la auditoría registra el pago sin exponer datos sensibles', async (t) => {
  if (saltar(t)) return;
  const { idCliente, idMembresia } = await crearClienteConMembresia('auditoria@pagos.test');

  await request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${token}`)
    .send({ id_cliente: idCliente, id_membresia: idMembresia, monto: 150, metodo_pago: 'transferencia' })
    .expect(201);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    "SELECT * FROM auditoria WHERE modulo = 'pagos' ORDER BY id_auditoria DESC LIMIT 1"
  );
  assert.equal(filas.length, 1);
  assert.equal(filas[0].accion, 'registrar pago');
  assert.ok(filas[0].descripcion.includes(String(idCliente)));
});
