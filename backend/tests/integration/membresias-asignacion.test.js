// Pruebas de integración de asignación de membresías (T018, US-S2-02).
// Recorrido completo: alta con fechas calculadas → persistencia en MySQL →
// regla de una única activa por cliente → rechazo a cliente inactivo.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  SEMILLA,
} from '../ayuda/base-pruebas.js';

let disponible = false;
let token = null;
let idTipoMensual = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  token = login.body.token;

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
    t.skip('MySQL no está disponible; pruebas de integración omitidas.');
    return true;
  }
  return false;
}

async function crearClientePrueba(correo, estado = 'activo') {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [resultado] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?)',
    ['Integración', 'Prueba', correo, estado]
  );
  return resultado.insertId;
}

test('US-S2-02: la fecha de fin se calcula en el backend y persiste en MySQL', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('integracion1@membresias.test');

  const creada = await request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${token}`)
    .send({ id_cliente: idCliente, id_tipo_membresia: idTipoMensual, fecha_inicio: '2026-10-15' })
    .expect(201);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT * FROM membresias WHERE id_membresia = ?',
    [creada.body.membresia.id_membresia]
  );
  const guardada = filas[0];
  assert.equal(guardada.fecha_fin.toISOString().slice(0, 10), '2026-11-14');
  assert.equal(guardada.estado, 'activo');
});

test('US-S2-02: una membresía vencida permite asignar una nueva (una activa por cliente)', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('integracion2@membresias.test');

  // Se crea una membresía vencida directamente (estado en BD) para simular un
  // cliente cuya membresía ya expiró.
  const { obtenerPool } = await import('../../src/config/database.js');
  await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, '2026-01-01', '2026-01-31', 'vencida')`,
    [idCliente, idTipoMensual]
  );

  // Como ya no hay activa, la asignación debe permitirse.
  await request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${token}`)
    .send({ id_cliente: idCliente, id_tipo_membresia: idTipoMensual, fecha_inicio: '2026-10-15' })
    .expect(201);
});

test('US-S2-02: asignar a un cliente inactivo se rechaza sin eliminar el registro', async (t) => {
  if (saltar(t)) return;
  const idCliente = await crearClientePrueba('inactivo@membresias.test', 'inactivo');

  await request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${token}`)
    .send({ id_cliente: idCliente, id_tipo_membresia: idTipoMensual, fecha_inicio: '2026-10-15' })
    .expect(409);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query('SELECT * FROM clientes WHERE id_cliente = ?', [
    idCliente,
  ]);
  assert.equal(filas.length, 1, 'el cliente inactivo no se elimina');
  assert.equal(filas[0].estado, 'inactivo');
});

test('US-S2-02: el listado del entrenador excluye el precio (vista básica)', async (t) => {
  if (saltar(t)) return;
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [usuario] = await obtenerPool().query(
    "INSERT INTO usuarios (nombre, correo, password, rol) VALUES ('Entrenador', 'ent@listado.test', ?, 'entrenador')",
    [hash]
  );
  const { tokenDePrueba } = await import('../ayuda/base-pruebas.js');
  const tokenEntrenador = tokenDePrueba({ id_usuario: usuario.insertId, rol: 'entrenador' });

  const respuesta = await request(app)
    .get('/api/membresias')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .expect(200);

  assert.ok(Array.isArray(respuesta.body.membresias));
  if (respuesta.body.membresias.length > 0) {
    assert.equal(respuesta.body.membresias[0].tipo_precio, undefined, 'sin precio para el entrenador');
  }
});
