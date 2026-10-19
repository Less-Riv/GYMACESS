// Pruebas de integración de tipos de membresía (T009, US-S2-01).
// Recorrido completo: alta → persistencia en MySQL → modificación → relación
// con membresías existentes conservada (esc. 4).
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
let token = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;
  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  token = login.body.token;
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

test('US-S2-01: el tipo creado persiste en MySQL y aparece en el listado', async (t) => {
  if (saltar(t)) return;

  const creada = await request(app)
    .post('/api/tipos-membresia')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'Anual', descripcion: 'Doce meses', duracion: 365, precio: 4800 })
    .expect(201);

  const listada = await request(app)
    .get('/api/tipos-membresia')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const coincide = listada.body.tipos.find(
    (tipo) => tipo.id_tipo_membresia === creada.body.tipo.id_tipo_membresia
  );
  assert.ok(coincide, 'el tipo creado debe aparecer en el listado');
  assert.equal(coincide.duracion, 365);
  assert.equal(coincide.precio, '4800.00');
});

test('US-S2-01: modificar el precio persiste el cambio', async (t) => {
  if (saltar(t)) return;

  const creada = await request(app)
    .post('/api/tipos-membresia')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'Promo', duracion: 15, precio: 250 })
    .expect(201);

  const modificada = await request(app)
    .put(`/api/tipos-membresia/${creada.body.tipo.id_tipo_membresia}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ precio: 300 })
    .expect(200);

  assert.equal(modificada.body.tipo.precio, '300.00');
  assert.equal(modificada.body.tipo.nombre, 'Promo', 'los demás campos se conservan');
});

test('US-S2-01: modificar un tipo inexistente responde 404', async (t) => {
  if (saltar(t)) return;

  await request(app)
    .put('/api/tipos-membresia/999999')
    .set('Authorization', `Bearer ${token}`)
    .send({ precio: 100 })
    .expect(404);
});

test('US-S2-01: cambiar la descripción no afecta las membresías existentes (esc. 4)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  // Se apoya en el tipo de la semilla, ligado a una membresía de prueba.
  const [tipos] = await obtenerPool().query(
    "SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = 'Mensual' LIMIT 1"
  );
  const idTipo = tipos[0].id_tipo_membresia;

  const [clientes] = await obtenerPool().query(
    "INSERT INTO clientes (nombre, apellido, correo) VALUES ('Rel', 'Lación', 'relacion@tipos.test')"
  );
  const [membresias] = await obtenerPool().query(
    'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin) VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY))',
    [clientes.insertId, idTipo]
  );

  await request(app)
    .put(`/api/tipos-membresia/${idTipo}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ descripcion: 'Descripción actualizada' })
    .expect(200);

  const [membresia] = await obtenerPool().query(
    'SELECT id_tipo_membresia FROM membresias WHERE id_membresia = ?',
    [membresias.insertId]
  );
  assert.equal(
    membresia[0].id_tipo_membresia,
    idTipo,
    'la membresía existente conserva su relación con el tipo'
  );
});
