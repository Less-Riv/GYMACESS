// Pruebas de integración de la historia US-S4-06 (T047): auditoría de
// reportes. Recorrido completo: la generación y la exportación dejan registro
// → el registro lleva usuario, módulo, fecha, resultado y descripción → un
// intento denegado por permisos se registra con resultado 'rechazado' → una
// petición sin token NO se registra (no hay usuario al que atribuirla) → la
// descripción identifica el tipo y los filtros (FR-023, FR-024, FR-025).
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
let token = '';
let tokenRecepcionista = '';
const app = crearApp();

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const login = await request(app)
    .post('/api/auth/login')
    .send({ correo: SEMILLA.correo, password: SEMILLA.password });
  token = login.body.token;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [creado] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Recepcionista', 'recepcionista@auditoria-reportes.test', 'x', 'recepcionista']
  );
  tokenRecepcionista = tokenDePrueba({
    id_usuario: creado.insertId,
    rol: 'recepcionista',
  });
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

async function registrosDeReportes(accion) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [filas] = await obtenerPool().query(
    `SELECT a.accion, a.modulo, a.resultado, a.descripcion, a.fecha, u.nombre AS usuario
     FROM auditoria a
     INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
     WHERE a.modulo = 'reportes' ${accion ? 'AND a.accion = ?' : ''}
     ORDER BY a.id_auditoria DESC`,
    accion ? [accion] : []
  );
  return filas;
}

test('US-S4-06: la generación deja registro con usuario, módulo, fecha, resultado y descripción (FR-023)', async (t) => {
  if (saltar(t)) return;

  const antes = await registrosDeReportes('generar_reporte');

  await request(app)
    .get('/api/reportes/membresias?desde=2025-01-01&hasta=2025-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const despues = await registrosDeReportes('generar_reporte');
  assert.equal(despues.length, antes.length + 1, 'se añade un registro');

  const registro = despues[0];
  assert.equal(registro.accion, 'generar_reporte');
  assert.equal(registro.modulo, 'reportes');
  assert.equal(registro.resultado, 'exitoso');
  assert.ok(registro.usuario, 'el registro identifica al usuario');
  assert.ok(registro.fecha, 'el registro lleva fecha');
  assert.match(
    registro.descripcion,
    /tipo=membresias; desde=2025-01-01; hasta=2025-12-31/,
    'la descripción lleva el tipo y los filtros aplicados'
  );
});

test('US-S4-06: la exportación deja su propio registro (FR-024)', async (t) => {
  if (saltar(t)) return;

  const antes = await registrosDeReportes('exportar_reporte');

  await request(app)
    .get('/api/reportes/accesos/exportar?desde=2025-01-01&hasta=2025-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const despues = await registrosDeReportes('exportar_reporte');
  assert.equal(despues.length, antes.length + 1, 'se añade un registro');
  assert.equal(despues[0].accion, 'exportar_reporte');
  assert.equal(despues[0].modulo, 'reportes');
  assert.equal(despues[0].resultado, 'exitoso');
  assert.match(despues[0].descripcion, /tipo=accesos/);
});

test('US-S4-06: un intento denegado se registra con resultado rechazado (US-S4-06 esc. 5)', async (t) => {
  if (saltar(t)) return;

  const antes = await registrosDeReportes('generar_reporte');

  await request(app)
    .get('/api/reportes/clientes')
    .set('Authorization', `Bearer ${tokenRecepcionista}`)
    .expect(403);

  const despues = await registrosDeReportes('generar_reporte');
  assert.equal(despues.length, antes.length + 1, 'el intento denegado deja registro');
  assert.equal(despues[0].resultado, 'rechazado', 'el resultado es rechazado');
  assert.match(despues[0].descripcion, /tipo=clientes/);
});

test('US-S4-06: una petición sin token no deja registro (no hay usuario al que atribuirla)', async (t) => {
  if (saltar(t)) return;

  const antes = await registrosDeReportes();

  await request(app).get('/api/reportes/clientes').expect(401);

  const despues = await registrosDeReportes();
  assert.equal(
    despues.length,
    antes.length,
    'sin token no se registra ningún intento'
  );
});
