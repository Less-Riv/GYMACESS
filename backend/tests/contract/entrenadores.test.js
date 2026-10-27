// Pruebas de contrato de entrenadores (T006, US1; contracts/api-entrenadores-asignaciones.md).
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
let idCuentaEntrenador = null;
let idEntrenadorCreado = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);

  // Cuenta con rol entrenador para dar de alta la ficha.
  const [cuenta] = await obtenerPool().query(
    "INSERT INTO usuarios (nombre, correo, password, rol) VALUES ('Cuenta Entrenador', 'cuenta-ent@entrenadores.test', ?, 'entrenador')",
    [hash]
  );
  idCuentaEntrenador = cuenta.insertId;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Contrato ${rol}`, `${rol}@entrenadores.test`, hash, rol]
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

// ---------------------------------------------------------------------------
// US-S3-01: registro de entrenadores (POST /api/entrenadores)
// ---------------------------------------------------------------------------

test('US-S3-01: el administrador registra un entrenador con cuenta válida (201)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({
      id_usuario: idCuentaEntrenador,
      nombre: 'Ana López',
      telefono: '5512345678',
      correo_contacto: 'ana@gimnasio.test',
    })
    .expect(201);

  assert.equal(respuesta.body.entrenador.nombre, 'Ana López');
  assert.equal(respuesta.body.entrenador.estado, 'activo');
  assert.ok(respuesta.body.entrenador.id_entrenador);
  idEntrenadorCreado = respuesta.body.entrenador.id_entrenador;
});

test('US-S3-01: campos obligatorios ausentes responden 400 VALIDACION', async (t) => {
  if (saltar(t)) return;

  for (const cuerpo of [{ nombre: 'Sin Cuenta' }, { id_usuario: idCuentaEntrenador }]) {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokens.administrador}`)
      .send(cuerpo)
      .expect(400);
    assert.equal(respuesta.body.codigo, 'VALIDACION');
  }
});

test('US-S3-01: una cuenta inexistente, inactiva o con otro rol responde 400 USUARIO_INVALIDO', async (t) => {
  if (saltar(t)) return;

  // Cuenta inexistente.
  let respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: 999999, nombre: 'Fantasma' })
    .expect(400);
  assert.equal(respuesta.body.codigo, 'USUARIO_INVALIDO');

  // Cuenta existente con rol cliente (la crea el hook before con este correo).
  const { obtenerPool } = await import('../../src/config/database.js');
  const [cuentas] = await obtenerPool().query(
    "SELECT id_usuario FROM usuarios WHERE correo = 'cliente@entrenadores.test'"
  );
  assert.equal(
    cuentas.length,
    1,
    'la cuenta con rol cliente debe existir: la crea el hook before'
  );
  respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: cuentas[0].id_usuario, nombre: 'Rol Equivocado' })
    .expect(400);
  assert.equal(respuesta.body.codigo, 'USUARIO_INVALIDO');

  // Cuenta existente pero desactivada.
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [inactiva] = await obtenerPool().query(
    "INSERT INTO usuarios (nombre, correo, password, rol, estado) VALUES ('Inactiva', 'inactiva@entrenadores.test', ?, 'entrenador', 'inactivo')",
    [hash]
  );
  respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: inactiva.insertId, nombre: 'Cuenta Inactiva' })
    .expect(400);
  assert.equal(respuesta.body.codigo, 'USUARIO_INVALIDO');
});

test('US-S3-01: una cuenta ya asociada responde 409 USUARIO_YA_ASOCIADO (RN-15)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: idCuentaEntrenador, nombre: 'Duplicado' })
    .expect(409);

  assert.equal(respuesta.body.codigo, 'USUARIO_YA_ASOCIADO');
});

test('US-S3-01: el recepcionista, el entrenador y el cliente reciben 403', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const respuesta = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ id_usuario: idCuentaEntrenador, nombre: `Intento ${rol}` })
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

// ---------------------------------------------------------------------------
// US-S3-01: consulta del listado (GET /api/entrenadores)
// ---------------------------------------------------------------------------

test('US-S3-01: el administrador y el recepcionista consultan el listado (200)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['administrador', 'recepcionista']) {
    const respuesta = await request(app)
      .get('/api/entrenadores')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(200);

    assert.ok(Array.isArray(respuesta.body.entrenadores));
    assert.ok(
      respuesta.body.entrenadores.some((e) => e.id_entrenador === idEntrenadorCreado),
      'el entrenador registrado debe aparecer en el listado'
    );
    assert.ok(
      typeof respuesta.body.entrenadores[0].clientes_asignados === 'number',
      'cada entrenador incluye su carga de clientes'
    );
  }
});

test('US-S3-01: el entrenador y el cliente reciben 403 al consultar el listado', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['entrenador', 'cliente']) {
    const respuesta = await request(app)
      .get('/api/entrenadores')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

// ---------------------------------------------------------------------------
// US-S3-01: modificación (PUT /api/entrenadores/:id)
// ---------------------------------------------------------------------------

test('US-S3-01: el administrador modifica los datos del entrenador (200)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .put(`/api/entrenadores/${idEntrenadorCreado}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ nombre: 'Ana López Martínez', telefono: '5599998888' })
    .expect(200);

  assert.equal(respuesta.body.entrenador.nombre, 'Ana López Martínez');
  assert.equal(respuesta.body.entrenador.telefono, '5599998888');
});

test('US-S3-01: un estado fuera del ENUM responde 400 VALIDACION', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .put(`/api/entrenadores/${idEntrenadorCreado}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ estado: 'suspendido' })
    .expect(400);
  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

test('US-S3-01: un id inexistente responde 404 NO_ENCONTRADO', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .put('/api/entrenadores/999999')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ nombre: 'Nadie' })
    .expect(404);
  assert.equal(respuesta.body.codigo, 'NO_ENCONTRADO');
});

test('US-S3-01: el recepcionista y el entrenador reciben 403 al modificar', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador']) {
    await request(app)
      .put(`/api/entrenadores/${idEntrenadorCreado}`)
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ nombre: `Intento ${rol}` })
      .expect(403);
  }
});
