// Pruebas de integración de consulta de accesos (T065, US-S2-09).
// Recorrido: filtros por fecha y resultado, vista básica del entrenador sin
// motivos (principio VI), rechazos por rol en el listado general y ausencia
// de operación de eliminación (RN-10).
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
import { descriptorDePrueba } from '../ayuda/descriptores-faciales.js';

let disponible = false;
let tokens = {};
let idCliente = null;
const app = crearApp();

// Fecha fija de los registros de prueba para poder filtrar por ella.
const FECHA_PRUEBA = new Date().toISOString().slice(0, 10);

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Prueba ${rol}`, `${rol}@consulta.test`, hash, rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  // Cliente con descriptor facial y membresía activa, para generar accesos
  // reales a través del punto de acceso.
  const [clientes] = await obtenerPool().query(
    "INSERT INTO clientes (nombre, apellido, correo) VALUES ('Consulta', 'Acceso', 'consulta@consulta.test')"
  );
  idCliente = clientes.insertId;
  const [tipos] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'activo')`,
    [idCliente, tipos[0].id_tipo_membresia]
  );
  await obtenerPool().query('INSERT INTO rostros (id_cliente, descriptor) VALUES (?, ?)', [
    idCliente,
    JSON.stringify(descriptorDePrueba(40)),
  ]);

  // Registros directos para garantizar variedad de fechas, resultados y motivos.
  await obtenerPool().query(
    `INSERT INTO accesos (id_cliente, fecha, hora, resultado, motivo) VALUES
       (?, '2026-01-10', '08:00:00', 'autorizado', NULL),
       (?, '2026-01-10', '09:30:00', 'rechazado', 'membresia_vencida'),
       (NULL, '2026-01-11', '10:00:00', 'rechazado', 'identificacion_no_reconocida')`,
    [idCliente, idCliente]
  );
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

test('US-S2-09: el listado completo devuelve cliente, motivo y resultados', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/accesos')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.ok(respuesta.body.accesos.length >= 3, 'deben aparecer los registros de prueba');
  const conCliente = respuesta.body.accesos.find(
    (a) => a.cliente && a.cliente.id_cliente === idCliente
  );
  assert.ok(conCliente, 'los accesos deben incluir el cliente (contrato)');
  assert.ok(conCliente.motivo !== undefined, 'la vista completa incluye el motivo');
  assert.ok(conCliente.cliente.nombre, 'se resuelve el nombre del cliente');
});

test('US-S2-09: el filtro por fecha devuelve solo esa fecha', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/accesos?fecha=2026-01-10')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .expect(200);

  assert.equal(respuesta.body.accesos.length, 2, 'solo los dos del 2026-01-10');
  for (const acceso of respuesta.body.accesos) {
    assert.equal(acceso.fecha, '2026-01-10');
  }
});

test('US-S2-09: el filtro por resultado devuelve solo ese resultado', async (t) => {
  if (saltar(t)) return;

  const autorizados = await request(app)
    .get('/api/accesos?resultado=autorizado')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.ok(autorizados.body.accesos.length >= 1);
  for (const acceso of autorizados.body.accesos) {
    assert.equal(acceso.resultado, 'autorizado');
  }

  const rechazados = await request(app)
    .get('/api/accesos?resultado=rechazado')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.ok(rechazados.body.accesos.length >= 2);
  for (const acceso of rechazados.body.accesos) {
    assert.equal(acceso.resultado, 'rechazado');
  }
});

test('US-S2-09: la vista básica del entrenador excluye los motivos (principio VI)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/accesos/basicos')
    .set('Authorization', `Bearer ${tokens.entrenador}`)
    .expect(200);

  assert.ok(respuesta.body.accesos.length >= 3);
  for (const acceso of respuesta.body.accesos) {
    assert.equal(acceso.motivo, undefined, 'el entrenador no ve motivos de rechazo');
    assert.ok(acceso.fecha, 'sí ve la fecha');
    assert.ok(acceso.hora, 'sí ve la hora');
    assert.ok(acceso.resultado, 'sí ve el resultado');
    assert.ok('cliente' in acceso, 'sí ve el cliente');
  }
});

test('US-S2-09: el entrenador recibe 403 en el listado completo', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .get('/api/accesos')
    .set('Authorization', `Bearer ${tokens.entrenador}`)
    .expect(403);
});

test('US-S2-09: el cliente recibe 403 en el listado general', async (t) => {
  if (saltar(t)) return;

  for (const ruta of ['/api/accesos', '/api/accesos/basicos']) {
    await request(app)
      .get(ruta)
      .set('Authorization', `Bearer ${tokens.cliente}`)
      .expect(403);
  }
});

test('US-S2-09: el cliente consulta sus propios accesos en mis-accesos', async (t) => {
  if (saltar(t)) return;

  // Se asocia el usuario cliente de prueba con un cliente que tenga accesos.
  const { obtenerPool } = await import('../../src/config/database.js');
  const [usuarios] = await obtenerPool().query(
    'SELECT id_usuario FROM usuarios WHERE rol = ? LIMIT 1',
    ['cliente']
  );
  await obtenerPool().query('UPDATE usuarios SET cliente_id = ? WHERE id_usuario = ?', [
    idCliente,
    usuarios[0].id_usuario,
  ]);

  const respuesta = await request(app)
    .get('/api/accesos/mis-accesos')
    .set('Authorization', `Bearer ${tokens.cliente}`)
    .expect(200);

  assert.ok(respuesta.body.accesos.length >= 1, 'debe ver sus propios accesos');
  for (const acceso of respuesta.body.accesos) {
    if (acceso.cliente) {
      assert.equal(acceso.cliente.id_cliente, idCliente, 'solo accesos propios');
    }
  }
});

test('US-S2-09: no existe operación de eliminación de accesos (RN-10)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT id_acceso FROM accesos ORDER BY id_acceso DESC LIMIT 1'
  );
  const id = filas[0].id_acceso;

  const respuesta = await request(app)
    .delete(`/api/accesos/${id}`)
    .set('Authorization', `Bearer ${tokens.administrador}`);
  assert.ok(
    [404, 405].includes(respuesta.status),
    'no debe existir una ruta DELETE de accesos'
  );

  // El registro sigue ahí.
  const [despues] = await obtenerPool().query(
    'SELECT COUNT(*) AS total FROM accesos WHERE id_acceso = ?',
    [id]
  );
  assert.equal(Number(despues[0].total), 1, 'el registro no se elimina');
});

test('US-S2-09: sin token el listado responde 401', async (t) => {
  if (saltar(t)) return;

  await request(app).get('/api/accesos').expect(401);
});
