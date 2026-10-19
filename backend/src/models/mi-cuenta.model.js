// Consultas propias del cliente para "Mi cuenta" (T071, US-S2-10; FR-028).
// SEGURIDAD: TODAS las consultas están filtradas por el cliente resuelto desde
// el token (usuarios.cliente_id → clientes); nunca aceptan un id de cliente
// como parámetro, por lo que no es posible consultar datos de terceros
// (cualquier intento responde 403 en la capa de autorización).
import { obtenerPool } from '../config/database.js';

// Membresía efectiva del propio cliente: la más reciente, con el tipo y los
// datos de vigencia (FR-004, US-S2-10 esc. 1).
export async function buscarMembresiaPropia(idCliente) {
  const [filas] = await obtenerPool().query(
    `SELECT m.id_membresia, m.fecha_inicio, m.fecha_fin, m.estado,
            t.nombre AS tipo, t.duracion, t.precio
     FROM membresias m
     INNER JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     WHERE m.id_cliente = ?
     ORDER BY m.id_membresia DESC
     LIMIT 1`,
    [idCliente]
  );
  return filas[0] || null;
}

// Historial de pagos propios (FR-008, US-S2-10 esc. 2).
export async function listarPagosPropios(idCliente) {
  const [filas] = await obtenerPool().query(
    `SELECT p.id_pago, p.monto, p.fecha_pago, p.metodo_pago, t.nombre AS tipo_membresia
     FROM pagos p
     LEFT JOIN membresias m ON m.id_membresia = p.id_membresia
     LEFT JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia
     WHERE p.id_cliente = ?
     ORDER BY p.fecha_pago DESC, p.id_pago DESC`,
    [idCliente]
  );
  return filas;
}

// Suma de los pagos propios (necesaria para el adeudo de FR-007).
export async function sumarPagosPropios(idCliente) {
  const [filas] = await obtenerPool().query(
    'SELECT COALESCE(SUM(monto), 0) AS total FROM pagos WHERE id_cliente = ?',
    [idCliente]
  );
  return Number(filas[0].total);
}

// Accesos propios del cliente (FR-014, US-S2-10 esc. 4).
export async function listarAccesosPropios(idCliente) {
  const [filas] = await obtenerPool().query(
    `SELECT fecha, hora, resultado, motivo
     FROM accesos
     WHERE id_cliente = ?
     ORDER BY fecha DESC, hora DESC, id_acceso DESC
     LIMIT 100`,
    [idCliente]
  );
  return filas;
}
