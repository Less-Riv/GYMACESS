// Pruebas de integración de la historia US-S3-04 (T034): registro de
// objetivos y progresos. Recorrido completo: objetivo → dos progresos (uno
// completo y otro mínimo) → cierre del objetivo al cumplirse → histórico
// conservado e inmutable.
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
    ['Integración', 'Progreso', correo]
  );
  return resultado.insertId;
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

test('US-S3-04: objetivo, dos progresos y conservación del histórico', async (t) => {
  if (saltar(t)) return;

  const ana = await crearFicha('ana@progreso-us4.test', 'Ana López', tokens.administrador);
  const tokenAna = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });
  const idCliente = await crearCliente('cliente@progreso-us4.test');

  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_entrenador: ana.idEntrenador })
    .expect(201);

  // 1) Registro del objetivo (esc. 1).
  const objetivo = await request(app)
    .post('/api/objetivos')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({
      id_cliente: idCliente,
      descripcion: 'Reducir cintura a 85 cm',
      fecha_objetivo: '2026-12-31',
    })
    .expect(201);

  // 2) Progreso completo con peso, medidas y objetivo (esc. 3).
  await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({
      id_cliente: idCliente,
      fecha: '2026-09-01',
      comentario: 'Inicio del plan: cintura de 92 cm',
      peso: 84.0,
      cintura: 92.0,
      id_objetivo: objetivo.body.objetivo.id_objetivo,
    })
    .expect(201);

  // 3) Progreso mínimo, solo con fecha y comentario (esc. 4).
  await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({
      id_cliente: idCliente,
      fecha: '2026-10-01',
      comentario: 'Buena constancia en las sesiones',
    })
    .expect(201);

  // 4) El histórico se devuelve completo y ordenado (FR-012, esc. 5).
  const listado = await request(app)
    .get(`/api/progresos?cliente_id=${idCliente}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.equal(listado.body.progresos.length, 2);
  assert.equal(listado.body.progresos[0].fecha, '2026-09-01');
  assert.equal(listado.body.progresos[1].fecha, '2026-10-01');

  // 5) Cierre del objetivo al cumplirse (esc. 6).
  const cerrado = await request(app)
    .put(`/api/objetivos/${objetivo.body.objetivo.id_objetivo}`)
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({ estado: 'cumplido' })
    .expect(200);
  assert.equal(cerrado.body.objetivo.estado, 'cumplido');
  assert.ok(cerrado.body.objetivo.fecha_cierre);

  // 6) El histórico queda intacto tras todo (RN-17).
  const { obtenerPool } = await import('../../src/config/database.js');
  const [progresos] = await obtenerPool().query(
    'SELECT * FROM progresos_clientes WHERE id_cliente = ?',
    [idCliente]
  );
  assert.equal(progresos.length, 2, 'los progresos no se modifican ni se eliminan');
});

test('US-S3-04: el entrenador que pierde la carga deja de registrar progresos (RN-19)', async (t) => {
  if (saltar(t)) return;

  const ana = await crearFicha('ana2@progreso-us4.test', 'Ana Dos', tokens.administrador);
  const tokenAna = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });
  const idCliente = await crearCliente('cliente2@progreso-us4.test');

  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_entrenador: ana.idEntrenador })
    .expect(201);

  // Con la carga vigente sí puede registrar.
  await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({ id_cliente: idCliente, fecha: '2026-10-02', comentario: 'Con carga' })
    .expect(201);

  // Tras la reasignación pierde el acceso.
  const { obtenerPool } = await import('../../src/config/database.js');
  const [activa] = await obtenerPool().query(
    "SELECT id_asignacion FROM asignaciones_entrenador WHERE id_cliente = ? AND estado = 'activa'",
    [idCliente]
  );
  const otra = await crearFicha('otra@progreso-us4.test', 'Otra Entrenadora', tokens.administrador);
  await request(app)
    .put(`/api/asignaciones/${activa[0].id_asignacion}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_entrenador: otra.idEntrenador })
    .expect(200);

  const respuesta = await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({ id_cliente: idCliente, fecha: '2026-10-03', comentario: 'Sin carga' })
    .expect(403);
  assert.equal(respuesta.body.codigo, 'AUTORIZACION');
});
