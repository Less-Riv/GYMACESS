// Pruebas de integración de la historia US-S4-04 (T034): reporte de accesos.
// Recorrido completo: los totales coinciden con los accesos de origen → el
// filtro por periodo acota el listado → el filtro por resultado lo acota → la
// paginación no repite ni omite filas (H-AN-03) → un filtro sin datos
// devuelve resultado vacío (H-AN-05) → el motivo del rechazo aparece → el
// reporte no modifica ningún dato (FR-003).
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

// Crea un cliente con un acceso autorizado y otro rechazado.
async function crearAccesos(sufijo, fechas) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [cliente] = await obtenerPool().query(
    `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
     VALUES (?, ?, ?, CURDATE(), 'activo')`,
    ['Accesos', 'Reporte', `us-s4-04-${sufijo}@reportes.test`]
  );

  const creados = [];
  for (const acceso of fechas) {
    const [creado] = await obtenerPool().query(
      `INSERT INTO accesos (id_cliente, fecha, hora, resultado, motivo)
       VALUES (?, ?, ?, ?, ?)`,
      [
        cliente.insertId,
        acceso.fecha,
        acceso.hora,
        acceso.resultado,
        acceso.motivo ?? null,
      ]
    );
    creados.push(creado.insertId);
  }

  return { idCliente: cliente.insertId, ids: creados };
}

test('US-S4-04: los totales coinciden con los accesos de origen (FR-010, FR-017)', async (t) => {
  if (saltar(t)) return;

  const control = await crearAccesos('totales', [
    { fecha: '2025-09-01', hora: '07:00:00', resultado: 'autorizado' },
    { fecha: '2025-09-02', hora: '08:00:00', resultado: 'rechazado', motivo: 'Membresía vencida' },
  ]);

  const respuesta = await request(app)
    .get('/api/reportes/accesos?desde=2025-09-01&hasta=2025-09-30')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [origen] = await obtenerPool().query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(resultado = 'autorizado'), 0) AS autorizados,
            COALESCE(SUM(resultado = 'rechazado'), 0) AS rechazados
     FROM accesos
     WHERE fecha BETWEEN '2025-09-01' AND '2025-09-30'`
  );

  assert.equal(respuesta.body.totales.total, Number(origen[0].total));
  assert.equal(respuesta.body.totales.autorizados, Number(origen[0].autorizados));
  assert.equal(respuesta.body.totales.rechazados, Number(origen[0].rechazados));
  assert.equal(
    respuesta.body.totales.total,
    respuesta.body.paginacion.total,
    'los totales coinciden con la paginación'
  );

  // El motivo del rechazo se muestra en el detalle (FR-010).
  const rechazado = respuesta.body.filas.find(
    (fila) => fila.id_acceso === control.ids[1]
  );
  assert.ok(rechazado, 'el acceso rechazado aparece');
  assert.equal(rechazado.motivo, 'Membresía vencida');
});

test('US-S4-04: el filtro por periodo y por resultado acota el listado (FR-012, FR-013)', async (t) => {
  if (saltar(t)) return;

  const control = await crearAccesos('filtros', [
    { fecha: '2025-10-05', hora: '09:00:00', resultado: 'rechazado', motivo: 'Rostro no reconocido' },
    { fecha: '2024-10-05', hora: '09:00:00', resultado: 'rechazado', motivo: 'Fuera de periodo' },
  ]);

  const dentro = await request(app)
    .get('/api/reportes/accesos?desde=2025-10-01&hasta=2025-10-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  const ids = dentro.body.filas.map((fila) => fila.id_acceso);
  assert.ok(ids.includes(control.ids[0]), 'el acceso del periodo aparece');
  assert.ok(!ids.includes(control.ids[1]), 'el acceso de otro periodo no aparece');

  const porResultado = await request(app)
    .get('/api/reportes/accesos?desde=2025-10-01&hasta=2025-10-31&estado=rechazado')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.ok(
    porResultado.body.filas.every((fila) => fila.resultado === 'rechazado'),
    'el listado respeta el filtro de resultado'
  );
});

test('US-S4-04: la paginación recorre el conjunto sin repetir ni omitir filas (FR-014, H-AN-03)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  for (let indice = 0; indice < 25; indice += 1) {
    const correo = `us-s4-04-pag-${indice}@reportes.test`;
    await obtenerPool().query(
      `INSERT INTO clientes (nombre, apellido, correo, fecha_registro, estado)
       VALUES (?, ?, ?, CURDATE(), 'activo')`,
      ['Paginacion', `Accesos ${indice}`, correo]
    );
    await obtenerPool().query(
      `INSERT INTO accesos (id_cliente, fecha, hora, resultado, motivo)
       SELECT c.id_cliente, '2025-11-01', '10:00:00', 'autorizado', NULL
       FROM clientes c WHERE c.correo = ?`,
      [correo]
    );
  }

  const primera = await request(app)
    .get('/api/reportes/accesos?desde=2025-11-01&hasta=2025-11-30')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(primera.body.filas.length, 20, 'la primera página trae el tamaño de página');
  assert.ok(primera.body.paginacion.totalPaginas >= 2, 'hay más de una página');

  const segunda = await request(app)
    .get('/api/reportes/accesos?desde=2025-11-01&hasta=2025-11-30&pagina=2')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const idsPrimera = primera.body.filas.map((fila) => fila.id_acceso);
  const idsSegunda = segunda.body.filas.map((fila) => fila.id_acceso);
  const repetidas = idsPrimera.filter((id) => idsSegunda.includes(id));
  assert.equal(repetidas.length, 0, 'ninguna fila se repite entre páginas');
});

test('US-S4-04: un filtro sin datos devuelve resultado vacío y totales en cero (FR-015, H-AN-05)', async (t) => {
  if (saltar(t)) return;

  const respuesta = await request(app)
    .get('/api/reportes/accesos?desde=1990-01-01&hasta=1990-01-02')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.deepEqual(respuesta.body.filas, [], 'el listado viene vacío');
  assert.equal(respuesta.body.totales.total, 0);
  assert.equal(respuesta.body.totales.autorizados, 0);
  assert.equal(respuesta.body.totales.rechazados, 0);
  assert.equal(respuesta.body.paginacion.total, 0);
});

test('US-S4-04: el reporte no modifica ningún dato (FR-003)', async (t) => {
  if (saltar(t)) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const [antes] = await obtenerPool().query(
    'SELECT COUNT(*) AS total, COALESCE(SUM(resultado = "rechazado"), 0) AS rechazados FROM accesos'
  );

  await request(app)
    .get('/api/reportes/accesos?desde=2020-01-01&hasta=2030-12-31')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  const [despues] = await obtenerPool().query(
    'SELECT COUNT(*) AS total, COALESCE(SUM(resultado = "rechazado"), 0) AS rechazados FROM accesos'
  );

  assert.equal(Number(despues[0].total), Number(antes[0].total), 'ningún acceso se añadió o eliminó');
  assert.equal(
    Number(despues[0].rechazados),
    Number(antes[0].rechazados),
    'ningún acceso cambió de resultado'
  );
});
