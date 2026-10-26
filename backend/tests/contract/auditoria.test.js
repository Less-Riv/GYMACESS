// Pruebas de contrato de la auditoría (T063, verificación del Sprint 3 sobre
// el contrato del Sprint 2; FR-020, SC-013).
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
      [`Contrato ${rol}`, `${rol}@auditoria.test`, 'x', rol]
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

test('SC-013: el administrador consulta la auditoría con sus campos (200)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/auditoria')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.ok(Array.isArray(respuesta.body.registros));
  if (respuesta.body.registros.length > 0) {
    const registro = respuesta.body.registros[0];
    for (const campo of ['id_auditoria', 'usuario', 'accion', 'modulo', 'fecha', 'resultado']) {
      assert.ok(registro[campo] !== undefined, `falta el campo ${campo}`);
    }
  }
});

test('SC-013: los seis módulos del Sprint 3 son consultables (FR-020)', async (t) => {
  if (saltar(t)) return;

  // Los filtros aceptan los módulos nuevos del sprint.
  for (const modulo of ['asignaciones', 'rutinas', 'objetivos', 'progresos']) {
    const respuesta = await request(app)
      .get(`/api/auditoria?modulo=${modulo}`)
      .set('Authorization', `Bearer ${tokens.administrador}`)
      .expect(200);
    assert.ok(Array.isArray(respuesta.body.registros), `filtro por módulo ${modulo}`);
  }
});

test('SC-013: los no administradores reciben 403 en la consulta (FR-020)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const respuesta = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

test('SC-013: la fecha con formato inválido responde 400 VALIDACION', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/auditoria?fecha=ayer')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(400);
  assert.equal(respuesta.body.codigo, 'VALIDACION');
});
