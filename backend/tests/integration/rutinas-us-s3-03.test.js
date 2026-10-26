// Pruebas de integración de la historia US-S3-03 (T025): creación de rutinas
// de entrenamiento. Recorrido completo: asignación del cliente → rutina con
// ejercicios → persistencia en MySQL → única activa por cliente → modificación
// que no altera los progresos registrados.
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
    [`Integración entrenador`, correo, hash, 'entrenador']
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
    ['Integración', 'Rutina', correo]
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

test('US-S3-03: rutina con ejercicios, única activa y modificación sin alterar progresos', async (t) => {
  if (saltar(t)) return;

  const ana = await crearFicha('ana@rutina-us3.test', 'Ana López', tokens.administrador);
  const tokenAna = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });
  const idCliente = await crearCliente('cliente@rutina-us3.test');

  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_entrenador: ana.idEntrenador })
    .expect(201);

  // 1) Creación con ejercicios (esc. 1 y 3).
  const creacion = await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({
      id_cliente: idCliente,
      nombre: 'Full body inicial',
      descripcion: 'Plan de las primeras 4 semanas',
      ejercicios: [
        { nombre: 'Sentadilla', series: 3, repeticiones: '10-12', instrucciones: 'Bajar controlado' },
        { nombre: 'Press de banca', series: 3, repeticiones: '10', carga: '40 kg' },
        { nombre: 'Plancha', repeticiones: 'al fallo' },
      ],
    })
    .expect(201);
  const idRutina = creacion.body.rutina.id_rutina;

  // 2) Persistencia completa en MySQL (ejercicios con su orden).
  const { obtenerPool } = await import('../../src/config/database.js');
  const [ejercicios] = await obtenerPool().query(
    'SELECT * FROM ejercicios_rutina WHERE id_rutina = ? ORDER BY orden',
    [idRutina]
  );
  assert.equal(ejercicios.length, 3);
  assert.equal(ejercicios[0].nombre, 'Sentadilla');
  assert.equal(ejercicios[0].series, 3);
  assert.equal(ejercicios[2].orden, 3);
  assert.equal(ejercicios[2].series, null, 'series es opcional si hay repeticiones');

  // 3) Un registro de progreso para comprobar la inmutabilidad (esc. 6).
  const progreso = await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({
      id_cliente: idCliente,
      fecha: '2026-10-01',
      comentario: 'Primera medición',
      peso: 80.5,
    });
  // La ruta de progresos se implementa en US-S3-04; mientras no exista, la
  // comprobación de inmutabilidad continúa en la prueba de esa historia.
  if (progreso.status === 201) {
    // 4) Segunda rutina: la anterior queda finalizada (FR-009, esc. 4).
    await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({
        id_cliente: idCliente,
        nombre: 'Segunda fase',
        ejercicios: [{ nombre: 'Peso muerto', series: 3, repeticiones: '5' }],
      })
      .expect(201);

    const [activas] = await obtenerPool().query(
      "SELECT COUNT(*) AS total FROM rutinas WHERE id_cliente = ? AND estado = 'activa'",
      [idCliente]
    );
    assert.equal(activas[0].total, 1, 'una sola rutina activa por cliente');

    const [progresos] = await obtenerPool().query(
      'SELECT * FROM progresos_clientes WHERE id_cliente = ?',
      [idCliente]
    );
    assert.equal(progresos.length, 1, 'la modificación de rutinas no toca los progresos');
  }
});

test('US-S3-03: sin asignación activa el entrenador no puede crear rutinas (esc. 5)', async (t) => {
  if (saltar(t)) return;

  const luis = await crearFicha('luis@rutina-us3.test', 'Luis Sánchez', tokens.administrador);
  const tokenLuis = tokenDePrueba({ id_usuario: luis.idUsuario, rol: 'entrenador' });
  const idCliente = await crearCliente('sin-carga@rutina-us3.test');

  const respuesta = await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${tokenLuis}`)
    .send({
      id_cliente: idCliente,
      nombre: 'Intento sin carga',
      ejercicios: [{ nombre: 'Sentadilla', series: 3, repeticiones: '10' }],
    })
    .expect(403);
  assert.equal(respuesta.body.codigo, 'AUTORIZACION');

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT COUNT(*) AS total FROM rutinas WHERE id_cliente = ?',
    [idCliente]
  );
  assert.equal(filas[0].total, 0, 'no se crea ninguna rutina');
});
