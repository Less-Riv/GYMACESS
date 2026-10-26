// Pruebas de integración de la historia US-S3-02 (T016): asignación y
// reasignación de entrenador a cliente. Recorrido completo: asignación →
// unicidad de la activa → reasignación con cierre → pérdida de acceso del
// entrenador anterior (RN-19) → auditoría (FR-020).
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

async function crearCuenta(correo, rol, hash) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [resultado] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    [`Integración ${rol}`, correo, hash, rol]
  );
  return resultado.insertId;
}

async function crearFicha(correo, nombre, tokenAdmin) {
  const idUsuario = await crearCuenta(correo, 'entrenador', 'x');
  const respuesta = await request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ id_usuario: idUsuario, nombre });
  return {
    idEntrenador: respuesta.body.entrenador.id_entrenador,
    idUsuario,
  };
}

async function crearCliente(correo) {
  const { obtenerPool } = await import('../../src/config/database.js');
  const [resultado] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Integración', 'Asignación', correo]
  );
  return resultado.insertId;
}

before(async () => {
  disponible = await prepararBasePruebas();
  if (!disponible) return;

  const { obtenerPool } = await import('../../src/config/database.js');
  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Prueba1234!', 10);

  const [recepcion] = await obtenerPool().query(
    'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
    ['Integración recepcionista', 'recepcion@asignacion-us2.test', hash, 'recepcionista']
  );
  tokens.recepcionista = tokenDePrueba({ id_usuario: recepcion.insertId, rol: 'recepcionista' });

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

test('US-S3-02: asignación, reasignación con cierre y pérdida de acceso del entrenador anterior', async (t) => {
  if (saltar(t)) return;

  const ana = await crearFicha('ana@asignacion-us2.test', 'Ana López', tokens.administrador);
  const luis = await crearFicha('luis@asignacion-us2.test', 'Luis Sánchez', tokens.administrador);
  const idCliente = await crearCliente('cliente@asignacion-us2.test');

  // 1) El recepcionista asigna a Ana (esc. 1).
  const asignacion = await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.recepcionista}`)
    .send({ id_cliente: idCliente, id_entrenador: ana.idEntrenador })
    .expect(201);

  // 2) Ana puede gestionar la carga de ese cliente (RN-19).
  const tokenAna = tokenDePrueba({ id_usuario: ana.idUsuario, rol: 'entrenador' });
  const cargaAna = await request(app)
    .get('/api/asignaciones')
    .set('Authorization', `Bearer ${tokenAna}`)
    .expect(200);
  assert.equal(cargaAna.body.asignaciones.length, 1, 'Ana ve exactamente a su cliente');

  // 3) El administrador reasigna a Luis (esc. 5).
  await request(app)
    .put(`/api/asignaciones/${asignacion.body.asignacion.id_asignacion}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_entrenador: luis.idEntrenador })
    .expect(200);

  // 4) Ana PIERDE el acceso: su carga queda vacía (esc. 6; RN-19).
  const cargaAnaDespues = await request(app)
    .get('/api/asignaciones')
    .set('Authorization', `Bearer ${tokenAna}`)
    .expect(200);
  assert.equal(
    cargaAnaDespues.body.asignaciones.length,
    0,
    'la entrenadora anterior pierde el acceso al cliente'
  );

  // 5) Luis recibe al cliente en su carga.
  const tokenLuis = tokenDePrueba({ id_usuario: luis.idUsuario, rol: 'entrenador' });
  const cargaLuis = await request(app)
    .get('/api/asignaciones')
    .set('Authorization', `Bearer ${tokenLuis}`)
    .expect(200);
  assert.equal(cargaLuis.body.asignaciones.length, 1);

  // 6) El histórico queda intacto (RN-17): una cerrada con fecha y una activa.
  const { obtenerPool } = await import('../../src/config/database.js');
  const [historico] = await obtenerPool().query(
    'SELECT * FROM asignaciones_entrenador WHERE id_cliente = ? ORDER BY id_asignacion',
    [idCliente]
  );
  assert.equal(historico.length, 2, 'el histórico nunca se elimina');
  assert.equal(historico[0].estado, 'cerrada');
  assert.ok(historico[0].fecha_fin, 'la cerrada conserva fecha_fin');
  assert.equal(historico[1].estado, 'activa');

  // 7) Auditoría de ambas acciones (FR-020, esc. 7).
  const [auditoria] = await obtenerPool().query(
    `SELECT accion, modulo FROM auditoria
     WHERE accion IN ('asignar_entrenador', 'reasignar_entrenador')
     ORDER BY id_auditoria DESC LIMIT 2`
  );
  assert.deepEqual(
    auditoria.map((fila) => fila.accion).sort(),
    ['asignar_entrenador', 'reasignar_entrenador']
  );
  assert.ok(auditoria.every((fila) => fila.modulo === 'asignaciones'));
});

test('US-S3-02: la baja del entrenador cierra sus asignaciones en la misma operación (esc. 4)', async (t) => {
  if (saltar(t)) return;

  const carlos = await crearFicha('carlos@asignacion-us2.test', 'Carlos Ruiz', tokens.administrador);
  const idCliente = await crearCliente('cliente-baja@asignacion-us2.test');

  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_entrenador: carlos.idEntrenador })
    .expect(201);

  // Baja lógica del entrenador (FR-001).
  await request(app)
    .put(`/api/entrenadores/${carlos.idEntrenador}`)
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ estado: 'inactivo' })
    .expect(200);

  const { obtenerPool } = await import('../../src/config/database.js');
  const [asignaciones] = await obtenerPool().query(
    'SELECT * FROM asignaciones_entrenador WHERE id_entrenador = ?',
    [carlos.idEntrenador]
  );
  assert.equal(asignaciones.length, 1, 'el histórico se conserva');
  assert.equal(asignaciones[0].estado, 'cerrada', 'la asignación queda cerrada');
  assert.ok(asignaciones[0].fecha_fin, 'con fecha de fin registrada');

  // El cliente queda pendiente de asignación: puede recibir otro entrenador.
  const nuevo = await crearFicha('nuevo@asignacion-us2.test', 'Nuevo Entrenador', tokens.administrador);
  await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${tokens.administrador}`)
    .send({ id_cliente: idCliente, id_entrenador: nuevo.idEntrenador })
    .expect(201);
});
