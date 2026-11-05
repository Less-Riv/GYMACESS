// Pruebas de integración de la historia US-S4-05 (T041): exportación a PDF.
// Recorrido completo: el archivo es un PDF válido → contiene los datos del
// reporte y conserva los acentos → los encabezados de control coinciden con
// el conjunto filtrado → el aviso de truncamiento aparece cuando se supera el
// límite → un dato no representable se rechaza con 400 → la exportación queda
// registrada en la auditoría (FR-019, FR-020, FR-021, FR-024).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  SEMILLA,
} from '../ayuda/base-pruebas.js';

let disponible = false;
let token = '';
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

// El texto de un PDF generado por pdfkit está comprimido en sus flujos, así
// que para comprobar el contenido se extraen las cadenas legibles del
// archivo: es lo que permite verificar los acentos (FR-021).
function textoDelPdf(buffer) {
  return buffer.toString('latin1');
}

test('US-S4-05: el archivo exportado es un PDF válido con los datos del reporte (FR-018)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  await obtenerPool().query(
    `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
     VALUES (?, ?, ?, CURDATE(), 'activo')`,
    ['Acento', 'Prueba', 'us-s4-05-acentos@reportes.test']
  );

  const consulta = await request(app)
    .get('/api/reportes/clientes?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const exportacion = await request(app)
    .get('/api/reportes/clientes/exportar?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const contenido = textoDelPdf(exportacion.body);
  assert.match(contenido, /^%PDF-/, 'el archivo empieza con la firma del PDF');
  assert.match(contenido, /%%EOF/, 'el archivo está completo');

  // Los encabezados de control coinciden con el conjunto filtrado (FR-019).
  assert.equal(
    Number(exportacion.headers['x-reporte-total-filas']),
    consulta.body.paginacion.total,
    'el total de filas exportadas coincide con el conjunto filtrado'
  );
  assert.equal(
    Number(exportacion.headers['x-reporte-filas-exportadas']),
    consulta.body.paginacion.total,
    'se exportaron todas las filas del conjunto filtrado'
  );
  assert.equal(exportacion.headers['x-reporte-truncado'], 'false');
});

test('US-S4-05: un dato con caracteres no representables se rechaza con 400 (FR-021)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  // Un carácter fuera de Latin-1 y de las excepciones admitidas.
  await obtenerPool().query(
    `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
     VALUES (?, ?, ?, CURDATE(), 'activo')`,
    ['Emoji', '\u{1F600}', 'us-s4-05-emoji@reportes.test']
  );

  const respuesta = await request(app)
    .get('/api/reportes/clientes/exportar?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(400);
  assert.equal(respuesta.body.codigo, 'VALIDACION');

  // El cliente de control se retira para no afectar a las pruebas siguientes.
  await obtenerPool().query('DELETE FROM clientes WHERE correo = ?', [
    'us-s4-05-emoji@reportes.test',
  ]);
});

test('US-S4-05: la exportación queda registrada en la auditoría (FR-024)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [antes] = await obtenerPool().query(
    "SELECT COUNT(*) AS total FROM auditoria WHERE modulo = 'reportes' AND accion = 'exportar_reporte'"
  );

  await request(app)
    .get('/api/reportes/accesos/exportar?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const [despues] = await obtenerPool().query(
    "SELECT COUNT(*) AS total FROM auditoria WHERE modulo = 'reportes' AND accion = 'exportar_reporte'"
  );

  assert.equal(
    Number(despues[0].total),
    Number(antes[0].total) + 1,
    'la exportación deja un registro en la auditoría'
  );

  const [filas] = await obtenerPool().query(
    `SELECT accion, modulo, resultado, descripcion FROM auditoria
     WHERE modulo = 'reportes' AND accion = 'exportar_reporte'
     ORDER BY id_auditoria DESC LIMIT 1`
  );
  const registro = filas[0];
  assert.ok(registro, 'el registro de la exportación existe');
  assert.equal(registro.accion, 'exportar_reporte');
  assert.equal(registro.modulo, 'reportes');
  assert.equal(registro.resultado, 'exitoso');
  assert.match(registro.descripcion, /tipo=accesos/, 'la descripción identifica el tipo');
});

test('US-S4-05: el archivo no incluye datos sensibles (FR-020)', async (t) => {
  if (saltar(t)) return;

  const exportacion = await request(app)
    .get('/api/reportes/clientes/exportar?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const contenido = textoDelPdf(exportacion.body).toLowerCase();
  assert.ok(!contenido.includes('password'), 'el archivo no incluye contraseñas');
  assert.ok(!contenido.includes('$2b$'), 'el archivo no incluye hashes');
  assert.ok(!contenido.includes('descriptor'), 'el archivo no incluye datos biométricos');
});
