// Pruebas de contrato de gestión de usuarios (T036, US3; contracts/api.md).
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
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Prueba ${rol}`, `${rol}@usuarios.test`, hash, rol]
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

test('US3: el administrador registra un usuario con rol válido (201)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({
      nombre: 'Recepcionista Nuevo',
      correo: 'nuevo-recep@usuarios.test',
      password: 'Recep1234!',
      rol: 'recepcionista',
    })
    .expect(201);

  assert.equal(respuesta.body.usuario.correo, 'nuevo-recep@usuarios.test');
  assert.equal(respuesta.body.usuario.rol, 'recepcionista');
  assert.equal(respuesta.body.usuario.password, undefined, 'nunca expone el password');
});

test('US3: un rol fuera del ENUM responde 400', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({
      nombre: 'Rol Inválido',
      correo: 'rol-invalido@usuarios.test',
      password: 'Prueba1234!',
      rol: 'superusuario',
    })
    .expect(400);

  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

test('US3: una contraseña corta responde 400 (longitud mínima 8)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({
      nombre: 'Contraseña Corta',
      correo: 'corta@usuarios.test',
      password: 'corta',
      rol: 'recepcionista',
    })
    .expect(400);

  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

test('US3: el correo duplicado responde 409', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({
      nombre: 'Duplicado',
      correo: 'nuevo-recep@usuarios.test',
      password: 'Recep1234!',
      rol: 'recepcionista',
    })
    .expect(409);

  assert.equal(respuesta.body.codigo, 'CONFLICTO_CORREO');
});

test('US3/SC-004: los roles no administradores reciben 403 en la gestión de usuarios', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ nombre: 'X', correo: `x-${rol}@usuarios.test`, password: 'Prueba1234!', rol: 'cliente' })
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION', `rol ${rol} debe recibir 403`);
  }
});

test('US3: el listado de usuarios es exclusivo del administrador', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.ok(Array.isArray(respuesta.body.usuarios));
  assert.ok(respuesta.body.usuarios.length > 0);
  assert.ok(
    respuesta.body.usuarios.every((u) => u.password === undefined),
    'el listado nunca expone contraseñas'
  );
});
