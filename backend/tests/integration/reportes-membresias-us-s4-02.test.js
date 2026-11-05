// Pruebas de integración de la historia US-S4-02 (T020): reporte de
// membresías. Recorrido completo: clasificación disjunta en los cuatro grupos
// → la suma de los grupos coincide con el total → el filtro por periodo se
// aplica sobre la vigencia → el filtro por estado acota el listado →
// paginación sin filas repetidas ni omitidas → resultado vacío con totales en
// cero (FR-007, FR-017, SC-014).
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

// Fecha ISO con los días indicados sobre hoy, para construir la ventana de
// "próxima a vencer" (7 días) del reporte.
function fechaISO(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

// Crea un cliente con una membresía en el estado y la vigencia indicados.
async function crearMembresia(estado, fechaInicio, fechaFin, sufijo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [cliente] = await obtenerPool().query(
    `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
     VALUES (?, ?, ?, CURDATE(), 'activo')`,
    ['Membresias', 'Reporte', `us-s4-02-${sufijo}@reportes.test`]
  );
  const [tipo] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  const [membresia] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [cliente.insertId, tipo[0].id_tipo_membresia, fechaInicio, fechaFin, estado]
  );
  return { idCliente: cliente.insertId, idMembresia: membresia.insertId };
}

test('US-S4-02: las membresías se clasifican en cuatro grupos disjuntos (FR-007)', async (t) => {
  if (saltar(t)) return;

  // Una membresía de cada grupo: activa lejana, próxima a vencer, vencida y
  // cancelada. Las fechas se calculan sobre hoy, como hace el reporte.
  const control = await crearMembresia(
    'activo',
    '2020-01-01',
    '2099-12-31',
    'activa'
  );
  // Vence dentro de los 7 días siguientes a hoy: es "próxima a vencer".
  const proxima = await crearMembresia(
    'activo',
    '2020-01-01',
    fechaISO(3),
    'proxima'
  );
  const vencida = await crearMembresia('vencida', '2020-01-01', '2021-01-01', 'vencida');
  const cancelada = await crearMembresia(
    'cancelada',
    '2020-01-01',
    '2021-01-01',
    'cancelada'
  );

  const respuesta = await request(app)
    .get('/api/reportes/membresias?desde=2020-01-01&hasta=2099-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const grupoDe = (idMembresia) => {
    const fila = respuesta.body.filas.find((item) => item.id_membresia === idMembresia);
    return fila ? fila.grupo : null;
  };

  assert.equal(grupoDe(control.idMembresia), 'activas');
  assert.equal(grupoDe(proxima.idMembresia), 'proximas_a_vencer');
  assert.equal(grupoDe(vencida.idMembresia), 'vencidas');
  assert.equal(grupoDe(cancelada.idMembresia), 'suspendidas_o_canceladas');

  // Los grupos son disjuntos: su suma es el total (SC-014).
  const suma =
    respuesta.body.totales.activas +
    respuesta.body.totales.proximas_a_vencer +
    respuesta.body.totales.vencidas +
    respuesta.body.totales.suspendidas_o_canceladas;
  assert.equal(suma, respuesta.body.totales.total, 'ninguna membresía se cuenta dos veces');
  assert.equal(
    respuesta.body.totales.total,
    respuesta.body.paginacion.total,
    'los totales coinciden con el total de la paginación (FR-017)'
  );
});

test('US-S4-02: una membresía activa que ya venció cuenta como vencida (FR-007)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filasHoy] = await obtenerPool().query('SELECT CURDATE() AS hoy');
  const control = await crearMembresia(
    'activo',
    '2020-01-01',
    '2021-06-30',
    'activa-vencida'
  );

  const respuesta = await request(app)
    .get('/api/reportes/membresias?desde=2020-01-01&hasta=2099-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const fila = respuesta.body.filas.find(
    (item) => item.id_membresia === control.idMembresia
  );
  assert.ok(fila, 'la membresía aparece en el reporte');
  assert.equal(fila.grupo, 'vencidas', 'el estado activo con fecha pasada es vencida');
  assert.ok(filasHoy[0].hoy, 'la base de datos conoce la fecha de hoy');
});

test('US-S4-02: el filtro por periodo se aplica sobre la vigencia (FR-012)', async (t) => {
  if (saltar(t)) return;

  const dentro = await crearMembresia('activo', '2021-03-01', '2021-09-30', 'dentro');
  const fuera = await crearMembresia('activo', '2019-03-01', '2019-09-30', 'fuera');

  const respuesta = await request(app)
    .get('/api/reportes/membresias?desde=2021-01-01&hasta=2021-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const ids = respuesta.body.filas.map((fila) => fila.id_membresia);
  assert.ok(ids.includes(dentro.idMembresia), 'la membresía del periodo aparece');
  assert.ok(!ids.includes(fuera.idMembresia), 'la membresía de otro periodo no aparece');
});

test('US-S4-02: el filtro por estado acota el listado (FR-013)', async (t) => {
  if (saltar(t)) return;

  const cancelada = await crearMembresia('cancelada', '2022-03-01', '2022-09-30', 'filtro');

  const respuesta = await request(app)
    .get('/api/reportes/membresias?desde=2022-01-01&hasta=2022-12-31&estado=cancelada')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.ok(
    respuesta.body.filas.every((fila) => fila.estado === 'cancelada'),
    'solo aparecen las membresías del estado filtrado'
  );
  assert.ok(
    respuesta.body.filas.some((fila) => fila.id_membresia === cancelada.idMembresia),
    'la membresía de control aparece'
  );
});

test('US-S4-02: la paginación recorre el conjunto sin repetir ni omitir filas (FR-014)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  for (let indice = 0; indice < 25; indice += 1) {
    const correo = `us-s4-02-pag-${indice}@reportes.test`;
    await obtenerPool().query(
      `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
       VALUES (?, ?, ?, CURDATE(), 'activo')`,
      ['Paginacion', `Membresias ${indice}`, correo]
    );
    await obtenerPool().query(
      `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
       SELECT c.id_cliente, t.id_tipo_membresia, '2025-01-01', '2099-12-31', 'activo'
       FROM clientes c, tipos_membresia t
       WHERE c.correo = ? AND t.nombre = 'Mensual'
       LIMIT 1`,
      [correo]
    );
  }

  const primera = await request(app)
    .get('/api/reportes/membresias?desde=2025-01-01&hasta=2099-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(primera.body.filas.length, 20, 'la primera página trae el tamaño de página');
  assert.ok(primera.body.paginacion.totalPaginas >= 2, 'hay más de una página');

  const segunda = await request(app)
    .get('/api/reportes/membresias?desde=2025-01-01&hasta=2099-12-31&pagina=2')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const idsPrimera = primera.body.filas.map((fila) => fila.id_membresia);
  const idsSegunda = segunda.body.filas.map((fila) => fila.id_membresia);
  const repetidas = idsPrimera.filter((id) => idsSegunda.includes(id));
  assert.equal(repetidas.length, 0, 'ninguna fila se repite entre páginas');
});

test('US-S4-02: un periodo sin datos devuelve resultado vacío y totales en cero (FR-015)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/membresias?desde=1990-01-01&hasta=1990-01-02')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.deepEqual(respuesta.body.filas, [], 'el listado viene vacío');
  assert.equal(respuesta.body.totales.total, 0);
  assert.equal(respuesta.body.totales.activas, 0);
  assert.equal(respuesta.body.totales.vencidas, 0);
  assert.equal(respuesta.body.paginacion.total, 0);
});
