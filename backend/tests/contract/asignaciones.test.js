// Pruebas de contrato de asignaciones (T015, US2; contracts/api-entrenadores-asignaciones.md).
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
let ids = {};
const app = crearApp();

async function crearCuenta(correo, rol) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [resultado] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    [`Cuenta ${rol}`, correo, hash, rol]
  );
  return resultado.insertId;
}

async function crearFichaEntrenador(correo, nombre) {
  const idUsuario = await crearCuenta(correo, 'entrenador');
  const respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: idUsuario, nombre });
  return respuesta.body.entrenador.id_entrenador;
}

async function crearCliente(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [resultado] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Contrato', 'Asignación', correo]
  );
  return resultado.insertId;
}

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Contrato ${rol}`, `${rol}@asignaciones.test`, 'x', rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  ids.entrenador1 = await crearFichaEntrenador('ent1@asignaciones.test', 'Entrenador Uno');
  ids.entrenador2 = await crearFichaEntrenador('ent2@asignaciones.test', 'Entrenador Dos');
  ids.cliente1 = await crearCliente('cliente1@asignaciones.test');
  ids.cliente2 = await crearCliente('cliente2@asignaciones.test');
  ids.clienteInactivo = await crearCliente('cliente-inactivo@asignaciones.test');
  await obtenerPool().query("UPDATE clientes SET estado = 'inactivo' WHERE id_cliente = ?", [
    ids.clienteInactivo,
  ]);
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
// US-S3-02: alta de asignación (POST /api/asignaciones)
// ---------------------------------------------------------------------------

test('US-S3-02: el recepcionista asigna un entrenador a un cliente activo (201)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_cliente: ids.cliente1, id_entrenador: ids.entrenador1 })
    .expect(201);

  assert.equal(respuesta.body.asignacion.estado, 'activa');
  assert.equal(respuesta.body.asignacion.id_cliente, ids.cliente1);
  assert.equal(respuesta.body.asignacion.id_entrenador, ids.entrenador1);
  assert.ok(respuesta.body.asignacion.fecha_asignacion);
});

test('US-S3-02: una segunda asignación activa para el mismo cliente responde 409 (RN-16)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: ids.cliente1, id_entrenador: ids.entrenador2 })
    .expect(409);

  assert.equal(respuesta.body.codigo, 'ASIGNACION_ACTIVA_EXISTENTE');
});

test('US-S3-02: cliente o entrenador inexistente responde 400 VALIDACION', async (t) => {
  if (saltar(t)) return;

  let respuesta = await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_cliente: 999999, id_entrenador: ids.entrenador1 })
    .expect(400);
  assert.equal(respuesta.body.codigo, 'VALIDACION');

  respuesta = await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_cliente: ids.cliente2, id_entrenador: 999999 })
    .expect(400);
  assert.equal(respuesta.body.codigo, 'VALIDACION');
});

test('US-S3-02: cliente inactivo responde 400 CLIENTE_INACTIVO', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_cliente: ids.clienteInactivo, id_entrenador: ids.entrenador1 })
    .expect(400);

  assert.equal(respuesta.body.codigo, 'CLIENTE_INACTIVO');
});

test('US-S3-02: entrenador inactivo responde 400 ENTRENADOR_INACTIVO', async (t) => {
  if (saltar(t)) return;

  const idInactivo = await crearFichaEntrenador('ent-inactivo@asignaciones.test', 'Baja');
  await request(app)
    .put(`/api/entrenadores/${idInactivo}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ estado: 'inactivo' })
    .expect(200);

  const respuesta = await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_cliente: ids.cliente2, id_entrenador: idInactivo })
    .expect(400);

  assert.equal(respuesta.body.codigo, 'ENTRENADOR_INACTIVO');
});

test('US-S3-02: el entrenador y el cliente reciben 403 al asignar', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['entrenador', 'cliente']) {
    const respuesta = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ id_cliente: ids.cliente2, id_entrenador: ids.entrenador1 })
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

// ---------------------------------------------------------------------------
// US-S3-02: reasignación (PUT /api/asignaciones/:id)
// ---------------------------------------------------------------------------

test('US-S3-02: la reasignación cierra la anterior con fecha y crea la nueva (200)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [activas] = await obtenerPool().query(
    'SELECT id_asignacion FROM asignaciones_entrenador WHERE id_cliente = ? AND estado = ?',
    [ids.cliente1, 'activa']
  );

  const respuesta = await request(app)
    .put(`/api/asignaciones/${activas[0].id_asignacion}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_entrenador: ids.entrenador2 })
    .expect(200);

  assert.equal(respuesta.body.asignacion.id_entrenador, ids.entrenador2);
  assert.equal(respuesta.body.asignacion.estado, 'activa');

  // La anterior queda cerrada con su fecha_fin (RN-17: histórico conservado).
  const [cerrada] = await obtenerPool().query(
    'SELECT * FROM asignaciones_entrenador WHERE id_asignacion = ?',
    [activas[0].id_asignacion]
  );
  assert.equal(cerrada[0].estado, 'cerrada');
  assert.ok(cerrada[0].fecha_fin, 'la asignación cerrada conserva su fecha de fin');
});

test('US-S3-02: una asignación ya cerrada responde 404 en la reasignación', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [cerradas] = await obtenerPool().query(
    "SELECT id_asignacion FROM asignaciones_entrenador WHERE estado = 'cerrada' LIMIT 1"
  );

  await request(app)
    .put(`/api/asignaciones/${cerradas[0].id_asignacion}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_entrenador: ids.entrenador1 })
    .expect(404);
});

// ---------------------------------------------------------------------------
// US-S3-02: consulta (GET /api/asignaciones)
// ---------------------------------------------------------------------------

test('US-S3-02: el entrenador solo recibe las asignaciones de su carga (RN-19)', async (t) => {
  if (saltar(t)) return;

  // Ficha del entrenador 2 para emitir su token.
  const { obtenerPool } = await import('../../src/config/database.js');
  const [fichas] = await obtenerPool().query(
    'SELECT id_usuario FROM entrenadores WHERE id_entrenador = ?',
    [ids.entrenador2]
  );
  const tokenEntrenador2 = tokenDePrueba({
    id_usuario: fichas[0].id_usuario,
    rol: 'entrenador',
  });

  const respuesta = await request(app)
    .get('/api/asignaciones')
    .set('Authorization', `Bearer ${tokenEntrenador2}`)
    .expect(200);

  assert.ok(respuesta.body.asignaciones.length > 0);
  for (const asignacion of respuesta.body.asignaciones) {
    assert.equal(
      asignacion.id_entrenador,
      ids.entrenador2,
      'el entrenador no debe ver asignaciones ajenas'
    );
  }
});

test('US-S3-02: el cliente recibe 403 al consultar asignaciones', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .get('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.cliente}`)
    .expect(403);
});
