// Acceso a datos de la tabla ejercicios_rutina (T026, US3; FR-008, RN-18).
// La lista se reemplaza en su conjunto desde el frontend (PUT de ejercicios).
import { obtenerPool } from '../config/database.js';

function base(conexion) {
  return conexion ?? obtenerPool();
}

export async function crearEjercicio(
  { id_rutina, nombre, series, repeticiones, carga, instrucciones, orden },
  conexion
) {
  const [resultado] = await base(conexion).query(
    `INSERT INTO ejercicios_rutina
       (id_rutina, nombre, series, repeticiones, carga, instrucciones, orden)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id_rutina, nombre, series, repeticiones, carga, instrucciones, orden]
  );
  return resultado.insertId;
}

// Reemplazo en bloque dentro de la misma transacción que la rutina.
export async function reemplazarEjercicios(idRutina, ejercicios, conexion) {
  await base(conexion).query('DELETE FROM ejercicios_rutina WHERE id_rutina = ?', [idRutina]);
  let orden = 1;
  for (const ejercicio of ejercicios) {
    await crearEjercicio({ ...ejercicio, id_rutina: idRutina, orden }, conexion);
    orden += 1;
  }
}

// Devuelve los ejercicios de varias rutinas en una sola consulta parametrizada.
export async function listarEjerciciosPorRutinas(idsRutinas, conexion) {
  if (idsRutinas.length === 0) return [];
  const placeholders = idsRutinas.map(() => '?').join(', ');
  const [filas] = await base(conexion).query(
    `SELECT * FROM ejercicios_rutina
     WHERE id_rutina IN (${placeholders})
     ORDER BY id_rutina, orden`,
    idsRutinas
  );
  return filas;
}

// Para la vista propia del cliente: ejercicios de UNA rutina (FR-013).
export async function listarEjerciciosPorRutina(idRutina) {
  const [filas] = await obtenerPool().query(
    'SELECT * FROM ejercicios_rutina WHERE id_rutina = ? ORDER BY orden',
    [idRutina]
  );
  return filas;
}
