// Pruebas de contrato de los reportes de pagos y de adeudos (T026,
// US-S4-03; contracts/api-reportes.md).
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
      [`Contrato ${rol}`, `${rol}@pagos.test`, 'x', rol]
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

test('US-S4-03: el administrador recibe el reporte de pagos con sus totales (200)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/pagos?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.equal(respuesta.body.tipo, 'pagos');
  assert.ok(Array.isArray(respuesta.body.filas));
  assert.equal(typeof respuesta.body.totales.total_pagos, 'number');
  assert.match(
    respuesta.body.totales.total_ingresos,
    /^\d+\.\d{2}$/,
    'el total de ingresos es un importe con dos decimales'
  );
  assert.equal(respuesta.body.paginacion.limite, 20);

  if (respuesta.body.filas.length > 0) {
    const fila = respuesta.body.filas[0];
    for (const campo of ['id_pago', 'id_cliente', 'nombre_completo', 'monto', 'fecha_pago', 'estado']) {
      assert.ok(fila[campo] !== undefined, `falta la columna ${campo}`);
    }
  }
});

test('US-S4-03: el administrador recibe el reporte de adeudos con sus totales (200)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/adeudos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.equal(respuesta.body.tipo, 'adeudos');
  assert.ok(Array.isArray(respuesta.body.filas));
  assert.equal(typeof respuesta.body.totales.total_clientes_con_adeudo, 'number');
  assert.match(
    respuesta.body.totales.total_adeudo,
    /^\d+\.\d{2}$/,
    'el total de adeudo es un importe con dos decimales'
  );

  if (respuesta.body.filas.length > 0) {
    const fila = respuesta.body.filas[0];
    for (const campo of [
      'id_cliente',
      'nombre_completo',
      'precio_membresia',
      'total_pagado',
      'saldo_pendiente',
      'estado_membresia',
    ]) {
      assert.ok(fila[campo] !== undefined, `falta la columna ${campo}`);
    }
  }
});

test('US-S4-03: los reportes de pagos y adeudos no admiten filtro por estado (FR-013)', async (t) => {
  if (saltar(t)) return;

  for (const tipo of ['pagos', 'adeudos']) {
    const respuesta = await request(app)
      .get(`/api/reportes/${tipo}?estado=completado`)
      .set('Authorization', `Bearer ${tokens.administrador}`)
      .expect(400);
    assert.equal(respuesta.body.codigo, 'VALIDACION');
  }
});

test('US-S4-03: un periodo invertido o mal formado responde 400 VALIDACION (FR-016)', async (t) => {
  if (saltar(t)) return;

  const invertida = await request(app)
    .get('/api/reportes/pagos?desde=2026-12-31&hasta=2026-01-01')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(invertida.body.codigo, 'VALIDACION');

  const malformada = await request(app)
    .get('/api/reportes/pagos?desde=31-12-2026')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(malformada.body.codigo, 'VALIDACION');
});

test('US-S4-03: recepcionista, entrenador y cliente reciben 403 (FR-001)', async (t) => {
  if (saltar(t)) return;

  for (const tipo of ['pagos', 'adeudos']) {
    for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
      const respuesta = await request(app)
        .get(`/api/reportes/${tipo}`)
        .set('Authorization', `Bearer ${tokens[rol]}`)
        .expect(403);
      assert.equal(respuesta.body.codigo, 'AUTORIZACION');
    }
  }
});

test('US-S4-03: sin token responde 401', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app).get('/api/reportes/pagos').expect(401);
  assert.equal(respuesta.body.codigo, 'AUTH_REQUERIDA');
});
