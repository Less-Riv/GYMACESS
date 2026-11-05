// Prueba de integración de cierre del MVP (T051, US-S4-07).
// Verifica que el Sprint 4 no rompe lo entregado en el Sprint 3: las seis
// acciones de auditoría de ese sprint siguen registrándose con usuario,
// módulo, fecha, resultado y descripción (FR-020, SC-013 del Sprint 3), y que
// las reglas de negocio nuevas están incorporadas a la documentación
// (FR-030, FR-031).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  prepararBasePruebas,
  finalizarPruebas,
  tokenDePrueba,
  SEMILLA,
} from '../ayuda/base-pruebas.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

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

// Las seis acciones de auditoría del Sprint 3 (FR-020 de esa especificación).
const ACCIONES_SPRINT3 = [
  'asignar_entrenador',
  'reasignar_entrenador',
  'crear_rutina',
  'modificar_rutina',
  'registrar_objetivo',
  'registrar_progreso',
];

test('US-S4-07: las seis acciones de auditoría del Sprint 3 siguen registradas (FR-020)', async (t) => {
  if (saltar(t)) return;

  const bcrypt = (await import('bcrypt')).default;
  const hash = await bcrypt.hash('Entrena1234!', 10);
  const { obtenerPool } = await import('../../src/config/database.js');

  // Dos cuentas de entrenador: la reasignación cambia de uno a otro.
  const cuentas = [];
  for (const nombre of ['Cierre Uno', 'Cierre Dos']) {
    const [cuenta] = await obtenerPool().query(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [`Entrenador ${nombre}`, `${nombre.toLowerCase().replace(' ', '')}@cierre.test`, hash, 'entrenador']
    );
    const creado = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_usuario: cuenta.insertId, nombre: `Entrenador ${nombre}` })
      .expect(201);
    cuentas.push({
      idUsuario: cuenta.insertId,
      idEntrenador: creado.body.entrenador.id_entrenador,
      token: tokenDePrueba({ id_usuario: cuenta.insertId, rol: 'entrenador' }),
    });
  }

  const [cliente] = await obtenerPool().query(
    'INSERT INTO clientes (nombre, apellido, correo) VALUES (?, ?, ?)',
    ['Cierre', 'Cliente', 'cierre-cliente@cierre.test']
  );

  // Asignación y reasignación.
  const asignacion = await request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${token}`)
    .send({ id_cliente: cliente.insertId, id_entrenador: cuentas[0].idEntrenador })
    .expect(201);

  await request(app)
    .put(`/api/asignaciones/${asignacion.body.asignacion.id_asignacion}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ id_entrenador: cuentas[1].idEntrenador })
    .expect(200);

  // Rutina y modificación de rutina.
  const rutina = await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${cuentas[1].token}`)
    .send({
      id_cliente: cliente.insertId,
      nombre: 'Rutina de cierre',
      ejercicios: [{ nombre: 'Sentadilla', series: 3, repeticiones: '10' }],
    })
    .expect(201);

  await request(app)
    .put(`/api/rutinas/${rutina.body.rutina.id_rutina}`)
    .set('Authorization', `Bearer ${cuentas[1].token}`)
    .send({
      id_cliente: cliente.insertId,
      nombre: 'Rutina de cierre modificada',
      ejercicios: [{ nombre: 'Sentadilla', series: 4, repeticiones: '12' }],
    })
    .expect(200);

  // Objetivo y progreso.
  const objetivo = await request(app)
    .post('/api/objetivos')
    .set('Authorization', `Bearer ${cuentas[1].token}`)
    .send({ id_cliente: cliente.insertId, descripcion: 'Meta de cierre' })
    .expect(201);

  await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${cuentas[1].token}`)
    .send({
      id_cliente: cliente.insertId,
      fecha: new Date().toISOString().slice(0, 10),
      comentario: 'Progreso de cierre',
    })
    .expect(201);

  // Cada acción quedó registrada con los cinco campos que exige FR-020.
  const [filas] = await obtenerPool().query(
    `SELECT a.accion, a.modulo, a.fecha, a.resultado, a.descripcion, u.nombre AS usuario
     FROM auditoria a
     INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
     WHERE a.accion IN (?, ?, ?, ?, ?, ?)`,
    ACCIONES_SPRINT3
  );

  for (const accion of ACCIONES_SPRINT3) {
    const registro = filas.find((fila) => fila.accion === accion);
    assert.ok(registro, `la acción ${accion} quedó registrada`);
    assert.ok(registro.usuario, `${accion} identifica al usuario`);
    assert.ok(registro.modulo, `${accion} identifica el módulo`);
    assert.ok(registro.fecha, `${accion} lleva fecha`);
    assert.ok(registro.resultado, `${accion} lleva resultado`);
    assert.ok(registro.descripcion, `${accion} lleva descripción`);
  }
});

test('US-S4-07: las reglas RN-15 a RN-34 están en la documentación del proyecto (FR-030)', async (t) => {
  if (saltar(t)) return;

  const contexto = await readFile(
    path.join(RAIZ, 'docs', 'project-context.md'),
    'utf8'
  );

  const reglas = contexto.match(/^## RN-\d\d\b/gm) || [];
  const numeros = reglas.map((regla) => Number(regla.replace(/\D/g, '')));

  for (let numero = 15; numero <= 34; numero += 1) {
    assert.ok(
      numeros.includes(numero),
      `la regla RN-${String(numero).padStart(2, '0')} no está en docs/project-context.md`
    );
  }
});

test('US-S4-07: la documentación refleja el número real de sprints (FR-031)', async (t) => {
  if (saltar(t)) return;

  const contexto = await readFile(
    path.join(RAIZ, 'docs', 'project-context.md'),
    'utf8'
  );
  const reglas = await readFile(path.join(RAIZ, 'docs', 'reglas.md'), 'utf8');

  assert.match(
    contexto,
    /cuatro sprints/,
    'docs/project-context.md refleja los cuatro sprints del MVP'
  );
  assert.match(
    reglas,
    /cuatro sprints/,
    'docs/reglas.md refleja los cuatro sprints del MVP'
  );
});
