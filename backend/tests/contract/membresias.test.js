// Pruebas de contrato de membresías (T017, US-S2-02; contracts/api-membresias.md).
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
let idTipoMensual = null;
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
      [`Prueba ${rol}`, `${rol}@membresias.test`, hash, rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  const [tipos] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  idTipoMensual = tipos[0].id_tipo_membresia;
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

// Crea un cliente de prueba limpio para cada escenario.
async function crearClientePrueba(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [resultado] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Cliente', 'Prueba', correo]
  );
  return resultado.insertId;
}

test('US-S2-02: el recepcionista asigna una membresía y recibe fechas calculadas (201)', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('asigna1@membresias.test');

  const respuesta = await request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_cliente: idCliente, id_tipo_membresia: idTipoMensual, fecha_inicio: '2026-10-15' })
    .expect(201);

  assert.equal(respuesta.body.membresia.estado, 'activo');
  assert.equal(respuesta.body.membresia.fecha_inicio, '2026-10-15');
  assert.equal(respuesta.body.membresia.fecha_fin, '2026-11-14', 'fin = inicio + 30 días');
  assert.equal(respuesta.body.membresia.tipo, 'Mensual');
});

test('US-S2-02: asignar a un cliente inexistente responde 404 (RN-01)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: 999999, id_tipo_membresia: idTipoMensual, fecha_inicio: '2026-10-15' })
    .expect(404);

  assert.ok(respuesta.body.mensaje.includes('Cliente'));
});

test('US-S2-02: asignar con un tipo inexistente responde 404 (RN-02)', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('asigna2@membresias.test');

  const respuesta = await request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_tipo_membresia: 999999, fecha_inicio: '2026-10-15' })
    .expect(404);

  assert.ok(respuesta.body.mensaje.includes('Tipo de membresía'));
});

test('US-S2-02: una segunda membresía activa se rechaza con 409 (esc. 5)', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('asigna3@membresias.test');

  await request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_tipo_membresia: idTipoMensual, fecha_inicio: '2026-10-15' })
    .expect(201);

  const segunda = await request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_tipo_membresia: idTipoMensual, fecha_inicio: '2026-11-01' })
    .expect(409);

  assert.equal(segunda.body.codigo, 'CONFLICTO_MEMBRESIA_ACTIVA');
});

test('US-S2-02: los roles entrenador y cliente reciben 403 (esc. 4)', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('asigna4@membresias.test');

  for (const rol of ['entrenador', 'cliente']) {
    await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ id_cliente: idCliente, id_tipo_membresia: idTipoMensual, fecha_inicio: '2026-10-15' })
      .expect(403);
  }
});

test('US-S2-02: una fecha de inicio inválida responde 400 (RN-03)', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('asigna5@membresias.test');

  const respuesta = await request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_tipo_membresia: idTipoMensual, fecha_inicio: '15/10/2026' })
    .expect(400);

  assert.ok(respuesta.body.mensaje.includes('fecha'));
});

// ---------------------------------------------------------------------------
// US-S2-03: renovación de membresía (T055)
// ---------------------------------------------------------------------------

// Crea un cliente con una membresía en el estado dado y devuelve su id.
async function crearMembresiaPrueba(correo, { estado = 'activo', fechaFin = null } = {}) {
  const idCliente = await crearClientePrueba(correo);
  const { obtenerPool } = await import('../../src/config/database.js');
  const [membresias] = await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, CURDATE(), COALESCE(?, DATE_ADD(CURDATE(), INTERVAL 30 DAY)), ?)`,
    [idCliente, idTipoMensual, fechaFin, estado]
  );
  return { idCliente, idMembresia: membresias.insertId };
}

test('US-S2-03: el recepcionista renueva una membresía activa y recibe la nueva fecha (200)', async (t) => {
  if (saltar(t)) return;
  const { idMembresia } = await crearMembresiaPrueba('renueva1@membresias.test');

  const respuesta = await request(app)
    .put(`/api/membresias/${idMembresia}/renovar`)
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_tipo_membresia: idTipoMensual })
    .expect(200);

  assert.ok(respuesta.body.membresia.fecha_fin, 'debe devolver la nueva fecha de fin');
  assert.equal(respuesta.body.membresia.estado, 'activo');
});

test('US-S2-03: una membresía suspendida o cancelada responde 409 MEMBRESIA_NO_RENOVABLE', async (t) => {
  if (saltar(t)) return;

  for (const estado of ['suspendida', 'cancelada']) {
    const { idMembresia } = await crearMembresiaPrueba(`renueva-${estado}@membresias.test`, {
      estado,
    });

    const respuesta = await request(app)
      .put(`/api/membresias/${idMembresia}/renovar`)
      .set('Authorization', `Bearer ${tokens.administrador}`)
      .send({ id_tipo_membresia: idTipoMensual })
      .expect(409);

    assert.equal(respuesta.body.codigo, 'MEMBRESIA_NO_RENOVABLE');
  }
});

test('US-S2-03: renovar una membresía inexistente responde 404', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .put('/api/membresias/999999/renovar')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_tipo_membresia: idTipoMensual })
    .expect(404);
});

test('US-S2-03: los roles entrenador y cliente reciben 403', async (t) => {
  if (saltar(t)) return;
  const { idMembresia } = await crearMembresiaPrueba('renueva4@membresias.test');

  for (const rol of ['entrenador', 'cliente']) {
    await request(app)
      .put(`/api/membresias/${idMembresia}/renovar`)
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ id_tipo_membresia: idTipoMensual })
      .expect(403);
  }
});
