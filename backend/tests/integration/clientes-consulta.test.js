// Pruebas de integración de la consulta paginada de clientes
// (T048, US5; quickstart V4, FR-027).
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
let pool = null;
let tokenEntrenador = null;
let tokenAdmin = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;
  const modulo = await import('../../src/config/database.js');
  pool = modulo.obtenerPool();
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);

  const [entrenador] = await pool.query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Entrenador Pagina', 'entrenador@paginas.test', hash, 'entrenador']
  );
  tokenEntrenador = tokenDePrueba({ id_usuario: entrenador.insertId, rol: 'entrenador' });

  const [admin] = await pool.query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Admin Pagina', 'admin@paginas.test', hash, 'administrador']
  );
  tokenAdmin = tokenDePrueba({ id_usuario: admin.insertId, rol: 'administrador' });
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

test('US5: 25 clientes producen dos páginas de 20 y 5 registros (FR-027)', async (t) => {
  if (saltar(t)) return;

  // Inserta 25 clientes de prueba directamente (más rápido que por la API).
  for (let i = 1; i <= 25; i += 1) {
    await pool.query(
      'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
      [`Cliente${i}`, 'Paginado', `paginado-${i}@clientes.test`]
    );
  }

  const primera = await request(app)
    .get('/api/clientes')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .expect(200);

  assert.equal(primera.body.clientes.length, 20, 'la primera página tiene 20 registros');
  assert.equal(primera.body.pagina, 1);
  assert.equal(primera.body.limite, 20);
  assert.ok(primera.body.total >= 25);
  assert.ok(primera.body.totalPaginas >= 2);

  const segunda = await request(app)
    .get('/api/clientes?pagina=2')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .expect(200);

  assert.equal(segunda.body.pagina, 2);
  assert.ok(segunda.body.clientes.length <= 20);
  assert.ok(
    segunda.body.clientes.length >= 5,
    'la segunda página tiene al menos los 5 clientes restantes'
  );

  // Sin solapamiento entre páginas.
  const idsPrimera = new Set(primera.body.clientes.map((c) => c.id_cliente));
  const solapados = segunda.body.clientes.filter((c) => idsPrimera.has(c.id_cliente));
  assert.equal(solapados.length, 0, 'las páginas no deben solaparse');
});

test('US5: una página fuera de rango responde lista vacía con paginación coherente', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/clientes?pagina=9999')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .expect(200);

  assert.equal(respuesta.body.clientes.length, 0);
  assert.equal(respuesta.body.pagina, 9999);
  assert.ok(respuesta.body.totalPaginas >= 2);
});

test('US5: el entrenador ve solo 4 campos en cada fila paginada (FR-025)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/clientes')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .expect(200);

  assert.ok(respuesta.body.clientes.length > 0);
  for (const cliente of respuesta.body.clientes) {
    assert.deepEqual(Object.keys(cliente).sort(), ['apellido', 'estado', 'nombre', 'telefono']);
  }
});

test('US5: el detalle de un cliente proyecta los campos del entrenador (FR-025)', async (t) => {
  if (saltar(t)) return;

  const [filas] = await pool.query(
    'SELECT id_cliente FROM clientes WHERE correo = ?',
    ['paginado-1@clientes.test']
  );

  const comoEntrenador = await request(app)
    .get(`/api/clientes/${filas[0].id_cliente}`)
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .expect(200);
  assert.deepEqual(
    Object.keys(comoEntrenador.body.cliente).sort(),
    ['apellido', 'estado', 'nombre', 'telefono']
  );

  const comoAdmin = await request(app)
    .get(`/api/clientes/${filas[0].id_cliente}`)
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .expect(200);
  assert.ok(comoAdmin.body.cliente.correo, 'el administrador ve todos los campos');
});

test('US5: un id inexistente en el detalle responde 404', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .get('/api/clientes/999999')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .expect(404);
});
