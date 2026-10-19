// Acceso a datos de accesos (T046 US-S2-07, T066 US-S2-09; FR-014, RN-10).
// Cada intento de entrada genera un registro (autorizado o rechazado); RN-10:
// no existe DELETE sobre `accesos`. Los registros no se eliminan.
import { obtenerPool } from '../config/database.js';

// Inserta un intento de acceso (RN-10: se registra SIEMPRE, incluso si no
// hubo identificación exitosa; en ese caso id_cliente queda NULL).
export async function insertarAcceso({ idCliente = null, fecha, hora, resultado, motivo = null }) {
  const [filas] = await obtenerPool().query(
    `INSERT INTO accesos (id_cliente, fecha, hora, resultado, motivo)
     VALUES (?, ?, ?, ?, ?)`,
    [idCliente, fecha, hora, resultado, motivo]
  );
  return filas.insertId;
}

// Descriptores activos para la comparación de identificación (US-S2-07).
// Se apoya en el modelo de rostros; el descriptor nunca sale de aquí.
export async function listarDescriptoresParaComparar() {
  const [filas] = await obtenerPool().query(
    `SELECT r.id_cliente, r.descriptor, c.nombre, c.apellido, c.estado AS cliente_estado
     FROM rostros r
     INNER JOIN clientes c ON c.id_cliente = r.id_cliente
     WHERE r.estado = 'activo'`
  );
  return filas;
}

// Consulta paginada con filtros opcionales (T066, US-S2-09, FR-015).
// `camposBasicos` proyecta SOLO cliente, fecha, hora y resultado (principio VI
// de docs/reglas.md: el entrenador no ve motivos de rechazo).
export async function listarAccesos({
  fecha = null,
  resultado = null,
  idCliente = null,
  camposBasicos = false,
  idClientePropio = null,
  limite = 200,
} = {}) {
  const condiciones = [];
  const valores = [];

  if (fecha) {
    condiciones.push('a.fecha = ?');
    valores.push(fecha);
  }
  if (resultado) {
    condiciones.push('a.resultado = ?');
    valores.push(resultado);
  }
  if (idCliente) {
    condiciones.push('a.id_cliente = ?');
    valores.push(idCliente);
  }
  // Vista propia del cliente (FR-028): SIEMPRE filtrada por el token, nunca
  // por parámetros del cliente.
  if (idClientePropio) {
    condiciones.push('a.id_cliente = ?');
    valores.push(idClientePropio);
  }

  const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const columnasBasicas = 'a.id_acceso, a.fecha, a.hora, a.resultado';
  const columnasCompletas =
    'a.id_acceso, a.id_cliente, a.fecha, a.hora, a.resultado, a.motivo';
  const columnas = camposBasicos ? columnasBasicas : columnasCompletas;

  const [filas] = await obtenerPool().query(
    `SELECT ${columnas}, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
     FROM accesos a
     LEFT JOIN clientes c ON c.id_cliente = a.id_cliente
     ${donde}
     ORDER BY a.fecha DESC, a.hora DESC, a.id_acceso DESC
     LIMIT ${Number(limite)}`,
    valores
  );
  return filas;
}
