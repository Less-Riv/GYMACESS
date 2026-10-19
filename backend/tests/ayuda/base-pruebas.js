// Utilidad compartida de pruebas: prepara la base de datos de prueba
// (gym_test), aplica las migraciones y la semilla, y fija el pool de la
// aplicación hacia esa base (research.md D5).
//
// TODOS los archivos de pruebas usan la misma base (gym_test) y la vuelven a
// crear, así que `npm test` ejecuta los archivos con concurrencia 1 y, además,
// este módulo toma un bloqueo en disco: si queda algún proceso de pruebas
// vivo (por ejemplo, uno interrumpido), el siguiente espera su turno en lugar
// de borrar la base a mitad de otra ejecución.
//
// Si MySQL no está disponible, las pruebas se omiten con un mensaje claro en
// lugar de fallar, para que `npm test` siga siendo ejecutable en entornos sin
// el motor instalado.
import mysql from 'mysql2/promise';
import { readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import { entorno } from '../../src/config/entorno.js';
import { fijarPoolParaPruebas, cerrarPool } from '../../src/config/database.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// Bloqueo mutuamente exclusivo entre procesos de pruebas (archivo en el
// directorio temporal del sistema).
const RUTA_BLOQUEO = path.join(os.tmpdir(), 'gimnasio-gym_test.lock');
const ESPERA_MAXIMA_MS = 120_000; // cuánto se espera el turno
const BLOQUEO_CADUCADO_MS = 180_000; // bloqueo huérfano: se toma igual
let bloqueoAdquirido = false;

async function adquirirBloqueo() {
  if (bloqueoAdquirido) return;

  // Si el proceso muere sin liberar, el 'exit' evita dejar el archivo plantado.
  process.once('exit', () => {
    if (bloqueoAdquirido) {
      try {
        rmSync(RUTA_BLOQUEO, { force: true });
      } catch (_error) {
        // Nada que hacer al cerrar el proceso.
      }
    }
  });

  const limite = Date.now() + ESPERA_MAXIMA_MS;
  for (;;) {
    try {
      await writeFile(RUTA_BLOQUEO, String(process.pid), { flag: 'wx' });
      bloqueoAdquirido = true;
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const info = await stat(RUTA_BLOQUEO).catch(() => null);
      if (info && Date.now() - info.mtimeMs > BLOQUEO_CADUCADO_MS) {
        await rm(RUTA_BLOQUEO, { force: true });
        continue;
      }
      if (Date.now() > limite) {
        throw new Error(
          `No se pudo preparar la base de pruebas: '${entorno.DB_NAME_TEST}' está bloqueada ` +
            'por otro proceso durante demasiado tiempo.'
        );
      }
      await new Promise((resolver) => setTimeout(resolver, 250));
    }
  }
}

async function liberarBloqueo() {
  if (!bloqueoAdquirido) return;
  bloqueoAdquirido = false;
  await rm(RUTA_BLOQUEO, { force: true }).catch(() => {});
}

export async function prepararBasePruebas() {
  let conexion;
  await adquirirBloqueo();
  try {
    conexion = await mysql.createConnection({
      host: entorno.DB_HOST,
      port: entorno.DB_PORT,
      user: entorno.DB_USER,
      password: entorno.DB_PASSWORD,
      multipleStatements: true,
    });
  } catch (error) {
    console.warn(
      `\n[pruebas] MySQL no está disponible en ${entorno.DB_HOST}:${entorno.DB_PORT}: ` +
        `${error.message}\n[pruebas] Las pruebas de integración se omiten hasta que el motor esté activo.`
    );
    await liberarBloqueo();
    return false;
  }

  try {
    const base = entorno.DB_NAME_TEST;
    if (!/^[A-Za-z0-9_]+$/.test(base)) {
      throw new Error(`Nombre de base de prueba no válido: ${base}`);
    }
    await conexion.query(`DROP DATABASE IF EXISTS \`${base}\``);
    await conexion.query(
      `CREATE DATABASE \`${base}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
    );
    // La conexión se abrió sin esquema: hay que seleccionar la base de prueba
    // antes de aplicar las migraciones (sin esto MySQL responde "No database
    // selected").
    await conexion.query(`USE \`${base}\``);

    // Aplica las migraciones en orden alfabético (misma lógica que el script).
    const carpetaMigraciones = path.join(RAIZ, 'database', 'migrations');
    const archivos = (await readdir(carpetaMigraciones))
      .filter((archivo) => archivo.endsWith('.sql'))
      .sort();
    for (const archivo of archivos) {
      const sql = await readFile(path.join(carpetaMigraciones, archivo), 'utf8');
      await conexion.query(sql);
    }

    // Semilla del administrador.
    const semilla = await readFile(
      path.join(RAIZ, 'database', 'seeds', 'seed-administrador.sql'),
      'utf8'
    );
    await conexion.query(semilla);

    // Semilla de datos del Sprint 2 (tipos de membresía de ejemplo).
    const semillaSprint2 = await readFile(
      path.join(RAIZ, 'database', 'seeds', 'seed-datos-sprint2.sql'),
      'utf8'
    );
    await conexion.query(semillaSprint2);
  } catch (error) {
    // Algún archivo impidió recrear la base: no retener el turno.
    await liberarBloqueo();
    throw error;
  } finally {
    await conexion.end();
  }

  const poolPruebas = mysql.createPool({
    host: entorno.DB_HOST,
    port: entorno.DB_PORT,
    user: entorno.DB_USER,
    password: entorno.DB_PASSWORD,
    database: entorno.DB_NAME_TEST,
    waitForConnections: true,
    connectionLimit: 5,
    multipleStatements: false,
  });
  fijarPoolParaPruebas(poolPruebas);
  return true;
}

export async function finalizarPruebas() {
  await cerrarPool();
  await liberarBloqueo();
}

// Emite un token JWT de prueba igual al que genera el backend real.
export function tokenDePrueba(payload, opciones = {}) {
  return jwt.sign(payload, entorno.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: opciones.expiracion || '8h',
  });
}

// Credenciales del usuario semilla (documentadas en database/README.md).
export const SEMILLA = {
  correo: 'admin@gimnasio.test',
  password: 'Admin1234!',
};
