// Pruebas de contrato del reporte de clientes (T012, US-S4-01;
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
      [`Contrato ${rol}`, `${rol}@reportes.test`, 'x', rol]
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

test('US-S4-01: el administrador recibe el envelope del reporte de clientes (200)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/clientes?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.equal(respuesta.body.tipo, 'clientes');
  assert.equal(respuesta.body.periodo.desde, '2020-01-01');
  assert.equal(respuesta.body.periodo.hasta, '2030-12-31');
  assert.ok(Array.isArray(respuesta.body.filas));
  assert.ok(respuesta.body.subtotales !== undefined);

  // Totales del reporte (FR-006).
  assert.equal(typeof respuesta.body.totales.total, 'number');
  assert.equal(typeof respuesta.body.totales.por_estado, 'object');

  // Paginación (FR-014).
  assert.equal(respuesta.body.paginacion.limite, 20);
  assert.equal(respuesta.body.paginacion.pagina, 1);
  assert.equal(typeof respuesta.body.paginacion.total, 'number');
  assert.equal(typeof respuesta.body.paginacion.totalPaginas, 'number');

  // Cada fila trae las columnas del contrato.
  if (respuesta.body.filas.length > 0) {
    const fila = respuesta.body.filas[0];
    for (const campo of ['id_cliente', 'nombre_completo', 'correo', 'telefono', 'estado']) {
      assert.ok(fila[campo] !== undefined, `falta la columna ${campo}`);
    }
    // El nombre completo se devuelve unido, no en dos columnas sueltas.
    assert.ok(!fila.nombre, 'el nombre no se devuelve por separado');
  }
});

test('US-S4-01: el filtro de periodo y de estado se aplican (FR-012, FR-013)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [creado] = await obtenerPool().query(
    `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'Contrato',
      'Clientes',
      'contrato-clientes@reportes.test',
      '2021-05-10 08:00:00',
      'activo',
    ]
  );

  // El cliente creado cae dentro del periodo consultado.
  const dentro = await request(app)
    .get('/api/reportes/clientes?desde=2021-01-01&hasta=2021-12-31')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.ok(
    dentro.body.filas.some((fila) => fila.id_cliente === creado.insertId),
    'el cliente con registro en el periodo aparece'
  );

  // Y queda fuera cuando el periodo no lo cubre.
  const fuera = await request(app)
    .get('/api/reportes/clientes?desde=2022-01-01&hasta=2022-12-31')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.ok(
    !fuera.body.filas.some((fila) => fila.id_cliente === creado.insertId),
    'el cliente no aparece fuera de su periodo'
  );

  // El filtro por estado deja solo los clientes de ese estado (FR-013).
  const inactivos = await request(app)
    .get('/api/reportes/clientes?estado=inactivo')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.ok(
    inactivos.body.filas.every((fila) => fila.estado === 'inactivo'),
    'el listado respeta el filtro de estado'
  );
  assert.equal(
    inactivos.body.totales.total,
    inactivos.body.paginacion.total,
    'los totales respetan el filtro de estado (FR-017)'
  );
});

test('US-S4-01: un periodo invertido o mal formado responde 400 VALIDACION (FR-016)', async (t) => {
  if (saltar(t)) return;

  const invertida = await request(app)
    .get('/api/reportes/clientes?desde=2026-12-31&hasta=2026-01-01')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(invertida.body.codigo, 'VALIDACION');

  const malformada = await request(app)
    .get('/api/reportes/clientes?desde=31-12-2026')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(malformada.body.codigo, 'VALIDACION');
});

test('US-S4-01: un estado fuera del listado responde 400 VALIDACION (FR-013)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/clientes?estado=inexistente')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

test('US-S4-01: recepcionista, entrenador y cliente reciben 403 (FR-001)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const respuesta = await request(app)
      .get('/api/reportes/clientes')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

test('US-S4-01: sin token responde 401', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app).get('/api/reportes/clientes').expect(401);
  assert.equal(respuesta.body.codigo, 'AUTH_REQUERIDA');
});
