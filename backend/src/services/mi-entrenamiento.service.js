// Lógica de "Mi entrenamiento" (T044, US5; FR-013, FR-014, RN-22).
// El cliente SIEMPRE consulta solo lo propio: el identificador se resuelve
// desde el token autenticado (usuarios.cliente_id), nunca desde un id
// enviado por el navegador (RN-22, misma regla que /api/mi-cuenta).
import * as clienteModelo from '../models/cliente.model.js';
import * as rutinaModelo from '../models/rutina.model.js';
import * as ejercicioModelo from '../models/ejercicio-rutina.model.js';
import * as objetivoModelo from '../models/objetivo.model.js';
import * as progresoModelo from '../models/progreso.model.js';
import * as asignacionModelo from '../models/asignacion.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import { ErrorDeDominio } from '../utils/respuestas.js';

export async function obtenerMiEntrenamiento(idUsuario) {
  const cliente = await clienteModelo.buscarClientePorIdPropio(idUsuario);
  if (!cliente) {
    throw new ErrorDeDominio(
      404,
      'Tu usuario aún no tiene un cliente asociado. Contacta al administrador.',
      'CLIENTE_NO_ASOCIADO'
    );
  }

  // Entrenador responsable: la asignación activa vigente (RN-22).
  const asignacion = await asignacionModelo.buscarAsignacionActivaPorCliente(cliente.id_cliente);
  const entrenador = asignacion
    ? await entrenadorModelo.buscarEntrenadorPorId(asignacion.id_entrenador)
    : null;

  // Rutina activa con sus ejercicios (FR-013).
  const rutinas = await rutinaModelo.listarRutinas({
    clienteId: cliente.id_cliente,
    estado: 'activa',
  });
  const rutinaActiva = rutinas[0] || null;
  const ejercicios = rutinaActiva
    ? await ejercicioModelo.listarEjerciciosPorRutina(rutinaActiva.id_rutina)
    : [];

  const objetivos = await objetivoModelo.listarObjetivos({ clienteId: cliente.id_cliente });
  const progresos = await progresoModelo.listarProgresos({ clienteId: cliente.id_cliente });

  const respuesta = {
    entrenador: entrenador ? { id_entrenador: entrenador.id_entrenador, nombre: entrenador.nombre } : null,
    rutina_activa: rutinaActiva
      ? {
          id_rutina: rutinaActiva.id_rutina,
          nombre: rutinaActiva.nombre,
          descripcion: rutinaActiva.descripcion,
          fecha_actualizacion: rutinaActiva.fecha_actualizacion,
          ejercicios,
        }
      : null,
    objetivos,
    progresos,
  };

  // Mensajes claros cuando no hay datos (FR-014, contrato api-rutinas-progreso).
  if (!rutinaActiva) {
    respuesta.mensaje = 'sin_rutina_asignada';
  }
  if (progresos.length === 0) {
    respuesta.mensaje_progreso = 'sin_progreso_registrado';
  }
  return respuesta;
}
