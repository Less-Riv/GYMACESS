// Pruebas de integración de la historia US-S3-01 (T007): registro de
// entrenadores. Recorrido completo: cuenta con rol entrenador → alta de la
// ficha → persistencia en MySQL → consulta del listado → modificación →
// rechazos por rol y por cuenta inválida.
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

async function crearCuenta(correo, rol) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [resultado] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    [`Cuenta ${rol}`, correo, hash, rol]
  );
  return resultado.insertId;
}

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  for (const rol of ['recepcionista', 'entrenador', 'cliente']) {
    const [resultado] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Integración ${rol}`, `${rol}@entrenador-us1.test`, 'x', rol]
    );
    tokens[rol] = tokenDePrueba({ id_usuario: resultado.insertId, rol });
  }
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

test('US-S3-01: alta, consulta, modificación y baja lógica del entrenador', async (t) => {
  if (saltar(t)) return;

  const idCuenta = await crearCuenta('ana@entrenador-us1.test', 'entrenador');

  // 1) Alta (US-S3-01 esc. 1).
  const alta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: idCuenta, nombre: 'Ana López', correo_contacto: 'ana@gimnasio.test' })
    .expect(201);
  const idEntrenador = alta.body.entrenador.id_entrenador;

  // 2) Persistencia en MySQL con el vínculo a la cuenta (RN-15).
  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT * FROM entrenadores WHERE id_entrenador = ?',
    [idEntrenador]
  );
  assert.equal(filas[0].id_usuario, idCuenta, 'la ficha queda vinculada a la cuenta');
  assert.equal(filas[0].estado, 'activo');

  // 3) Aparece en el listado del personal (US-S3-07, escenario base).
  const listado = await request(app)
    .get('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);
  assert.ok(listado.body.entrenadores.some((e) => e.id_entrenador === idEntrenador));

  // 4) Modificación con persistencia (esc. 2).
  await request(app)
    .put(`/api/entrenadores/${idEntrenador}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ nombre: 'Ana López Martínez', telefono: '5500112233' })
    .expect(200);
  const [modificado] = await obtenerPool().query(
    'SELECT nombre, telefono FROM entrenadores WHERE id_entrenador = ?',
    [idEntrenador]
  );
  assert.equal(modificado[0].nombre, 'Ana López Martínez');
  assert.equal(modificado[0].telefono, '5500112233');

  // 5) La baja lógica conserva el registro (esc. 4; el cierre de
  //    asignaciones se prueba en US-S3-02).
  await request(app)
    .put(`/api/entrenadores/${idEntrenador}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ estado: 'inactivo' })
    .expect(200);
  const [baja] = await obtenerPool().query(
    'SELECT estado FROM entrenadores WHERE id_entrenador = ?',
    [idEntrenador]
  );
  assert.equal(baja[0].estado, 'inactivo', 'la baja es lógica, nunca física');
});

test('US-S3-01: no se puede crear una segunda ficha para la misma cuenta (RN-15)', async (t) => {
  if (saltar(t)) return;

  const idCuenta = await crearCuenta('dup@entrenador-us1.test', 'entrenador');

  await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: idCuenta, nombre: 'Primera Ficha' })
    .expect(201);

  const repetida = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: idCuenta, nombre: 'Segunda Ficha' })
    .expect(409);
  assert.equal(repetida.body.codigo, 'USUARIO_YA_ASOCIADO');

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT COUNT(*) AS total FROM entrenadores WHERE id_usuario = ?',
    [idCuenta]
  );
  assert.equal(filas[0].total, 1, 'solo puede existir una ficha por cuenta');
});

test('US-S3-01: los roles no autorizados reciben 403 en toda la operación', async (t) => {
  if (saltar(t)) return;

  // El recepcionista puede consultar pero no crear ni modificar (esc. 3).
  await request(app)
    .get('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .expect(200);

  const creacion = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_usuario: 1, nombre: 'Intento Recepcionista' })
    .expect(403);
  assert.equal(creacion.body.codigo, 'AUTORIZACION');

  // El entrenador y el cliente no consultan el módulo.
  for (const rol of ['entrenador', 'cliente']) {
    await request(app)
      .get('/api/entrenadores')
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .expect(403);
  }
});
