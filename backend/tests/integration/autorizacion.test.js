// Pruebas de integración de autorización por rol (T022, US1/SC-004, FR-005).
// Verifican que las rutas reservadas al administrador rechazan con 403 a los
// demás roles y que el rol surte efecto según el token presentado.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  tokenDePrueba,
} from '../ayuda/base-pruebas.js';

let disponible = false;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
});

after(async () => {
  await finalizarPruebas();
});

async function crearUsuariosDePrueba(pool) {
  // Usuarios de prueba con roles no administradores (password arbitrario hasheado
  // no importa aquí: solo se usa el token, no el login).
  const bcrypt = await import('bcrypt');
  const hash = await bcrypt.default.hash('Prueba1234!', 10);
  const roles = ['recepcionista', 'entrenador', 'cliente'];
  const ids = {};
  for (const rol of roles) {
    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Prueba ${rol}`, `${rol}@prueba.test`, hash, rol]
    );
    ids[rol] = resultado.insertId;
  }
  return ids;
}

test('las rutas de gestión de usuarios rechazan con 403 a los roles no administradores', async (t) => {
  if (!disponible) {
    t.skip('MySQL no está disponible; pruebas de integración omitidas.');
    return;
  }

  const { obtenerPool } = await import('../../src/config/database.js');
  const ids = await crearUsuariosDePrueba(obtenerPool());

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const token = tokenDePrueba({ id_usuario: ids[rol], rol });

    const listado = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    assert.equal(listado.body.codigo, 'AUTORIZACION', `rol ${rol} debe recibir 403`);

    const alta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'X', correo: 'x@prueba.test', password: 'Prueba1234!', rol: 'cliente' })
      .expect(403);
    assert.equal(alta.body.codigo, 'AUTORIZACION', `rol ${rol} debe recibir 403 al crear`);
  }
});

test('una petición autenticada sin rol suficiente recibe 403 con envelope claro', async (t) => {
  if (!disponible) {
    t.skip('MySQL no está disponible; pruebas de integración omitidas.');
    return;
  }

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    "SELECT id_usuario FROM usuarios WHERE rol = 'entrenador' LIMIT 1"
  );
  const token = tokenDePrueba({ id_usuario: filas[0].id_usuario, rol: 'entrenador' });

  const respuesta = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'Ana', apellido: 'López', correo: 'ana@prueba.test' })
    .expect(403);

  assert.equal(respuesta.body.mensaje, 'No tienes permisos para esta operación');
  assert.equal(respuesta.body.codigo, 'AUTORIZACION');
});
