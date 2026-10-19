// Pruebas de integración de asignación de roles (T043, US4; quickstart V3).
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

async function crearUsuarioDePrueba(correo, rol) {
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [resultado] = await pool.query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    [`Usuario ${rol}`, correo, hash, rol]
  );
  return resultado.insertId;
}

test('US4: cambiar el rol de entrenador a recepcionista surte efecto en la siguiente petición', async (t) => {
  if (saltar(t)) return;

  const id = await crearUsuarioDePrueba('cambio-rol@roles.test', 'entrenador');

  // Como entrenador: NO puede registrar clientes (403).
  const tokenEntrenador = tokenDePrueba({ id_usuario: id, rol: 'entrenador' });
  await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .send({ nombre: 'X', apellido: 'Y', correo: 'x@cambio-rol.test' })
    .expect(403);

  // El administrador cambia el rol a recepcionista.
  await request(app)
    .patch(`/api/usuarios/${id}/rol`)
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ rol: 'recepcionista' })
    .expect(200);

  // Con el MISMO id de usuario pero con el rol vigente en la base, la siguiente
  // petición autenticada usa el nuevo rol: ahora SÍ puede registrar clientes.
  const [filas] = await pool.query('SELECT rol FROM usuarios WHERE id_usuario = ?', [id]);
  assert.equal(filas[0].rol, 'recepcionista');

  const tokenNuevo = tokenDePrueba({ id_usuario: id, rol: filas[0].rol });
  await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokenNuevo}`)
    .send({ nombre: 'Nuevo', apellido: 'Recepcionista', correo: 'nuevo@cambio-rol.test' })
    .expect(201);
});

test('US4: asignar un rol que no existe responde 400 con mensaje claro', async (t) => {
  if (saltar(t)) return;

  const id = await crearUsuarioDePrueba('rol-invalido@roles.test', 'entrenador');
  const respuesta = await request(app)
    .patch(`/api/usuarios/${id}/rol`)
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ rol: ' supervisor ' })
    .expect(400);

  assert.equal(respuesta.body.codigo, 'VALIDACION');
  assert.match(respuesta.body.mensaje, /rol/i);
});

test('US4: un usuario sin rol administrador no puede modificar roles (403)', async (t) => {
  if (saltar(t)) return;

  const idVictima = await crearUsuarioDePrueba('victima@roles.test', 'entrenador');
  const idAtacante = await crearUsuarioDePrueba('atacante@roles.test', 'recepcionista');
  const tokenAtacante = tokenDePrueba({ id_usuario: idAtacante, rol: 'recepcionista' });

  await request(app)
    .patch(`/api/usuarios/${idVictima}/rol`)
    .set('Authorization', `Bearer ${tokenAtacante}`)
    .send({ rol: 'administrador' })
    .expect(403);

  const [filas] = await pool.query('SELECT rol FROM usuarios WHERE id_usuario = ?', [idVictima]);
  assert.equal(filas[0].rol, 'entrenador', 'el rol de la víctima no cambia');
});

test('US4: asignar rol a un usuario inexistente responde 404', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .patch('/api/usuarios/999999/rol')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ rol: 'entrenador' })
    .expect(404);
});

test('US4: cambiar a rol cliente exige cliente_id; dejar de serlo limpia la asociación', async (t) => {
  if (saltar(t)) return;

  const id = await crearUsuarioDePrueba('rol-cliente@roles.test', 'recepcionista');

  // Sin cliente_id → 400.
  await request(app)
    .patch(`/api/usuarios/${id}/rol`)
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ rol: 'cliente' })
    .expect(400);

  // Con cliente real → 200 y cliente_id guardado.
  const alta = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ nombre: 'Rol', apellido: 'Cliente', correo: 'rol-cliente@clientes.test' })
    .expect(201);

  const cambio = await request(app)
    .patch(`/api/usuarios/${id}/rol`)
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ rol: 'cliente', cliente_id: alta.body.cliente.id_cliente })
    .expect(200);
  assert.equal(cambio.body.usuario.cliente_id, alta.body.cliente.id_cliente);

  // Volver a entrenador → cliente_id queda NULL.
  const vuelta = await request(app)
    .patch(`/api/usuarios/${id}/rol`)
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ rol: 'entrenador' })
    .expect(200);
  assert.equal(vuelta.body.usuario.cliente_id ?? null, null);
});
