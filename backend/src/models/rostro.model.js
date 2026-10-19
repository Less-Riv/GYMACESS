// Acceso a datos de rostros (T029, US-S2-06/US-S2-07; FR-017, FR-019).
// El descriptor facial (arreglo JSON de 128 números) NUNCA se incluye en las
// consultas de respuesta: solo su estado de registro. Solo acceso-facial
// (US-S2-07) lo lee internamente para comparar.
// Un registro por cliente (índice único uq_rostros_cliente): re-capturar
// actualiza, nunca duplica (upsert).
import { obtenerPool } from '../config/database.js';

// Upsert por id_cliente (REPLACE no se usa para no perder el id estable).
export async function guardarDescriptor(idCliente, descriptorJSON) {
  const [resultado] = await obtenerPool().query(
    `INSERT INTO rostros (id_cliente, descriptor)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE descriptor = VALUES(descriptor),
                              fecha_registro = CURRENT_TIMESTAMP,
                              estado = 'activo'`,
    [idCliente, descriptorJSON]
  );
  return resultado.affectedRows > 0;
}

// Estado del registro facial sin exponer el descriptor (FR-017).
export async function buscarEstadoPorCliente(idCliente) {
  const [filas] = await obtenerPool().query(
    `SELECT id_rostro, id_cliente, fecha_registro, estado
     FROM rostros WHERE id_cliente = ?`,
    [idCliente]
  );
  return filas[0] || null;
}

// SOLO para la comparación interna de identificación (US-S2-07). Nunca se
// usa en una respuesta de la API.
export async function listarDescriptoresActivos() {
  const [filas] = await obtenerPool().query(
    `SELECT r.id_cliente, r.descriptor, c.nombre, c.apellido, c.estado AS cliente_estado
     FROM rostros r
     INNER JOIN clientes c ON c.id_cliente = r.id_cliente
     WHERE r.estado = 'activo'`
  );
  return filas;
}
