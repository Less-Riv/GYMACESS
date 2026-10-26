// Pruebas de integración de la historia US-S3-07 (T058): consulta de la
// carga del personal. Recorrido completo: tres entrenadores con carga
// distinta → vista consolidada → detalle y filtros → pendientes de
// asignación → la carga propia del entrenador coincide con la vista general.
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

async function crearFicha(correo, nombre, tokenAdmin) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [cuenta] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Integración entrenador', correo, hash, 'entrenador']
  );
  const respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ id_usuario: cuenta.insertId, nombre });
  return { idEntrenador: respuesta.body.entrenador.id_entrenador, idUsuario: cuenta.insertId };
}

async function crearCliente(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [resultado] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Integración', 'Personal', correo]
  );
  return resultado.insertId;
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
    t.skip('MySQL no está disponible; pruebas de integración omitidas.');
    return true;
  }
  return false;
}

test('US-S3-07: carga por entrenador, filtros y pendientes de asignación', async (t) => {
  if (saltar(t)) return;

  const ana = await crearFicha('ana@personal-us7.test', 'Ana López', tokens.administrador);
  const luis = await crearFicha('luis@personal-us7.test', 'Luis Sánchez', tokens.administrador);
  const marta = await crearFicha('marta@personal-us7.test', 'Marta Ruiz', tokens.administrador);

  const clienteUno = await crearCliente('uno@personal-us7.test');
  const clienteDos = await crearCliente('dos@personal-us7.test');
  const clienteTres = await crearCliente('tres@personal-us7.test');
  const pendiente = await crearCliente('pendiente@personal-us7.test');

  // Ana carga 2 clientes, Luis 1 y Marta ninguno.
  await asignar(clienteUno, ana.idEntrenador);
  await asignar(clienteDos, ana.idEntrenador);
  await asignar(clienteTres, luis.idEntrenador);

  // 1) Vista consolidada con la carga de cada uno (esc. 1 y 2).
  const vista = await request(app)
    .get('/api/personal')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const anaVista = vista.body.personal.find((p) => p.id_entrenador === ana.idEntrenador);
  const luisVista = vista.body.personal.find((p) => p.id_entrenador === luis.idEntrenador);
  const martaVista = vista.body.personal.find((p) => p.id_entrenador === marta.idEntrenador);

  assert.equal(anaVista.clientes_asignados, 2, 'Ana tiene dos clientes');
  assert.equal(luisVista.clientes_asignados, 1, 'Luis tiene un cliente');
  assert.equal(martaVista.clientes_asignados, 0, 'Marta aún no tiene carga');
  assert.equal(anaVista.clientes.length, 2, 'el detalle coincide con la carga');

  // 2) El cliente sin asignación aparece como pendiente (esc. 3).
  const pendientes = vista.body.pendientes_de_asignacion.map((c) => c.id_cliente);
  assert.ok(pendientes.includes(pendiente), 'el cliente sin entrenador está pendiente');
  assert.ok(!pendientes.includes(clienteUno), 'los asignados no aparecen como pendientes');

  // 3) Filtro por entrenador (esc. 4).
  const filtrada = await request(app)
    .get(`/api/personal?entrenador_id=${luis.idEntrenador}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.equal(filtrada.body.personal.length, 1);
  assert.equal(filtrada.body.personal[0].id_entrenador, luis.idEntrenador);

  // 4) La vista propia de Ana coincide con su parte de la vista general (esc. 5).
  const tokenAna = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });
  const propia = await request(app)
    .get('/api/personal/mi-carga')
    .set('Authorization', `Bearer ${tokenAna}`)
    .expect(200);
  assert.equal(propia.body.personal.length, 1);
  assert.equal(propia.body.personal[0].clientes_asignados, 2);
  assert.deepEqual(
    propia.body.personal[0].clientes.map((c) => c.id_cliente).sort(),
    anaVista.clientes.map((c) => c.id_cliente).sort(),
    'la carga propia coincide con la vista del administrador'
  );

  // 5) Tras la baja de Ana, su carga queda cerrada y sus clientes, pendientes.
  await request(app)
    .put(`/api/entrenadores/${ana.idEntrenador}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ estado: 'inactivo' })
    .expect(200);

  const despues = await request(app)
    .get('/api/personal')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  const anaDespues = despues.body.personal.find((p) => p.id_entrenador === ana.idEntrenador);
  assert.equal(anaDespues.estado, 'inactivo');
  assert.equal(anaDespues.clientes_asignados, 0, 'la baja cierra su carga');
  const pendientesDespues = despues.body.pendientes_de_asignacion.map((c) => c.id_cliente);
  assert.ok(pendientesDespues.includes(clienteUno), 'sus clientes quedan pendientes de asignar');
});
