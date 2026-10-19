// Pruebas de los casos límite del spec (T064, fase de pulido; spec.md
// "Casos límite"): usuario desactivado con sesión activa, inyección SQL sin
// efecto y respuesta 500 genérica ante MySQL no disponible (FR-020).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mysql from 'mysql2/promise';
import { crearApp } from '../../src/app.js';
import { entorno } from '../../src/config/entorno.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  tokenDePrueba,
  SEMILLA,
} from '../ayuda/base-pruebas.js';

let disponible = false;
let pool = null;
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;
  const modulo = await import('../../src/config/database.js');
  pool = modulo.obtenerPool();
});

after(async () => {
  await finalizarPruebas();
});

function saltar(t) {
  if (!disponible) {
    t.skip('MySQL no está disponible; esta prueba requiere la base de datos.');
    return true;
  }
  return false;
}

test('un usuario desactivado pierde su sesión activa en la siguiente petición (caso límite)', async (t) => {
  if (saltar(t)) return;

  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  const [usuario] = await pool.query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Desactivar Pronto', 'desactivar@casos.test', hash, 'recepcionista']
  );
  const token = tokenDePrueba({ id_usuario: usuario.insertId, rol: 'recepcionista' });

  // Con el usuario activo, la petición funciona.
  await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${token}`)
    .expect(403); // recepcionista autenticado: 403, no 401

  // Se desactiva con la sesión "activa"; la siguiente petición queda rechazada.
  await pool.query("UPDATE usuarios SET estado = 'inactivo' WHERE id_usuario = ?", [
    usuario.insertId,
  ]);

  const respuesta = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${token}`)
    .expect(401);
  assert.equal(respuesta.body.codigo, 'AUTH_TOKEN');

  // Reactivar para no afectar a otras pruebas.
  await pool.query("UPDATE usuarios SET estado = 'activo' WHERE id_usuario = ?", [
    usuario.insertId,
  ]);
});

test('un usuario inactivo no puede iniciar sesión aunque su contraseña sea correcta', async (t) => {
  if (saltar(t)) return;

  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);
  await pool.query(
    'INSERT INTO usuarios (nombre, correo, password, rol, estado) VALUES (?, ?, ?, ?, ?)',
    ['Inactivo Login', 'inactivo@casos.test', hash, 'recepcionista', 'inactivo']
  );

  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo: 'inactivo@casos.test', password: 'Prueba1234!' })
    .expect(401);

  // Mismo mensaje genérico que una contraseña incorrecta.
  assert.equal(respuesta.body.mensaje, 'Credenciales inválidas');
});

test('intentos de inyección SQL no afectan la base de datos (FR-015)', async (t) => {
  if (saltar(t)) return;

  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password })
    .expect(200);

  const inyeccion = "'; DROP TABLE clientes; --";

  // Login con inyección en el correo: el formato se rechaza en la validación
  // de entrada (FR-013) ANTES de autenticar, así que responde 400; lo
  // importante es que nada llega a interpretarse como SQL (FR-015).
  const loginInyectado = await request(app)
    .post('/api/auth/login')
    .send({ correo: inyeccion, password: 'cualquier_cosa' })
    .expect(400);
  assert.equal(loginInyectado.body.codigo, 'VALIDACION');
  assert.equal(loginInyectado.body.mensaje, 'El correo tiene un formato inválido');

  // Registro de cliente con inyección en el nombre: se trata como texto.
  await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({ nombre: inyeccion, apellido: 'Prueba', correo: 'inyeccion@casos.test' })
    .expect(201);

  // La tabla clientes sigue existiendo y guarda la cadena como texto literal.
  const [tablas] = await pool.query(
    "SHOW TABLES LIKE 'clientes'"
  );
  assert.equal(tablas.length, 1, 'la tabla clientes no debe eliminarse');

  const [filas] = await pool.query('SELECT nombre FROM clientes WHERE correo = ?', [
    'inyeccion@casos.test',
  ]);
  assert.equal(filas[0].nombre, inyeccion, 'se guarda como texto, sin interpretar');

  await pool.query('DELETE FROM clientes WHERE correo = ?', ['inyeccion@casos.test']);
});

test('la indisponibilidad de MySQL responde 500 con mensaje genérico (FR-020)', async (t) => {
  // Esta prueba NO requiere MySQL: simula un motor caído apuntando el pool a un
  // puerto donde nadie escucha.
  const { fijarPoolParaPruebas } = await import('../../src/config/database.js');
  const { obtenerPool } = await import('../../src/config/database.js');
  const poolSano = obtenerPool();

  const poolCaido = mysql.createPool({
    host: entorno.DB_HOST,
    port: 65000, // puerto cerrado: la conexión fallará
    user: entorno.DB_USER,
    password: entorno.DB_PASSWORD,
    database: entorno.DB_NAME_TEST,
    connectionLimit: 1,
    connectTimeout: 1000,
  });
  fijarPoolParaPruebas(poolCaido);

  try {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ correo: SEMILLA.correo, password: SEMILLA.password })
      .expect(500);

    assert.equal(login.body.codigo, 'INTERNO');
    assert.equal(login.body.mensaje, 'Error interno del servidor');
    const cuerpo = JSON.stringify(login.body);
    assert.ok(!cuerpo.includes('connect'), 'no expone detalles de conexión');
    assert.ok(!cuerpo.includes('ECONN'), 'no expone códigos internos');
  } finally {
    await poolCaido.end();
    // Restaura el pool original (el de pruebas o el de desarrollo).
    const { fijarPoolParaPruebas: fijar } = await import('../../src/config/database.js');
    if (disponible) {
      fijar(poolSano);
    } else {
      fijar(null);
    }
  }
});
