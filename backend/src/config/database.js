// Pool de conexiones a MySQL con mysql2/promise (research.md D1).
// Todas las consultas del backend usarán este pool con parámetros posicionales (?).
import mysql from 'mysql2/promise';
import { entorno } from './entorno.js';

let pool = null;

export function obtenerPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: entorno.DB_HOST,
      port: entorno.DB_PORT,
      user: entorno.DB_USER,
      password: entorno.DB_PASSWORD,
      database: entorno.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      // Consultas parametrizadas como única forma de ejecutar SQL (FR-015).
      multipleStatements: false,
    });
  }
  return pool;
}

// Permite crear un pool separado para las pruebas con la base de datos de prueba.
export function fijarPoolParaPruebas(nuevoPool) {
  pool = nuevoPool;
}

export async function cerrarPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
