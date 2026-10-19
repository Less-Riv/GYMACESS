// Acceso a datos de pagos (T038, US-S2-04/US-S2-05; FR-006, FR-007, RN-06).
// RN-06: no existe ninguna sentencia DELETE sobre `pagos`; los historiales no
// se eliminan de manera ordinaria. La fecha la pone el servidor (CURRENT_TIMESTAMP).
import { obtenerPool } from '../config/database.js';

export async function insertarPago({ idCliente, idMembresia, monto, metodoPago }) {
  const [resultado] = await obtenerPool().query(
    `INSERT INTO pagos (id_cliente, id_membresia, monto, metodo_pago)
     VALUES (?, ?, ?, ?)`,
    [idCliente, idMembresia, monto, metodoPago]
  );
  return resultado.insertId;
}

export async function buscarPagoPorId(idPago) {
  const [filas] = await obtenerPool().query('SELECT * FROM pagos WHERE id_pago = ?', [idPago]);
  return filas[0] || null;
}

// Historial cronológico del cliente, con el tipo de la membresía asociada
// (contrato: el pago muestra tipo_membresia).
export async function listarPagosPorCliente(idCliente) {
  const [filas] = await obtenerPool().query(
    `SELECT p.id_pago, p.id_cliente, p.id_membresia, p.monto, p.fecha_pago,
            p.metodo_pago, p.estado, t.nombre AS tipo_membresia
     FROM pagos p
     LEFT JOIN membresias m ON m.id_membresia = p.id_membresia
     LEFT JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     WHERE p.id_cliente = ?
     ORDER BY p.fecha_pago DESC, p.id_pago DESC`,
    [idCliente]
  );
  return filas;
}

// Suma de los pagos registrados del cliente (FR-007: para el cálculo del
// adeudo). Devuelve un decimal como string de MySQL; se normaliza a número.
export async function sumarPagosPorCliente(idCliente) {
  const [filas] = await obtenerPool().query(
    'SELECT COALESCE(SUM(monto), 0) AS total FROM pagos WHERE id_cliente = ?',
    [idCliente]
  );
  return Number(filas[0].total);
}

// Consulta de adeudos para el administrador (US-S2-05): precio vigente del
// tipo de la membresía del cliente menos la suma de sus pagos.
export async function listarAdeudos() {
  const [filas] = await obtenerPool().query(
    `SELECT c.id_cliente,
            CONCAT(c.nombre, ' ', c.apellido) AS nombre_completo,
            t.precio AS precio_membresia,
            COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.id_cliente = c.id_cliente), 0) AS total_pagado,
            m.id_membresia
     FROM clientes c
     INNER JOIN membresias m ON m.id_cliente = c.id_cliente
     INNER JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     WHERE m.estado = 'activo'
     ORDER BY c.id_cliente`
  );
  return filas;
}
