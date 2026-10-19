// Controlador del punto de acceso (T048 US-S2-07, T067 US-S2-09).
import * as accesoService from '../services/acceso-facial.service.js';
import * as accesoModelo from '../models/acceso.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import { validarDescriptor } from '../validators/rostro.validator.js';
import { responderExito, ERRORES } from '../utils/respuestas.js';

// Normaliza un DATE de MySQL (objeto Date o string) a AAAA-MM-DD para que el
// contrato devuelva siempre texto.
function aFechaISO(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  return new Date(valor).toISOString().slice(0, 10);
}

function presentarAcceso(fila, { camposBasicos = false } = {}) {
  return {
    id_acceso: fila.id_acceso,
    fecha: aFechaISO(fila.fecha),
    hora: fila.hora,
    resultado: fila.resultado,
    // El motivo solo se expone en la vista completa (principio VI).
    ...(camposBasicos ? {} : { motivo: fila.motivo }),
    ...(fila.id_cliente
      ? {
          cliente: {
            id_cliente: fila.id_cliente,
            nombre: fila.cliente_nombre,
            apellido: fila.cliente_apellido,
          },
        }
      : { cliente: null }),
  };
}

// Identificación en el punto de acceso (US-S2-07/US-S2-08).
export async function identificar(req, res, siguiente) {
  try {
    const descriptor = validarDescriptor(req.body?.descriptor);
    const resultado = await accesoService.procesarAcceso(descriptor, req.usuario);
    return responderExito(res, 200, resultado);
  } catch (error) {
    return siguiente(error);
  }
}

// Listado completo con filtros (US-S2-09): administrador y recepcionista.
export async function listarAccesos(req, res, siguiente) {
  try {
    const filas = await accesoModelo.listarAccesos({
      fecha: req.query.fecha || null,
      resultado: req.query.resultado || null,
      idCliente: req.query.cliente_id ? Number(req.query.cliente_id) : null,
    });
    return responderExito(res, 200, {
      accesos: filas.map((fila) => presentarAcceso(fila)),
    });
  } catch (error) {
    return siguiente(error);
  }
}

// Vista básica para el entrenador (principio VI): cliente, fecha, hora y
// resultado; sin motivos de rechazo.
export async function listarAccesosBasicos(_req, res, siguiente) {
  try {
    const filas = await accesoModelo.listarAccesos({ camposBasicos: true });
    return responderExito(res, 200, {
      accesos: filas.map((fila) => presentarAcceso(fila, { camposBasicos: true })),
    });
  } catch (error) {
    return siguiente(error);
  }
}

// Accesos propios del cliente autenticado (FR-028, US-S2-10): SIEMPRE filtrado
// por el token; jamás por parámetros (no se pueden ver accesos ajenos).
export async function listarMisAccesos(req, res, siguiente) {
  try {
    const cliente = await clienteModelo.buscarClientePorIdPropio(req.usuario.id_usuario);
    if (!cliente) {
      throw ERRORES.noEncontrado('Cliente');
    }
    const filas = await accesoModelo.listarAccesos({ idClientePropio: cliente.id_cliente });
    return responderExito(res, 200, {
      accesos: filas.map((fila) => presentarAcceso(fila)),
    });
  } catch (error) {
    return siguiente(error);
  }
}
