// Pruebas de integración de la historia US-S3-06 (T049): dashboard
// administrativo. Recorrido completo: datos de los tres sprints → indicadores
// coherentes con el origen → periodo por defecto → base vacía en cero →
// recálculo al cambiar el periodo (FR-017).
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

test('US-S3-06: los indicadores coinciden con los datos de origen', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);

  // Prepara un entrenador, una asignación, una rutina, un objetivo cumplido
  // y un progreso dentro del periodo consultado.
  const [cuenta] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Dashboard Entrenador', 'dash-ent@dashboard.test', hash, 'entrenador']
  );
  const entrenador = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_usuario: cuenta.insertId, nombre: 'Dashboard Entrenador' })
    .expect(201);

  const [cliente] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Dashboard', 'Cliente', 'dash-cli@dashboard.test']
  );
  const tokenEntrenador = tokenDePrueba({ id_usuario: cuenta.insertId, rol: 'entrenador' });

  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({
      id_cliente: cliente.insertId,
      id_entrenador: entrenador.body.entrenador.id_entrenador,
    })
    .expect(201);

  await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .send({
      id_cliente: cliente.insertId,
      nombre: 'Rutina dashboard',
      ejercicios: [{ nombre: 'Sentadilla', series: 3, repeticiones: '10' }],
    })
    .expect(201);

  const hoy = new Date().toISOString().slice(0, 10);
  const objetivo = await request(app)
    .post('/api/objetivos')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .send({ id_cliente: cliente.insertId, descripcion: 'Meta del dashboard' })
    .expect(201);
  await request(app)
    .put(`/api/objetivos/${objetivo.body.objetivo.id_objetivo}`)
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .send({ estado: 'cumplido' })
    .expect(200);

  await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .send({ id_cliente: cliente.insertId, fecha: hoy, comentario: 'Progreso dashboard' })
    .expect(201);

  // Periodo que cubre desde el inicio del año hasta hoy.
  const desde = `${new Date().getFullYear()}-01-01`;
  const respuesta = await request(app)
    .get(`/api/dashboard?desde=${desde}&hasta=${hoy}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  // Coherencia directa con los módulos de origen.
  const [origen] = await obtenerPool().query(
    "SELECT COUNT(*) AS total FROM entrenadores WHERE estado = 'activo'"
  );
  assert.equal(
    respuesta.body.entrenadores.activos,
    origen[0].total,
    'el contador de entrenadores activos coincide con la tabla de origen'
  );

  const [asignaciones] = await obtenerPool().query(
    `SELECT COUNT(DISTINCT id_cliente) AS total FROM asignaciones_entrenador
     WHERE estado = 'activa'`
  );
  assert.equal(respuesta.body.asignaciones.con_entrenador, asignaciones[0].total);

  const [rutinas] = await obtenerPool().query(
    "SELECT COUNT(*) AS total FROM rutinas WHERE estado = 'activa'"
  );
  assert.equal(respuesta.body.rutinas.activas, rutinas[0].total);

  assert.ok(respuesta.body.objetivos.cumplidos >= 1, 'el objetivo cumplido se cuenta');
  assert.ok(
    Number(respuesta.body.objetivos.porcentaje_cumplidos) >= 0,
    'el porcentaje es un número válido'
  );
  assert.ok(respuesta.body.progresos.registrados >= 1, 'el progreso del periodo se cuenta');
});

test('US-S3-06: con el periodo por defecto la respuesta es válida y recalcable (FR-017)', async (t) => {
  if (saltar(t)) return;

  const porDefecto = await request(app)
    .get('/api/dashboard')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  const hoy = new Date().toISOString().slice(0, 10);
  assert.equal(porDefecto.periodo.hasta, hoy);
  assert.ok(porDefecto.periodo.desde < hoy, 'por defecto el periodo arranca en el mes anterior');

  // Cambiar el periodo recalcula los indicadores del periodo (nunca tablas
  // de resumen): un periodo lejano no contiene progresos ni objetivos.
  const lejano = await request(app)
    .get('/api/dashboard?desde=2000-01-01&hasta=2000-12-31')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .expect(200);

  assert.equal(lejano.body.progresos.registrados, 0, 'sin progresos en el periodo lejano');
  assert.equal(lejano.body.accesos.recientes, 0, 'sin accesos en el periodo lejano');
  assert.equal(lejano.body.objetivos.cumplidos, 0);
  assert.equal(
    lejano.body.objetivos.porcentaje_cumplidos,
    '0.0',
    'sin objetivos el porcentaje es 0.0 (FR-018)'
  );
  // Los indicadores sin periodo (totales) siguen presentes y en cero o más.
  assert.ok(lejano.body.entrenadores.registrados >= 1, 'los totales no dependen del periodo');
});
