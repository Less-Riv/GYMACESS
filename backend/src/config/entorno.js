// Carga y valida las variables de entorno (FR-021, research.md D6).
// El arranque se aborta con un mensaje claro si falta alguna requerida.
import 'dotenv/config';

const REQUERIDAS = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

function cargarEntorno() {
  // DB_PASSWORD puede ser vacía en instalaciones locales sin contraseña, pero las
  // demás deben estar presentes.
  const faltantes = REQUERIDAS.filter(
    (variable) => process.env[variable] === undefined
  );
  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${faltantes.join(', ')}. ` +
        'Copia backend/.env.example a backend/.env y complétalo.'
    );
  }

  return {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: Number(process.env.DB_PORT),
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    DB_NAME_TEST: process.env.DB_NAME_TEST || 'gym_test',
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRACION: process.env.JWT_EXPIRACION || '8h',
    PORT: Number(process.env.PORT || 3000),
    NODE_ENV: process.env.NODE_ENV || 'desarrollo',
    // Umbral de coincidencia facial (Sprint 2, FR-011, research.md §3).
    // Por defecto, el valor recomendado por la librería; configurable sin
    // cambiar código para afinar con los datos reales del gimnasio.
    FACIAL_UMBRAL: Number(process.env.FACIAL_UMBRAL || 0.5),
  };
}

export const entorno = cargarEntorno();
