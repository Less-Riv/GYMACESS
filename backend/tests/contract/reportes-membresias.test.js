// Pruebas de contrato del reporte de membresías (T019, US-S4-02;
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
      [`Contrato ${rol}`, `${rol}@membresias.test`, 'x', rol]
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

test('US-S4-02: el administrador recibe los cuatro grupos del reporte (200)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/membresias?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.equal(respuesta.body.tipo, 'membresias');
  assert.ok(Array.isArray(respuesta.body.filas));

  // Los cuatro totales de FR-007, siempre presentes.
  for (const clave of [
    'total',
    'activas',
    'proximas_a_vencer',
    'vencidas',
    'suspendidas_o_canceladas',
  ]) {
    assert.equal(
      typeof respuesta.body.totales[clave],
      'number',
      `falta el total ${clave}`
    );
  }

  // La suma de los cuatro grupos es el total (SC-014).
  const suma =
    respuesta.body.totales.activas +
    respuesta.body.totales.proximas_a_vencer +
    respuesta.body.totales.vencidas +
    respuesta.body.totales.suspendidas_o_canceladas;
  assert.equal(suma, respuesta.body.totales.total, 'los grupos son disjuntos');

  // Cada fila trae su grupo, y el grupo es uno de los cuatro.
  const GRUPOS = ['activas', 'proximas_a_vencer', 'vencidas', 'suspendidas_o_canceladas'];
  for (const fila of respuesta.body.filas) {
    assert.ok(GRUPOS.includes(fila.grupo), `grupo inesperado: ${fila.grupo}`);
    assert.ok(fila.fecha_inicio !== undefined, 'falta la fecha de inicio');
    assert.ok(fila.fecha_fin !== undefined, 'falta la fecha de fin');
    assert.ok(fila.nombre_completo !== undefined, 'falta el nombre del cliente');
  }
});

test('US-S4-02: el filtro por estado valida contra el ENUM (FR-013)', async (t) => {
  if (saltar(t)) return;

  const valido = await request(app)
    .get('/api/reportes/membresias?estado=vencida')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.ok(
    valido.body.filas.every((fila) => fila.estado === 'vencida'),
    'el listado respeta el filtro de estado'
  );

  const invalido = await request(app)
    .get('/api/reportes/membresias?estado=inexistente')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(invalido.body.codigo, 'VALIDACION');
});

test('US-S4-02: un periodo invertido o mal formado responde 400 VALIDACION (FR-016)', async (t) => {
  if (saltar(t)) return;

  const invertida = await request(app)
    .get('/api/reportes/membresias?desde=2026-12-31&hasta=2026-01-01')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(invertida.body.codigo, 'VALIDACION');

  const malformada = await request(app)
    .get('/api/reportes/membresias?desde=ayer')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(malformada.body.codigo, 'VALIDACION');
});

test('US-S4-02: recepcionista, entrenador y cliente reciben 403 (FR-001)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const respuesta = await request(app)
      .get('/api/reportes/membresias')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

test('US-S4-02: sin token responde 401', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app).get('/api/reportes/membresias').expect(401);
  assert.equal(respuesta.body.codigo, 'AUTH_REQUERIDA');
});
