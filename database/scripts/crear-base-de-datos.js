// Crea la base de datos de desarrollo si no existe, con utf8mb4 (FR-023).
// Uso: node database/scripts/crear-base-de-datos.js
// Requiere las variables de entorno DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
import 'dotenv/config';
import mysql from 'mysql2/promise';

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'gym_sistema',
} = process.env;

async function crearBaseDeDatos() {
  const conexion = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    // El nombre de la base de datos no admite parámetros, por eso se escapa con comillas
    // inversas y se valida contra un patrón estricto.
    if (!/^[A-Za-z0-9_]+$/.test(DB_NAME)) {
      throw new Error(`Nombre de base de datos no válido: ${DB_NAME}`);
    }
    await conexion.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
    );
    console.log(`Base de datos "${DB_NAME}" lista.`);
  } finally {
    await conexion.end();
  }
}

crearBaseDeDatos().catch((error) => {
  console.error('No se pudo crear la base de datos:', error.message);
  process.exit(1);
});
