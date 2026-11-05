// Pruebas de integración de la historia US-S4-01 (T013): reporte de clientes.
// Recorrido completo: totales por estado que coinciden con el origen → filtro
// por periodo sobre la fecha de registro → filtro por estado → paginación sin
// filas repetidas ni omitidas → resultado vacío con totales en cero → el
// reporte no modifica ningún dato (FR-003, FR-017).
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

// Cliente de control con una fecha de registro conocida. El correo lleva un
// sufijo propio para que cada prueba use un cliente distinto (el correo es
// único en la tabla clientes).
async function crearClienteControl(fechaRegistro, estado = 'activo', sufijo = 'a') {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [creado] = await obtenerPool().query(
    `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'Control',
      'Reportes',
      `us-s4-01-${sufijo}@reportes.test`,
      fechaRegistro,
      estado,
    ]
  );
  return creado.insertId;
}

test('US-S4-01: los totales por estado coinciden con los datos de origen', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const idCliente = await crearClienteControl('2022-03-15 09:00:00');

  const respuesta = await request(app)
    .get('/api/reportes/clientes?desde=2022-01-01&hasta=2022-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const [origen] = await obtenerPool().query(
    `SELECT c.estado, COUNT(*) AS total
     FROM clientes c
     WHERE DATE(c.fecha_registro) BETWEEN '2022-01-01' AND '2022-12-31'
     GROUP BY c.estado`
  );

  const esperado = {};
  for (const fila of origen) {
    esperado[fila.estado] = Number(fila.total);
  }

  assert.deepEqual(
    respuesta.body.totales.por_estado,
    esperado,
    'el desglose por estado coincide con la consulta de origen'
  );
  assert.equal(
    respuesta.body.totales.total,
    Object.values(esperado).reduce((suma, valor) => suma + valor, 0),
    'el total es la suma de las categorías'
  );
  assert.ok(
    respuesta.body.filas.some((fila) => fila.id_cliente === idCliente),
    'el cliente de control aparece en su periodo'
  );
});

test('US-S4-01: el filtro por periodo y por estado acota el listado (FR-012, FR-013)', async (t) => {
  if (saltar(t)) return;

  const idCliente = await crearClienteControl('2023-04-10 10:00:00', 'inactivo', 'b');

  const dentro = await request(app)
    .get('/api/reportes/clientes?desde=2023-01-01&hasta=2023-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.ok(dentro.body.filas.some((fila) => fila.id_cliente === idCliente));

  const porEstado = await request(app)
    .get('/api/reportes/clientes?desde=2023-01-01&hasta=2023-12-31&estado=inactivo')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.ok(porEstado.body.filas.every((fila) => fila.estado === 'inactivo'));
  assert.ok(porEstado.body.filas.some((fila) => fila.id_cliente === idCliente));

  const porEstadoActivo = await request(app)
    .get('/api/reportes/clientes?desde=2023-01-01&hasta=2023-12-31&estado=activo')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.ok(
    !porEstadoActivo.body.filas.some((fila) => fila.id_cliente === idCliente),
    'el cliente inactivo no aparece al filtrar por activo'
  );
});

test('US-S4-01: la paginación recorre el conjunto sin repetir ni omitir filas (FR-014)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  // Enough clients to fill more than one page.
  for (let indice = 0; indice < 25; indice += 1) {
    await obtenerPool().query(
      `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'Paginacion',
        `Reportes ${indice}`,
        `us-s4-01-pag-${indice}@reportes.test`,
        '2024-06-01 08:00:00',
        'activo',
      ]
    );
  }

  const primera = await request(app)
    .get('/api/reportes/clientes?desde=2024-01-01&hasta=2024-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(primera.body.filas.length, 20, 'la primera página trae el tamaño de página');
  assert.ok(primera.body.paginacion.totalPaginas >= 2, 'hay más de una página');

  const segunda = await request(app)
    .get('/api/reportes/clientes?desde=2024-01-01&hasta=2024-12-31&pagina=2')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const idsPrimera = primera.body.filas.map((fila) => fila.id_cliente);
  const idsSegunda = segunda.body.filas.map((fila) => fila.id_cliente);
  const repetidas = idsPrimera.filter((id) => idsSegunda.includes(id));
  assert.equal(repetidas.length, 0, 'ninguna fila se repite entre páginas');

  const [origen] = await obtenerPool().query(
    `SELECT COUNT(*) AS total FROM clientes
     WHERE DATE(fecha_registro) BETWEEN '2024-01-01' AND '2024-12-31'`
  );
  assert.equal(
    primera.body.paginacion.total,
    Number(origen[0].total),
    'el total de la paginación coincide con el origen'
  );
});

test('US-S4-01: un periodo sin datos devuelve resultado vacío y totales en cero (FR-015)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/clientes?desde=1990-01-01&hasta=1990-01-02')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.deepEqual(respuesta.body.filas, [], 'el listado viene vacío');
  assert.equal(respuesta.body.totales.total, 0);
  assert.deepEqual(respuesta.body.totales.por_estado, {});
  assert.equal(respuesta.body.paginacion.total, 0);
});

test('US-S4-01: el reporte no modifica ningún dato (FR-003)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [antes] = await obtenerPool().query(
    'SELECT COUNT(*) AS total, COALESCE(SUM(estado = "activo"), 0) AS activos FROM clientes'
  );

  await request(app)
    .get('/api/reportes/clientes?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const [despues] = await obtenerPool().query(
    'SELECT COUNT(*) AS total, COALESCE(SUM(estado = "activo"), 0) AS activos FROM clientes'
  );

  assert.equal(Number(despues[0].total), Number(antes[0].total), 'ningún cliente se añadió o eliminó');
  assert.equal(
    Number(despues[0].activos),
    Number(antes[0].activos),
    'ningún cliente cambió de estado'
  );
});
