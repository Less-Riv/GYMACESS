// Pruebas de integración de la autenticación (T021, US1, FR-024).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { crearApp } from '../../src/app.js';
import { entorno } from '../../src/config/entorno.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  tokenDePrueba,
  SEMILLA,
} from '../ayuda/base-pruebas.js';

let disponible = false;
const prueba = test;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
});

after(async () => {
  await finalizarPruebas();
});

function omitirSiNoHayMySQL(t) {
  if (!disponible) {
    t.skip('MySQL no está disponible; pruebas de integración omitidas.');
    return true;
  }
  return false;
}

prueba('el token emitido permite acceder a una ruta protegida', async (t) => {
  if (omitirSiNoHayMySQL(t)) return;

  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password })
    .expect(200);

  const respuesta = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${login.body.token}`)
    .expect(200);

  assert.ok(Array.isArray(respuesta.body.usuarios));
});

prueba('una ruta protegida sin token responde 401', async (t) => {
  if (omitirSiNoHayMySQL(t)) return;

  const respuesta = await request(app).get('/api/usuarios').expect(401);
  assert.equal(respuesta.body.codigo, 'AUTH_REQUERIDA');
});

prueba('un token manipulado responde 401', async (t) => {
  if (omitirSiNoHayMySQL(t)) return;

  const respuesta = await request(app)
    .get('/api/usuarios')
    .set('Authorization', 'Bearer token-manipulado')
    .expect(401);

  assert.equal(respuesta.body.codigo, 'AUTH_TOKEN');
});

prueba('el JWT expira a las 8 horas (FR-024)', async (t) => {
  if (omitirSiNoHayMySQL(t)) return;

  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password })
    .expect(200);

  const payload = jwt.verify(login.body.token, entorno.JWT_SECRET);
  const horas = (payload.exp - payload.iat) / 3600;
  assert.ok(Math.abs(horas - 8) < 0.01, `la expiración debe ser 8 horas, fue ${horas}`);
});

prueba('un token expirado responde 401', async (t) => {
  if (omitirSiNoHayMySQL(t)) return;

  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password })
    .expect(200);

  const expirado = jwt.sign(
    { id_usuario: 1, rol: 'administrador' },
    entorno.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: -10 }
  );

  const respuesta = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${expirado}`)
    .expect(401);

  assert.equal(respuesta.body.codigo, 'AUTH_TOKEN');
  assert.notEqual(expirado, login.body.token);
});

prueba('un token firmado con otro secreto responde 401', async (t) => {
  if (omitirSiNoHayMySQL(t)) return;

  const ajeno = jwt.sign({ id_usuario: 1, rol: 'administrador' }, 'otro-secreto', {
    algorithm: 'HS256',
  });

  const respuesta = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${ajeno}`)
    .expect(401);

  assert.equal(respuesta.body.codigo, 'AUTH_TOKEN');
});

prueba('tokenDePrueba genera tokens con el mismo formato del backend (ayuda de pruebas)', () => {
  const token = tokenDePrueba({ id_usuario: 99, rol: 'cliente' });
  const payload = jwt.verify(token, entorno.JWT_SECRET);
  assert.equal(payload.id_usuario, 99);
  assert.equal(payload.rol, 'cliente');
});
