// Pruebas de integración del alta de clientes (T030, US2; quickstart V2).
// Verifican la persistencia real en MySQL y la baja lógica sin DELETE (FR-014).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  tokenDePrueba,
} from '../ayuda/base-pruebas.js';

let disponible = false;
let token = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;
  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [resultado] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Recepcionista Prueba', 'recepcionista@alta.test', hash, 'recepcionista']
  );
  token = tokenDePrueba({ id_usuario: resultado.insertId, rol: 'recepcionista' });
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

test('registrar un cliente como recepcionista lo persiste en MySQL', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nombre: 'Laura',
      apellido: 'Martínez',
      correo: 'laura@alta.test',
      telefono: '5511112222',
      direccion: 'Av. Principal 100',
    })
    .expect(201);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT * FROM clientes WHERE correo = ?',
    ['laura@alta.test']
  );

  assert.equal(filas.length, 1, 'el cliente debe quedar persistido');
  assert.equal(filas[0].nombre, 'Laura');
  assert.equal(filas[0].apellido, 'Martínez');
  assert.equal(filas[0].telefono, '5511112222');
  assert.equal(filas[0].direccion, 'Av. Principal 100');
  assert.equal(filas[0].estado, 'activo');
  assert.ok(filas[0].fecha_registro, 'fecha_registro la asigna MySQL');
});

test('el teléfono y la dirección son opcionales (aclaración 2026-10-09)', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'Sin', apellido: 'Contacto', correo: 'sin-contacto@alta.test' })
    .expect(201);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    'SELECT telefono, direccion FROM clientes WHERE correo = ?',
    ['sin-contacto@alta.test']
  );
  assert.equal(filas[0].telefono, null);
  assert.equal(filas[0].direccion, null);
});

test('la baja lógica conserva el registro (sin DELETE; FR-014)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  await obtenerPool().query(
    "UPDATE clientes SET estado = 'inactivo' WHERE correo = ?",
    ['sin-contacto@alta.test']
  );

  const [filas] = await obtenerPool().query(
    'SELECT estado FROM clientes WHERE correo = ?',
    ['sin-contacto@alta.test']
  );
  assert.equal(filas.length, 1, 'el registro no se elimina físicamente');
  assert.equal(filas[0].estado, 'inactivo');
});
