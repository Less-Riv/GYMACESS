// Pruebas de contrato del punto de acceso (T044, US-S2-07;
// contracts/api-rostros-accesos.md).
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
import { descriptorDePrueba, distanciaEuclidiana } from '../ayuda/descriptores-faciales.js';

let disponible = false;
let tokens = {};
const app = crearApp();

// El umbral real vive en entorno.FACIAL_UMBRAL (0.5 por defecto); se usa aquí
// para construir un descriptor "desconocido" que quede fuera del umbral.
const UMBRAL = 0.5;

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);

  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Prueba ${rol}`, `${rol}@accesos.test`, hash, rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  tokens.administrador = login.body.token;

  // Cliente de prueba con descriptor facial registrado y membresía activa.
  const [clientes] = await obtenerPool().query(
    "INSERT INTO clientes (nombre, apellido, correo) VALUES ('Acceso', 'Prueba', 'acceso@accesos.test')"
  );
  const idCliente = clientes.insertId;
  const [tipos] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  await obtenerPool().query(
    `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'activo')`,
    [idCliente, tipos[0].id_tipo_membresia]
  );
  await obtenerPool().query(
    'INSERT INTO rostros (id_cliente, descriptor) VALUES (?, ?)',
    [idCliente, JSON.stringify(descriptorDePrueba(20))]
  );
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

// Descriptor "desconocido": lejos de cualquier descriptor registrado.
function descriptorDesconocido() {
  return Array.from({ length: 128 }, (_v, i) => Number((Math.cos(i * 7 + 3) * 0.9).toFixed(6)));
}

test('US-S2-07: un descriptor registrado identifica al cliente y su membresía autoriza', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .post('/api/accesos/identificar')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ descriptor: descriptorDePrueba(20) })
    .expect(200);

  assert.equal(respuesta.body.identificado, true);
  assert.equal(respuesta.body.autorizado, true);
  assert.equal(respuesta.body.cliente.nombre, 'Acceso');
  assert.equal(respuesta.body.motivo, undefined);
});

test('US-S2-07: un rostro no registrado responde identificacion_no_reconocida', async (t) => {
  if (saltar(t)) return;

  const desconocido = descriptorDesconocido();
  // Verificación previa: efectivamente queda fuera del umbral.
  const distancia = distanciaEuclidiana(desconocido, descriptorDePrueba(20));
  assert.ok(distancia > UMBRAL, `el descriptor de prueba debe superar el umbral (${distancia})`);

  const respuesta = await request(app)
    .post('/api/accesos/identificar')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ descriptor: desconocido })
    .expect(200);

  assert.equal(respuesta.body.identificado, false);
  assert.equal(respuesta.body.autorizado, false);
  assert.equal(respuesta.body.motivo, 'identificacion_no_reconocida');
  assert.ok(respuesta.body.mensaje.includes('No se reconoció tu rostro'));
});

test('US-S2-07: un descriptor inválido responde 400', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/accesos/identificar')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ descriptor: [0.1, 0.2] })
    .expect(400);

  await request(app)
    .post('/api/accesos/identificar')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({})
    .expect(400);
});

test('US-S2-07: entrenador y cliente reciben 403 en el punto de acceso', async (t) => {
  if (saltar(t)) return;

  for (const rol of ['entrenador', 'cliente']) {
    await request(app)
      .post('/api/accesos/identificar')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send({ descriptor: descriptorDePrueba(21) })
      .expect(403);
  }
});

test('US-S2-07: sin token la operación responde 401 (toda operación facial exige JWT)', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/accesos/identificar')
    .send({ descriptor: descriptorDePrueba(22) })
    .expect(401);
});
