// Aplica las migraciones pendientes de database/migrations/ en orden alfabético
// y las registra en la tabla `esquema_migraciones` (FR-023, research.md D10).
// Uso: node database/scripts/ejecutar-migraciones.js
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CARPETA_MIGRACIONES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../migrations'
);

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'gym_sistema',
} = process.env;

async function ejecutarMigraciones() {
  const conexion = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });

  try {
    await conexion.query(`
      CREATE TABLE IF NOT EXISTS esquema_migraciones (
        nombre VARCHAR(255) NOT NULL PRIMARY KEY,
        fecha_ejecucion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    const [filas] = await conexion.query('SELECT nombre FROM esquema_migraciones');
    const ejecutadas = new Set(filas.map((fila) => fila.nombre));

    const archivos = (await readdir(CARPETA_MIGRACIONES))
      .filter((archivo) => archivo.endsWith('.sql'))
      .sort();

    let aplicadas = 0;
    for (const archivo of archivos) {
      if (ejecutadas.has(archivo)) {
        continue;
      }
      const sql = await readFile(path.join(CARPETA_MIGRACIONES, archivo), 'utf8');
      await conexion.query(sql);
      await conexion.query('INSERT INTO esquema_migraciones (nombre) VALUES (?)', [
        archivo,
      ]);
      console.log(`Migración aplicada: ${archivo}`);
      aplicadas += 1;
    }

    console.log(
      aplicadas === 0
        ? 'No hay migraciones pendientes.'
        : `Se aplicaron ${aplicadas} migración(es).`
    );
  } finally {
    await conexion.end();
  }
}

ejecutarMigraciones().catch((error) => {
  console.error('No se pudieron ejecutar las migraciones:', error.message);
  process.exit(1);
});
