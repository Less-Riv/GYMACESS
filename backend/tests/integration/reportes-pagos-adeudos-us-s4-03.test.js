// Pruebas de integración de la historia US-S4-03 (T027): reportes de pagos
// e ingresos y de adeudos. Recorrido completo: el total de ingresos coincide
// con la suma de los pagos completados → los pagos no completados no se
// contabilizan → el adeudo se calcula sobre la última membresía registrada →
// el saldo nunca es negativo → la paginación no repite ni omite filas
// (H-AN-03) → un filtro sin datos devuelve resultado vacío (H-AN-05) → el
// reporte no modifica ningún dato (FR-003).
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
let token = '';
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

// Crea un cliente con su membresía 'Mensual' (precio 500.00) y los pagos
// indicados.
async function crearClienteConPagos(sufijo, pagos) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [cliente] = await obtenerPool().query(
    `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
     VALUES (?, ?, ?, CURDATE(), 'activo')`,
    ['Pagos', 'Reporte', `us-s4-03-${sufijo}@reportes.test`]
  );
  const [tipo] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  const [membresia] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, '2024-01-01', '2027-01-01', 'activo')`,
    [cliente.insertId, tipo[0].id_tipo_membresia]
  );

  for (const pago of pagos) {
    await obtenerPool().query(
      `INSERT INTO pagos (id_cliente, id_membresia, monto, fecha_pago, metodo_pago, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cliente.insertId,
        membresia.insertId,
        pago.monto,
        pago.fecha,
        'Efectivo',
        pago.estado,
      ]
    );
  }

  return { idCliente: cliente.insertId, idMembresia: membresia.insertId };
}

test('US-S4-03: el total de ingresos coincide con la suma de los pagos listados (FR-008, FR-017)', async (t) => {
  if (saltar(t)) return;

  const control = await crearClienteConPagos('ingresos', [
    { monto: 120.5, fecha: '2025-05-10 10:00:00', estado: 'completado' },
    { monto: 79.5, fecha: '2025-05-11 10:00:00', estado: 'completado' },
  ]);

  const respuesta = await request(app)
    .get('/api/reportes/pagos?desde=2025-05-01&hasta=2025-05-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const suma = respuesta.body.filas.reduce(
    (total, fila) => total + Number(fila.monto),
    0
  );
  assert.equal(
    Number(respuesta.body.totales.total_ingresos),
    Number(suma.toFixed(2)),
    'el total de ingresos es la suma de las filas mostradas'
  );
  assert.equal(
    respuesta.body.totales.total_pagos,
    respuesta.body.paginacion.total,
    'el número de pagos coincide con la paginación'
  );
  assert.ok(
    respuesta.body.filas.some((fila) => fila.id_cliente === control.idCliente),
    'los pagos del cliente de control aparecen'
  );
});

test('US-S4-03: los pagos no completados no se listan ni se contabilizan (FR-008)', async (t) => {
  if (saltar(t)) return;

  const control = await crearClienteConPagos('estados', [
    { monto: 100, fecha: '2025-06-10 10:00:00', estado: 'completado' },
    { monto: 999, fecha: '2025-06-11 10:00:00', estado: 'pendiente' },
    { monto: 888, fecha: '2025-06-12 10:00:00', estado: 'cancelado' },
  ]);

  const respuesta = await request(app)
    .get('/api/reportes/pagos?desde=2025-06-01&hasta=2025-06-30')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const delCliente = respuesta.body.filas.filter(
    (fila) => fila.id_cliente === control.idCliente
  );
  assert.equal(delCliente.length, 1, 'solo se lista el pago completado');
  assert.equal(Number(delCliente[0].monto), 100);
  assert.ok(
    respuesta.body.filas.every((fila) => fila.estado === 'completado'),
    'ningún pago distinto de completado aparece en el listado'
  );
});

test('US-S4-03: el adeudo se calcula sobre la última membresía registrada (FR-011)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  // Cliente con dos membresías: la última registrada es la Trimestral
  // (1350.00). Ha pagado 400.00, así que su adeudo es 950.00.
  const [cliente] = await obtenerPool().query(
    `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
     VALUES (?, ?, ?, CURDATE(), 'activo')`,
    ['Adeudo', 'Reporte', 'us-s4-03-adeudo@reportes.test']
  );
  const [mensual] = await obtenerPool().query(
    "SELECT id_tipo_membresia, precio FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  const [trimestral] = await obtenerPool().query(
    "SELECT id_tipo_membresia, precio FROM tipos_membresia WHERE nombre = 'Trimestral' LIMIT 1"
  );

  await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, '2024-01-01', '2024-06-01', 'activo')`,
    [cliente.insertId, mensual[0].id_tipo_membresia]
  );
  const [ultima] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, '2024-06-01', '2027-06-01', 'activo')`,
    [cliente.insertId, trimestral[0].id_tipo_membresia]
  );
  await obtenerPool().query(
    `INSERT INTO pagos (id_cliente, id_membresia, monto, fecha_pago, metodo_pago, estado)
     VALUES (?, ?, 400.00, '2024-07-01 10:00:00', 'Efectivo', 'completado')`,
    [cliente.insertId, ultima.insertId]
  );

  const respuesta = await request(app)
    .get('/api/reportes/adeudos')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const fila = respuesta.body.filas.find(
    (item) => item.id_cliente === cliente.insertId
  );
  assert.ok(fila, 'el cliente con adeudo aparece en el reporte');
  assert.equal(
    Number(fila.precio_membresia),
    Number(trimestral[0].precio),
    'el precio es el de la última membresía registrada'
  );
  assert.equal(Number(fila.total_pagado), 400);
  assert.equal(
    Number(fila.saldo_pendiente),
    Number(trimestral[0].precio) - 400,
    'el adeudo es el precio menos los pagos completados'
  );
  assert.equal(fila.estado_membresia, 'activo', 'el reporte muestra el estado de la membresía');
});

test('US-S4-03: un cliente que pagó de más no aparece con adeudo (FR-011)', async (t) => {
  if (saltar(t)) return;

  const control = await crearClienteConPagos('saldado', [
    { monto: 800, fecha: '2025-07-10 10:00:00', estado: 'completado' },
  ]);

  const respuesta = await request(app)
    .get('/api/reportes/adeudos')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.ok(
    !respuesta.body.filas.some((fila) => fila.id_cliente === control.idCliente),
    'un cliente sin saldo pendiente no aparece'
  );
});

test('US-S4-03: la paginación recorre el conjunto sin repetir ni omitir filas (FR-014, H-AN-03)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [tipo] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  for (let indice = 0; indice < 25; indice += 1) {
    const correo = `us-s4-03-pag-${indice}@reportes.test`;
    await obtenerPool().query(
      `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
       VALUES (?, ?, ?, CURDATE(), 'activo')`,
      ['Paginacion', `Pagos ${indice}`, correo]
    );
    const [cliente] = await obtenerPool().query(
      'SELECT id_cliente FROM clientes WHERE correo = ?',
      [correo]
    );
    await obtenerPool().query(
      `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
       VALUES (?, ?, '2024-01-01', '2027-01-01', 'activo')`,
      [cliente[0].id_cliente, tipo[0].id_tipo_membresia]
    );
    await obtenerPool().query(
      `INSERT INTO pagos (id_cliente, id_membresia, monto, fecha_pago, metodo_pago, estado)
       SELECT c.id_cliente, m.id_membresia, 50.00, '2025-08-01 10:00:00', 'Efectivo', 'completado'
       FROM clientes c, membresias m
       WHERE c.correo = ? AND m.id_cliente = c.id_cliente`,
      [correo]
    );
  }

  const primera = await request(app)
    .get('/api/reportes/pagos?desde=2025-08-01&hasta=2025-08-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(primera.body.filas.length, 20, 'la primera página trae el tamaño de página');
  assert.ok(primera.body.paginacion.totalPaginas >= 2, 'hay más de una página');

  const segunda = await request(app)
    .get('/api/reportes/pagos?desde=2025-08-01&hasta=2025-08-31&pagina=2')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const idsPrimera = primera.body.filas.map((fila) => fila.id_pago);
  const idsSegunda = segunda.body.filas.map((fila) => fila.id_pago);
  const repetidas = idsPrimera.filter((id) => idsSegunda.includes(id));
  assert.equal(repetidas.length, 0, 'ninguna fila se repite entre páginas');
});

test('US-S4-03: un filtro sin datos devuelve resultado vacío y totales en cero (FR-015, H-AN-05)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/pagos?desde=1990-01-01&hasta=1990-01-02')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.deepEqual(respuesta.body.filas, [], 'el listado viene vacío');
  assert.equal(respuesta.body.totales.total_pagos, 0);
  assert.equal(respuesta.body.totales.total_ingresos, '0.00');
  assert.equal(respuesta.body.paginacion.total, 0);
});

test('US-S4-03: los reportes no modifican ningún dato (FR-003)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [antes] = await obtenerPool().query(
    `SELECT (SELECT COUNT(*) FROM pagos) AS pagos,
            (SELECT COUNT(*) FROM membresias) AS membresias,
            (SELECT COALESCE(SUM(monto), 0) FROM pagos) AS monto`
  );

  await request(app)
    .get('/api/reportes/pagos?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  await request(app)
    .get('/api/reportes/adeudos')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const [despues] = await obtenerPool().query(
    `SELECT (SELECT COUNT(*) FROM pagos) AS pagos,
            (SELECT COUNT(*) FROM membresias) AS membresias,
            (SELECT COALESCE(SUM(monto), 0) FROM pagos) AS monto`
  );

  assert.equal(Number(despues[0].pagos), Number(antes[0].pagos), 'ningún pago se añadió o eliminó');
  assert.equal(
    Number(despues[0].membresias),
    Number(antes[0].membresias),
    'ninguna membresía se añadió o eliminó'
  );
  assert.equal(
    Number(despues[0].monto),
    Number(antes[0].monto),
    'ningún monto cambió'
  );
});
