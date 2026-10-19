// Pruebas de contrato de clientes (T029 US2, T047 US5, T053 US6; contracts/api.md).
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

  // Usuarios de prueba de cada rol (el entrenador y el cliente sin cliente_id
  // asociado; los de lista se asocian después en las pruebas que lo necesiten).
  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Prueba ${rol}`, `${rol}@clientes.test`, hash, rol]
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
// US2: registro de clientes (POST /api/clientes)
// ---------------------------------------------------------------------------

test('US2: el recepcionista registra un cliente con datos válidos (201)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ nombre: 'María', apellido: 'López', correo: 'maria@clientes.test' })
    .expect(201);

  assert.equal(respuesta.body.cliente.nombre, 'María');
  assert.equal(respuesta.body.cliente.apellido, 'López');
  assert.equal(respuesta.body.cliente.estado, 'activo');
  assert.ok(respuesta.body.cliente.id_cliente);
});

test('US2: el administrador también puede registrar clientes', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ nombre: 'Pedro', apellido: 'Gómez', correo: 'pedro@clientes.test' })
    .expect(201);
});

test('US2: un correo con formato incorrecto responde 400 sin crear el registro', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ nombre: 'Ana', apellido: 'Ruiz', correo: 'no-es-un-correo' })
    .expect(400);

  assert.equal(respuesta.body.codigo, 'VALIDACION');

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT COUNT(*) AS total FROM clientes WHERE correo = ?',
    ['no-es-un-correo']
  );
  assert.equal(filas[0].total, 0, 'no debe crear el registro');
});

test('US2: campos obligatorios vacíos (nombre, apellido, correo) responden 400', async (t) => {
  if (saltar(t)) return;

  for (const campos of [
    { apellido: 'Sin Nombre', correo: 'sin-nombre@clientes.test' },
    { nombre: 'Sin', correo: 'sin-apellido@clientes.test' },
    { nombre: 'Sin', apellido: 'Correo' },
  ]) {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokens.recepcionista}`)
      .send(campos)
      .expect(400);
    assert.equal(respuesta.body.codigo, 'VALIDACION');
  }
});

test('US2: el correo duplicado responde 409 (CONFLICTO_CORREO)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ nombre: 'María', apellido: 'Duplicada', correo: 'maria@clientes.test' })
    .expect(409);

  assert.equal(respuesta.body.codigo, 'CONFLICTO_CORREO');
});

test('US2: el entrenador y el cliente reciben 403 al registrar clientes', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['entrenador', 'cliente']) {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ nombre: 'X', apellido: 'Y', correo: `x-${rol}@clientes.test` })
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

// ---------------------------------------------------------------------------
// US5: consulta de clientes (GET /api/clientes) — T047
// ---------------------------------------------------------------------------

test('US5: el listado responde paginación con límite 20 (FR-027)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/clientes')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.ok(Array.isArray(respuesta.body.clientes));
  assert.equal(respuesta.body.limite, 20);
  assert.equal(respuesta.body.pagina, 1);
  assert.ok(typeof respuesta.body.total === 'number');
  assert.ok(typeof respuesta.body.totalPaginas === 'number');
});

test('US5: el entrenador recibe SOLO nombre, apellido, teléfono y estado (FR-025)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/clientes')
    .set('Authorization', `Bearer ${tokens.entrenador}`)
    .expect(200);

  assert.ok(respuesta.body.clientes.length > 0, 'debe haber clientes de prueba');
  for (const cliente of respuesta.body.clientes) {
    assert.deepEqual(
      Object.keys(cliente).sort(),
      ['apellido', 'estado', 'nombre', 'telefono'],
      'el entrenador no debe ver correo, dirección ni otros campos'
    );
  }
});

test('US5: el rol cliente recibe 403 al listar clientes', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/clientes')
    .set('Authorization', `Bearer ${tokens.cliente}`)
    .expect(403);
  assert.equal(respuesta.body.codigo, 'AUTORIZACION');
});

// ---------------------------------------------------------------------------
// US6: modificación de clientes (PATCH /api/clientes/:id) — T053
// ---------------------------------------------------------------------------

test('US6: el recepcionista modifica el teléfono de un cliente (200)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT id_cliente FROM clientes WHERE correo = ?',
    ['maria@clientes.test']
  );

  const respuesta = await request(app)
    .patch(`/api/clientes/${filas[0].id_cliente}`)
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ telefono: '5512345678' })
    .expect(200);

  assert.equal(respuesta.body.cliente.telefono, '5512345678');
});

test('US6: datos inválidos responden 400 y los datos originales se conservan', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT id_cliente FROM clientes WHERE correo = ?',
    ['maria@clientes.test']
  );

  await request(app)
    .patch(`/api/clientes/${filas[0].id_cliente}`)
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ correo: 'correo-invalido' })
    .expect(400);

  const [despues] = await obtenerPool().query(
    'SELECT correo, telefono FROM clientes WHERE id_cliente = ?',
    [filas[0].id_cliente]
  );
  assert.equal(despues[0].correo, 'maria@clientes.test', 'el correo original se conserva');
  assert.equal(despues[0].telefono, '5512345678', 'el teléfono modificado se conserva');
});

test('US6: el entrenador y el cliente reciben 403 al modificar clientes', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query('SELECT id_cliente FROM clientes LIMIT 1');

  for (const rol of ['entrenador', 'cliente']) {
    await request(app)
      .patch(`/api/clientes/${filas[0].id_cliente}`)
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ telefono: '0000000000' })
      .expect(403);
  }
});

test('US6: un id inexistente responde 404', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .patch('/api/clientes/999999')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ telefono: '5500000000' })
    .expect(404);
});
