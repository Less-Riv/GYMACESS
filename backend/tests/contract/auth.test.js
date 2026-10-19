// Pruebas de contrato del inicio de sesión (T020, US1, contracts/api.md).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  SEMILLA,
} from '../ayuda/base-pruebas.js';

const disponible = await prepararBasePruebas();
const prueba = disponible ? test : test.skip;
const app = crearApp();

prueba('el login con credenciales válidas del semilla responde 200 con token y usuario', async () => {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password })
    .expect(200);

  assert.ok(respuesta.body.token, 'debe incluir un token JWT');
  assert.equal(respuesta.body.usuario.correo, SEMILLA.correo);
  assert.equal(respuesta.body.usuario.rol, 'administrador');
  assert.equal(respuesta.body.usuario.password, undefined, 'nunca expone el password');
});

prueba('el login con contraseña incorrecta responde 401 con mensaje genérico', async () => {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: 'contraseña_incorrecta' })
    .expect(401);

  assert.equal(respuesta.body.mensaje, 'Credenciales inválidas');
  assert.equal(respuesta.body.codigo, 'AUTH_CREDENCIALES');
});

prueba('el login con correo inexistente usa el MISMO mensaje genérico (sin revelar si la cuenta existe)', async () => {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo: 'no.existe@correo.test', password: 'cualquier_cosa' })
    .expect(401);

  assert.equal(respuesta.body.mensaje, 'Credenciales inválidas');
  assert.equal(respuesta.body.codigo, 'AUTH_CREDENCIALES');
});

prueba('el login con datos ausentes responde 400 de validación', async () => {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo: 'no-es-correo' })
    .expect(400);

  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

// El pool debe cerrarse en un hook `after`: en 'exit' no se puede esperar el
// cierre asíncrono y las conexiones abiertas impedirían que el proceso termine.
after(async () => {
  await finalizarPruebas();
});
