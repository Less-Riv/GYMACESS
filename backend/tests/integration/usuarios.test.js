// Pruebas de integración de usuarios (T037, US3; quickstart V3, SC-002).
// Verifican el hash bcrypt real en la tabla y el alta automática del cliente
// asociado cuando el rol es 'cliente' (aclaración 2026-10-14).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  tokenDePrueba,
  SEMILLA,
} from '../ayuda/base-pruebas.js';

let disponible = false;
let tokenAdmin = null;
let pool = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;
  const modulo = await import('../../src/config/database.js');
  pool = modulo.obtenerPool();
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokenAdmin = login.body.token;
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

test('el usuario creado guarda la contraseña como hash bcrypt, nunca en texto plano (SC-002)', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      nombre: 'Entrenador Prueba',
      correo: 'entrenador@integracion.test',
      password: 'Entrena1234!',
      rol: 'entrenador',
    })
    .expect(201);

  const [filas] = await pool.query('SELECT password FROM usuarios WHERE correo = ?', [
    'entrenador@integracion.test',
  ]);

  assert.ok(filas[0].password.startsWith('$2'), 'debe ser un hash bcrypt');
  assert.notEqual(filas[0].password, 'Entrena1234!', 'nunca texto plano');
  assert.ok(await bcrypt.compare('Entrena1234!', filas[0].password), 'el hash es verificable');
});

test('el usuario recién creado puede iniciar sesión con ese correo', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo: 'entrenador@integracion.test', password: 'Entrena1234!' })
    .expect(200);

  assert.equal(respuesta.body.usuario.rol, 'entrenador');
});

test('crear un usuario con rol cliente crea también el cliente y lo enlaza', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      nombre: 'Laura',
      apellido: 'Gómez',
      correo: 'laura-cliente@integracion.test',
      password: 'Cliente1234!',
      rol: 'cliente',
    })
    .expect(201);

  const [clientes] = await pool.query('SELECT nombre, apellido FROM clientes WHERE correo = ?', [
    'laura-cliente@integracion.test',
  ]);
  assert.equal(clientes.length, 1, 'debe crear el cliente con el mismo correo');
  assert.equal(clientes[0].nombre, 'Laura', 'el nombre proviene del formulario');
  assert.equal(clientes[0].apellido, 'Gómez', 'el apellido proviene del formulario');

  assert.ok(respuesta.body.usuario.id_usuario, 'el usuario también fue creado');
  const [filas] = await pool.query('SELECT id_cliente FROM clientes WHERE correo = ?', [
    'laura-cliente@integracion.test',
  ]);
  assert.equal(
    respuesta.body.usuario.cliente_id,
    filas[0].id_cliente,
    'el usuario queda enlazado al cliente creado'
  );
});

test('el alta de un usuario cliente sin apellido deja el apellido del cliente vacío', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      nombre: 'Sin Apellido',
      correo: 'sin-apellido@integracion.test',
      password: 'Cliente1234!',
      rol: 'cliente',
    })
    .expect(201);

  const [clientes] = await pool.query('SELECT apellido, nombre FROM clientes WHERE correo = ?', [
    'sin-apellido@integracion.test',
  ]);
  assert.equal(clientes.length, 1, 'se crea el cliente aunque falte el apellido');
  assert.equal(clientes[0].apellido, '', 'apellido NOT NULL se satisface con cadena vacía');
  assert.equal(clientes[0].nombre, 'Sin Apellido');
  assert.equal(respuesta.body.usuario.cliente_id > 0, true, 'el usuario queda enlazado');
});

test('reutiliza un cliente existente cuando el correo ya está en la tabla clientes', async (t) => {
  if (saltar(t)) return;

  // Cliente registrado previamente, sin usuario asociado.
  const previo = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ nombre: 'Previa', apellido: 'Reuso', correo: 'reuso@integracion.test' })
    .expect(201);

  const respuesta = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      nombre: 'Otro Nombre',
      apellido: 'Ignorado',
      correo: 'reuso@integracion.test',
      password: 'Cliente1234!',
      rol: 'cliente',
    })
    .expect(201);

  assert.equal(
    respuesta.body.usuario.cliente_id,
    previo.body.cliente.id_cliente,
    'el usuario se enlaza al cliente que ya existía'
  );

  const [conteo] = await pool.query('SELECT COUNT(*) AS total FROM clientes WHERE correo = ?', [
    'reuso@integracion.test',
  ]);
  assert.equal(conteo[0].total, 1, 'no debe crear un cliente duplicado');

  const [datos] = await pool.query('SELECT nombre, apellido FROM clientes WHERE id_cliente = ?', [
    previo.body.cliente.id_cliente,
  ]);
  assert.equal(datos[0].nombre, 'Previa', 'conserva el nombre original');
  assert.equal(datos[0].apellido, 'Reuso', 'conserva el apellido original');
});

test('responde 409 cuando el cliente ya tiene un usuario asociado', async (t) => {
  if (saltar(t)) return;

  const alta = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ nombre: 'Ocupado', apellido: 'Asociado', correo: 'cliente-ocupado@integracion.test' })
    .expect(201);

  // Se vincula un usuario existente (con otro correo) a ese cliente vía US4.
  const vinculado = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      nombre: 'Vinculado',
      correo: 'vinculado@integracion.test',
      password: 'Cliente1234!',
      rol: 'recepcionista',
    })
    .expect(201);

  await request(app)
    .patch(`/api/usuarios/${vinculado.body.usuario.id_usuario}/rol`)
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ rol: 'cliente', cliente_id: alta.body.cliente.id_cliente })
    .expect(200);

  const rechazo = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      nombre: 'Intento',
      apellido: 'Asociado',
      correo: 'cliente-ocupado@integracion.test',
      password: 'Cliente1234!',
      rol: 'cliente',
    })
    .expect(409);

  assert.equal(rechazo.body.mensaje, 'Ya existe un usuario para este cliente');
  assert.equal(rechazo.body.codigo, 'CONFLICTO_CLIENTE_USUARIO');

  // Rollback: no debe quedar un usuario a medias con ese correo.
  const [conteo] = await pool.query('SELECT COUNT(*) AS total FROM usuarios WHERE correo = ?', [
    'cliente-ocupado@integracion.test',
  ]);
  assert.equal(conteo[0].total, 0, 'no se crea el usuario rechazado');
});

test('un fallo al crear el usuario revierte el cliente creado (rollback)', async (t) => {
  if (saltar(t)) return;

  // Dispara un error de MySQL en el INSERT de usuarios, es decir, DESPUÉS de
  // crear el cliente dentro de la misma transacción.
  await pool.query(
    `CREATE TRIGGER trg_fallo_alta_usuario BEFORE INSERT ON usuarios
     FOR EACH ROW
     BEGIN
       IF NEW.correo = 'fallo-rollback@integracion.test' THEN
         SIGNAL SQLSTATE '45000'
           SET MESSAGE_TEXT = 'Fallo provocado para la prueba de rollback';
       END IF;
     END`
  );

  try {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Rollback',
        apellido: 'Prueba',
        correo: 'fallo-rollback@integracion.test',
        password: 'Cliente1234!',
        rol: 'cliente',
      });

    assert.equal(respuesta.status, 500, 'el fallo inesperado responde 500');
    assert.equal(respuesta.body.codigo, 'INTERNO');

    const [clientes] = await pool.query(
      'SELECT COUNT(*) AS total FROM clientes WHERE correo = ?',
      ['fallo-rollback@integracion.test']
    );
    assert.equal(clientes[0].total, 0, 'el cliente creado en la transacción se revirtió');

    const [usuarios] = await pool.query('SELECT COUNT(*) AS total FROM usuarios WHERE correo = ?', [
      'fallo-rollback@integracion.test',
    ]);
    assert.equal(usuarios[0].total, 0, 'no queda ningún usuario a medias');
  } finally {
    await pool.query('DROP TRIGGER IF EXISTS trg_fallo_alta_usuario');
  }
});

test('crear un usuario con rol administrativo deja cliente_id en NULL e ignora el cliente_id recibido', async (t) => {
  if (saltar(t)) return;

  // Cliente real que el formulario no debería poder asociar por su cuenta.
  const cliente = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ nombre: 'Ignorado', apellido: 'Por El Rol', correo: 'ignorado@integracion.test' })
    .expect(201);

  const respuesta = await request(app)
    .post('/api/usuarios')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      nombre: 'Admin Auxiliar',
      correo: 'admin-aux@integracion.test',
      password: 'Admin1234!',
      rol: 'administrador',
      cliente_id: cliente.body.cliente.id_cliente,
    })
    .expect(201);

  assert.equal(respuesta.body.usuario.cliente_id ?? null, null, 'el cliente_id recibido se ignora');
});
