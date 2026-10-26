// Pruebas de contrato del dashboard (T048, US6; contracts/api-dashboard.md).
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
      [`Contrato ${rol}`, `${rol}@dashboard.test`, 'x', rol]
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

// Secciones que exige el contrato (doce indicadores en total).
const SECCIONES = [
  'periodo',
  'clientes',
  'membresias',
  'accesos',
  'entrenadores',
  'asignaciones',
  'rutinas',
  'objetivos',
  'progresos',
];

test('US-S3-06: el administrador recibe las nueve secciones del contrato (200)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/dashboard')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  for (const seccion of SECCIONES) {
    assert.ok(respuesta.body[seccion] !== undefined, `falta la sección ${seccion}`);
  }

  // Periodo por defecto: primer día del mes anterior → hoy (investigación §4).
  const hoy = new Date().toISOString().slice(0, 10);
  assert.equal(respuesta.body.periodo.hasta, hoy);
  assert.ok(respuesta.body.periodo.desde <= hoy, 'el periodo por defecto llega hasta hoy');
  assert.match(respuesta.body.periodo.desde, /^\d{4}-\d{2}-\d{2}$/);

  // Doce indicadores con su valor.
  assert.equal(typeof respuesta.body.clientes.activos, 'number');
  assert.equal(typeof respuesta.body.membresias.vigentes, 'number');
  assert.equal(typeof respuesta.body.membresias.vencidas, 'number');
  assert.equal(typeof respuesta.body.accesos.recientes, 'number');
  assert.equal(typeof respuesta.body.accesos.rechazados, 'number');
  assert.equal(typeof respuesta.body.entrenadores.registrados, 'number');
  assert.equal(typeof respuesta.body.entrenadores.activos, 'number');
  assert.equal(typeof respuesta.body.asignaciones.con_entrenador, 'number');
  assert.equal(typeof respuesta.body.asignaciones.sin_entrenador, 'number');
  assert.equal(typeof respuesta.body.rutinas.activas, 'number');
  assert.equal(typeof respuesta.body.objetivos.cumplidos, 'number');
  assert.equal(typeof respuesta.body.objetivos.pendientes, 'number');
  assert.equal(typeof respuesta.body.progresos.registrados, 'number');
  assert.match(respuesta.body.objetivos.porcentaje_cumplidos, /^\d+\.\d$/);
});

test('US-S3-06: el filtro de periodo acepta fechas ISO y rechaza desde > hasta (400)', async (t) => {
  if (saltar(t)) return;

  const valida = await request(app)
    .get('/api/dashboard?desde=2026-01-01&hasta=2026-12-31')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.equal(valida.body.periodo.desde, '2026-01-01');
  assert.equal(valida.body.periodo.hasta, '2026-12-31');

  const invertida = await request(app)
    .get('/api/dashboard?desde=2026-12-31&hasta=2026-01-01')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(invertida.body.codigo, 'VALIDACION');

  const malformada = await request(app)
    .get('/api/dashboard?desde=31-12-2026')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(malformada.body.codigo, 'VALIDACION');
});

test('US-S3-06: recepcionista, entrenador y cliente reciben 403 (FR-015)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const respuesta = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

test('US-S3-06: sin token responde 401', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app).get('/api/dashboard').expect(401);
  assert.equal(respuesta.body.codigo, 'AUTH_REQUERIDA');
});
