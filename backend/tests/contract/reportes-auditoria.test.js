// Pruebas de contrato de la auditoría de reportes (T046, US-S4-06;
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
      [`Contrato ${rol}`, `${rol}@auditoria-reportes.test`, 'x', rol]
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

test('US-S4-06: el administrador consulta la auditoría de reportes (200)', async (t) => {
  if (saltar(t)) return;

  // Se genera un reporte para que exista al menos un registro que consultar.
  await request(app)
    .get('/api/reportes/clientes')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const respuesta = await request(app)
    .get('/api/auditoria?modulo=reportes')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.ok(Array.isArray(respuesta.body.registros), 'la respuesta trae los registros');

  const registro = respuesta.body.registros.find(
    (item) => item.accion === 'generar_reporte'
  );
  assert.ok(registro, 'el registro de la generación está');
  assert.equal(registro.modulo, 'reportes');
  assert.equal(registro.resultado, 'exitoso');
  assert.ok(registro.descripcion, 'el registro lleva descripción');
  assert.match(registro.descripcion, /tipo=clientes/, 'la descripción identifica el tipo');
});

test('US-S4-06: recepcionista, entrenador y cliente reciben 403 (FR-025)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const respuesta = await request(app)
      .get('/api/auditoria?modulo=reportes')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

test('US-S4-06: sin token responde 401', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app).get('/api/auditoria?modulo=reportes').expect(401);
  assert.equal(respuesta.body.codigo, 'AUTH_REQUERIDA');
});
