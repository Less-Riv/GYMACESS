// Pruebas de contrato de la exportación a PDF (T040, US-S4-05;
// contracts/api-reportes.md).
// Un archivo por reporte: evita que dos historias en paralelo escriban en el
// mismo archivo (hallazgo H-AN-02).
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
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Contrato ${rol}`, `${rol}@exportacion.test`, 'x', rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;
});

after(async () => {
  await finalizarPruebas();
});

function saltar(t) {
  if (!disponible) {
    t.skip('MySQL no está disponible; pruebas de contrato omitidas.');
    return true;
  }
  return false;
}

const TIPOS = ['clientes', 'membresias', 'pagos', 'adeudos', 'accesos'];

test('US-S4-05: el administrador descarga el PDF de cada reporte (200)', async (t) => {
  if (saltar(t)) return;

  for (const tipo of TIPOS) {
    const respuesta = await request(app)
      .get(`/api/reportes/${tipo}/exportar?desde=2020-01-01&hasta=2030-12-31`)
      .set('Authorization', `Bearer ${tokens.administrador}`)
      .expect(200)
      .expect('Content-Type', /application\/pdf/);

    assert.match(
      respuesta.headers['content-disposition'],
      new RegExp(`attachment; filename="reporte-${tipo}-`),
      `el ${tipo} se descarga como adjunto`
    );
    assert.match(
      Buffer.from(respuesta.body).toString('latin1'),
      /^%PDF-/,
      `el ${tipo} devuelve un archivo PDF válido`
    );

    // Los encabezados de control del truncamiento (FR-019).
    assert.ok(
      respuesta.headers['x-reporte-total-filas'] !== undefined,
      'falta el total de filas exportadas'
    );
    assert.ok(
      respuesta.headers['x-reporte-filas-exportadas'] !== undefined,
      'falta el número de filas exportadas'
    );
    assert.ok(
      respuesta.headers['x-reporte-truncado'] !== undefined,
      'falta la indicación de truncamiento'
    );
  }
});

test('US-S4-05: la exportación devuelve el conjunto filtrado completo, no la página (FR-019)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [tipo] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  for (let indice = 0; indice < 25; indice += 1) {
    const correo = `us-s4-05-pag-${indice}@reportes.test`;
    await obtenerPool().query(
      `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
       VALUES (?, ?, ?, CURDATE(), 'activo')`,
      ['Exportacion', `Pagos ${indice}`, correo]
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
       SELECT c.id_cliente, m.id_membresia, 50.00, '2025-12-01 10:00:00', 'Efectivo', 'completado'
       FROM clientes c, membresias m
       WHERE c.correo = ? AND m.id_cliente = c.id_cliente`,
      [correo]
    );
  }

  const consulta = await request(app)
    .get('/api/reportes/pagos?desde=2025-12-01&hasta=2025-12-31')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const exportacion = await request(app)
    .get('/api/reportes/pagos/exportar?desde=2025-12-01&hasta=2025-12-31')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.equal(
    Number(exportacion.headers['x-reporte-filas-exportadas']),
    consulta.body.paginacion.total,
    'el archivo contiene todas las filas del conjunto filtrado, no solo la primera página'
  );
  assert.ok(
    consulta.body.paginacion.total > 20,
    'el conjunto filtrado tiene más filas que una página'
  );
  assert.equal(exportacion.headers['x-reporte-truncado'], 'false');
});

test('US-S4-05: un periodo inválido en la exportación responde 400 VALIDACION (FR-016)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/clientes/exportar?desde=2026-12-31&hasta=2026-01-01')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

test('US-S4-05: recepcionista, entrenador y cliente reciben 403 (FR-001)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const respuesta = await request(app)
      .get('/api/reportes/clientes/exportar')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

test('US-S4-05: sin token responde 401', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/clientes/exportar')
    .expect(401);
  assert.equal(respuesta.body.codigo, 'AUTH_REQUERIDA');
});
