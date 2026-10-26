// Pruebas de integración de la historia US-S3-05 (T034): consulta de la
// rutina y el progreso propios. Recorrido completo: cliente con datos →
// cliente vacío → separación estricta entre clientes → reasignación del
// entrenador visible en la vista propia.
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

async function crearClienteConCuenta(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [cliente] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Integración', 'Cliente', correo]
  );
  const [cuenta] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol, cliente_id) VALUES (?, ?, ?, ?, ?)',
    [`Cliente ${correo}`, correo, hash, 'cliente', cliente.insertId]
  );
  return { idCliente: cliente.insertId, idUsuario: cuenta.insertId };
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

test('US-S3-05: cada cliente ve solo su propio entrenamiento', async (t) => {
  if (saltar(t)) return;

  const ana = await crearFicha('ana@mi-ent-us5.test', 'Ana López', tokens.administrador);
  const tokenAna = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });

  const luis = await crearClienteConCuenta('luis@mi-ent-us5.test');
  const marta = await crearClienteConCuenta('marta@mi-ent-us5.test');
  const tokenLuis = tokenDePrueba({ id_usuario: luis.idUsuario, rol: 'cliente' });
  const tokenMarta = tokenDePrueba({ id_usuario: marta.idUsuario, rol: 'cliente' });

  // Luis recibe entrenamiento; Marta queda sin asignar.
  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: luis.idCliente, id_entrenador: ana.idEntrenador })
    .expect(201);

  await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({
      id_cliente: luis.idCliente,
      nombre: 'Rutina de Luis',
      ejercicios: [{ nombre: 'Sentadilla', series: 3, repeticiones: '10' }],
    })
    .expect(201);

  await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({ id_cliente: luis.idCliente, fecha: '2026-10-01', comentario: 'Avance de Luis' })
    .expect(201);

  // 1) Luis ve su rutina y su progreso (esc. 1 y 3).
  const vistaLuis = await request(app)
    .get('/api/mi-entrenamiento')
    .set('Authorization', `Bearer ${tokenLuis}`)
    .expect(200);
  assert.equal(vistaLuis.body.rutina_activa.nombre, 'Rutina de Luis');
  assert.equal(vistaLuis.body.progresos.length, 1);
  assert.equal(vistaLuis.body.entrenador.nombre, 'Ana López');

  // 2) Marta NO ve nada de Luis (esc. 2, FR-013).
  const vistaMarta = await request(app)
    .get('/api/mi-entrenamiento')
    .set('Authorization', `Bearer ${tokenMarta}`)
    .expect(200);
  assert.equal(vistaMarta.body.rutina_activa, null);
  assert.equal(vistaMarta.body.mensaje, 'sin_rutina_asignada');
  assert.equal(vistaMarta.body.progresos.length, 0);
  assert.equal(vistaMarta.body.mensaje_progreso, 'sin_progreso_registrado');

  // 3) Tras reasignar, Luis ve al nuevo entrenador (esc. 5).
  const luis2 = await crearFicha('luis2@mi-ent-us5.test', 'Luis Entrenador', tokens.administrador);
  const { obtenerPool } = await import('../../src/config/database.js');
  const [activa] = await obtenerPool().query(
    "SELECT id_asignacion FROM asignaciones_entrenador WHERE id_cliente = ? AND estado = 'activa'",
    [luis.idCliente]
  );
  await request(app)
    .put(`/api/asignaciones/${activa[0].id_asignacion}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_entrenador: luis2.idEntrenador })
    .expect(200);

  const vistaLuisDespues = await request(app)
    .get('/api/mi-entrenamiento')
    .set('Authorization', `Bearer ${tokenLuis}`)
    .expect(200);
  assert.equal(vistaLuisDespues.body.entrenador.nombre, 'Luis Entrenador');
  assert.equal(
    vistaLuisDespues.body.rutina_activa.nombre,
    'Rutina de Luis',
    'la rutina activa se conserva tras la reasignación'
  );

  // 4) El cliente no puede consultar los módulos generales (403, esc. 6).
  for (const ruta of ['/api/rutinas', '/api/progresos', '/api/objetivos', '/api/personal']) {
    await request(app).get(ruta).set('Authorization', `Bearer ${tokenLuis}`).expect(403);
  }
});
