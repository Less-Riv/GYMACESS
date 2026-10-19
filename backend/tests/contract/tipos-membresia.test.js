// Pruebas de contrato de tipos de membresía (T008, US-S2-01;
// contracts/api-membresias.md).
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

  // Usuarios de prueba de cada rol no administrador.
  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Prueba ${rol}`, `${rol}@tipos.test`, hash, rol]
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

test('US-S2-01: el administrador crea un tipo con nombre, duración y precio válidos (201)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/tipos-membresia')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ nombre: 'Semestral', descripcion: 'Seis meses', duracion: 180, precio: 6500 })
    .expect(201);

  assert.equal(respuesta.body.tipo.nombre, 'Semestral');
  assert.equal(respuesta.body.tipo.duracion, 180);
  assert.equal(respuesta.body.tipo.estado, 'activo');
  assert.ok(respuesta.body.tipo.id_tipo_membresia);
});

test('US-S2-01: crear un tipo sin nombre responde 400 con mensaje claro', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/tipos-membresia')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ nombre: '', duracion: 30, precio: 500 })
    .expect(400);

  assert.ok(respuesta.body.mensaje.includes('nombre'));
  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

test('US-S2-01: crear un tipo con duración cero responde 400', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/tipos-membresia')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ nombre: 'Inválido', duracion: 0, precio: 500 })
    .expect(400);

  assert.ok(respuesta.body.mensaje.includes('duración'));
});

test('US-S2-01: crear un tipo con precio negativo responde 400', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/tipos-membresia')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ nombre: 'Inválido', duracion: 30, precio: -10 })
    .expect(400);

  assert.ok(respuesta.body.mensaje.includes('precio'));
});

test('US-S2-01: los roles recepcionista, entrenador y cliente reciben 403', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    await request(app)
      .post('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ nombre: `No permitido ${rol}`, duracion: 30, precio: 500 })
      .expect(403);
  }
});

test('US-S2-01: el listado incluye los tipos de la semilla (Mensual y Trimestral)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/tipos-membresia')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const nombres = respuesta.body.tipos.map((tipo) => tipo.nombre);
  assert.ok(nombres.includes('Mensual'));
  assert.ok(nombres.includes('Trimestral'));
});

test('US-S2-01: consultar un tipo inexistente responde 404', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .get('/api/tipos-membresia/999999')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(404);
});

test('US-S2-01: sin token la operación responde 401', async (t) => {
  if (saltar(t)) return;

  await request(app).get('/api/tipos-membresia').expect(401);
});

test('US-S2-01: el recepcionista consulta los tipos activos, pero no puede crear ni modificar (200/403)', async (t) => {
  if (saltar(t)) return;

  // Lectura permitida (SC-001: necesita los tipos para asignar membresías).
  const listado = await request(app)
    .get('/api/tipos-membresia')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .expect(200);
  assert.ok(Array.isArray(listado.body.tipos));

  // Escritura sigue reservada al administrador.
  await request(app)
    .post('/api/tipos-membresia')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ nombre: 'No permitido', duracion: 30, precio: 500 })
    .expect(403);
  await request(app)
    .put(`/api/tipos-membresia/${listado.body.tipos[0]?.id_tipo_membresia ?? 1}`)
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ precio: 999 })
    .expect(403);
});

test('US-S2-01: el recepcionista no ve los tipos inactivos (solo activos)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [creado] = await obtenerPool().query(
    "INSERT INTO tipos_membresia (nombre, duracion, precio, estado) VALUES ('Inactivo', 30, 100, 'inactivo')"
  );

  const listado = await request(app)
    .get('/api/tipos-membresia')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .expect(200);

  const ids = listado.body.tipos.map((tipo) => tipo.id_tipo_membresia);
  assert.ok(!ids.includes(creado.insertId), 'el recepcionista no debe ver tipos inactivos');

  // El administrador sí los ve (gestión del catálogo).
  const admin = await request(app)
    .get('/api/tipos-membresia')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  const idsAdmin = admin.body.tipos.map((tipo) => tipo.id_tipo_membresia);
  assert.ok(idsAdmin.includes(creado.insertId), 'el administrador ve los tipos inactivos');
});
