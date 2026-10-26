// Pruebas de contrato de "Mi entrenamiento" (T042, US5;
// contracts/api-rutinas-progreso.md).
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

async function crearFicha(correo, nombre) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [cuenta] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Contrato entrenador', correo, hash, 'entrenador']
  );
  const respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: cuenta.insertId, nombre });
  return { idEntrenador: respuesta.body.entrenador.id_entrenador, idUsuario: cuenta.insertId };
}

// Crea cliente y su cuenta con rol cliente vinculada (usuarios.cliente_id).
async function crearClienteConCuenta(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [cliente] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Contrato', 'Cliente', correo]
  );
  const [cuenta] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol, cliente_id) VALUES (?, ?, ?, ?, ?)',
    [`Cliente ${correo}`, correo, hash, 'cliente', cliente.insertId]
  );
  return { idCliente: cliente.insertId, idUsuario: cuenta.insertId };
}

async function asignar(idCliente, idEntrenador) {
  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_entrenador: idEntrenador })
    .expect(201);
}

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Contrato ${rol}`, `${rol}@mi-entrenamiento.test`, 'x', rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  const ana = await crearFicha('ana@mi-entrenamiento.test', 'Ana López');
  ids.entrenador = ana;

  const conDatos = await crearClienteConCuenta('cliente-datos@mi-entrenamiento.test');
  const sinDatos = await crearClienteConCuenta('cliente-vacio@mi-entrenamiento.test');
  ids.clienteConDatos = conDatos;
  ids.clienteSinDatos = sinDatos;
  tokens.clienteConDatos = tokenDePrueba({ id_usuario: conDatos.idUsuario, rol: 'cliente' });
  tokens.clienteSinDatos = tokenDePrueba({ id_usuario: sinDatos.idUsuario, rol: 'cliente' });

  // Prepara datos: asignación, rutina, objetivo y progreso.
  const tokenAna = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });
  await asignar(conDatos.idCliente, ana.idEntrenador);
  await asignar(sinDatos.idCliente, ana.idEntrenador);

  await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({
      id_cliente: conDatos.idCliente,
      nombre: 'Full body inicial',
      ejercicios: [{ nombre: 'Sentadilla', series: 3, repeticiones: '10-12' }],
    })
    .expect(201);

  const objetivo = await request(app)
    .post('/api/objetivos')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({ id_cliente: conDatos.idCliente, descripcion: 'Reducir cintura' })
    .expect(201);

  await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({
      id_cliente: conDatos.idCliente,
      fecha: '2026-10-01',
      comentario: 'Primera medición',
      peso: 82.5,
      id_objetivo: objetivo.body.objetivo.id_objetivo,
    })
    .expect(201);
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

test('US-S3-05: el cliente recibe SU entrenador, rutina, objetivos y progresos (200)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/mi-entrenamiento')
    .set('Authorization', `Bearer ${tokens.clienteConDatos}`)
    .expect(200);

  assert.equal(respuesta.body.entrenador.nombre, 'Ana López');
  assert.equal(respuesta.body.rutina_activa.nombre, 'Full body inicial');
  assert.equal(respuesta.body.rutina_activa.ejercicios.length, 1);
  assert.equal(respuesta.body.rutina_activa.ejercicios[0].nombre, 'Sentadilla');
  assert.ok(respuesta.body.objetivos.length >= 1);
  assert.ok(respuesta.body.progresos.length >= 1);
});

test('US-S3-05: sin rutina activa responde con rutina_activa null y mensaje claro (FR-014)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/mi-entrenamiento')
    .set('Authorization', `Bearer ${tokens.clienteSinDatos}`)
    .expect(200);

  assert.equal(respuesta.body.rutina_activa, null);
  assert.equal(respuesta.body.mensaje, 'sin_rutina_asignada');
  assert.equal(respuesta.body.progresos.length, 0);
  assert.equal(respuesta.body.mensaje_progreso, 'sin_progreso_registrado');
  // Cada cliente ve solo lo suyo: nunca datos de otro cliente (FR-013).
  for (const progreso of respuesta.body.progresos) {
    assert.notEqual(progreso.id_cliente, ids.clienteConDatos.idCliente);
  }
});

test('US-S3-05: los demás roles reciben 403 (FR-015)', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['administrador', 'recepcionista', 'entrenador']) {
    const respuesta = await request(app)
      .get('/api/mi-entrenamiento')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
    assert.equal(respuesta.body.codigo, 'AUTORIZACION');
  }
});

test('US-S3-05: sin token responde 401', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app).get('/api/mi-entrenamiento').expect(401);
  assert.equal(respuesta.body.codigo, 'AUTH_REQUERIDA');
});
