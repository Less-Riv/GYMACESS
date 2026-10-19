// Servicio del punto de acceso (T047 US-S2-07, T052/T053 US-S2-08; FR-011 a
// FR-014, FR-016).
//
// Flujo distintivo del sprint: identificar → validar membresía → autorizar o
// rechazar → registrar SIEMPRE el intento (RN-10).
//
// Identificación (research.md §1, §3): comparación por distancia euclidiana
// entre el descriptor capturado (128 floats) y los descriptores registrados.
// Si la menor distancia supera el umbral FACIAL_UMBRAL (0.5 por defecto) no
// identifica a nadie (FR-011, FR-012). Los reintentos son ilimitados.
//
// SEGURIDAD (research.md §6): los descriptores jamás salen de este módulo; la
// auditoría registra solo identificadores y resultados, nunca datos
// biométricos (FR-016).
import * as accesoModelo from '../models/acceso.model.js';
import * as membresiaModelo from '../models/membresia.model.js';
import * as auditor from './auditoria.service.js';
import { entorno } from '../config/entorno.js';

// Motivos de rechazo del catálogo (FR-013, RN-09).
export const MOTIVOS = {
  NO_RECONOCIDO: 'identificacion_no_reconocida',
  MEMBRESIA_INEXISTENTE: 'membresia_inexistente',
  MEMBRESIA_VENCIDA: 'membresia_vencida',
  MEMBRESIA_SUSPENDIDA: 'membresia_suspendida',
  MEMBRESIA_CANCELADA: 'membresia_cancelada',
};

const MENSAJE_NO_RECONOCIDO =
  'No se reconoció tu rostro. Intenta de nuevo o consulta al personal.';

// Distancia euclidiana entre dos descriptores de la misma dimensión.
export function distanciaEuclidiana(a, b) {
  const suma = a.reduce((acumulado, valor, indice) => {
    const diferencia = valor - b[indice];
    return acumulado + diferencia * diferencia;
  }, 0);
  return Math.sqrt(suma);
}

// Fecha y hora actuales del servidor, en los formatos del contrato.
function ahora() {
  const ahoraDate = new Date();
  return {
    fecha: ahoraDate.toISOString().slice(0, 10),
    hora: ahoraDate.toTimeString().slice(0, 8),
  };
}

// Compara el descriptor contra los registrados y devuelve el mejor candidato
// (o null si ninguno queda dentro del umbral).
async function identificarDescriptor(descriptor) {
  const registrados = await accesoModelo.listarDescriptoresParaComparar();
  let mejor = null;

  for (const fila of registrados) {
    const guardado = JSON.parse(fila.descriptor);
    const distancia = distanciaEuclidiana(descriptor, guardado);
    if (!mejor || distancia < mejor.distancia) {
      mejor = { fila, distancia };
    }
  }

  if (!mejor || mejor.distancia > entorno.FACIAL_UMBRAL) {
    return null;
  }
  return mejor;
}

// Valida la membresía del cliente identificado (T052, US-S2-08).
// Solo se invoca tras identificación exitosa (RN-09). Autoriza únicamente con
// membresía activa y vigente, sin tolerancia tras el vencimiento (Q1).
async function validarMembresia(idCliente) {
  const membresias = await membresiaModelo.listarMembresiasPorCliente(idCliente);
  const membresia = membresias[0];

  if (!membresia) {
    return { autorizado: false, motivo: MOTIVOS.MEMBRESIA_INEXISTENTE };
  }

  // El estado efectivo deriva de la vigencia al momento de consultar (FR-004).
  const estado = membresia.estado;
  const hoy = new Date().toISOString().slice(0, 10);
  const fechaFin =
    typeof membresia.fecha_fin === 'string'
      ? membresia.fecha_fin.slice(0, 10)
      : new Date(membresia.fecha_fin).toISOString().slice(0, 10);

  if (estado === 'activo' && fechaFin >= hoy) {
    return { autorizado: true, membresia };
  }
  if (estado === 'activo') {
    return { autorizado: false, motivo: MOTIVOS.MEMBRESIA_VENCIDA };
  }
  if (estado === 'suspendida') {
    return { autorizado: false, motivo: MOTIVOS.MEMBRESIA_SUSPENDIDA };
  }
  if (estado === 'cancelada') {
    return { autorizado: false, motivo: MOTIVOS.MEMBRESIA_CANCELADA };
  }
  // vencida almacenada u otro estado: no autoriza.
  return { autorizado: false, motivo: MOTIVOS.MEMBRESIA_VENCIDA };
}

// Punto de entrada del control de acceso (T048/T052/T053).
export async function procesarAcceso(descriptor, usuario) {
  const { fecha, hora } = ahora();

  const coincidencia = await identificarDescriptor(descriptor);

  // Sin identificación exitosa NO se valida membresía (RN-09): se registra el
  // intento como rechazado y se responde con el mensaje de reintento.
  if (!coincidencia) {
    await accesoModelo.insertarAcceso({
      idCliente: null,
      fecha,
      hora,
      resultado: 'rechazado',
      motivo: MOTIVOS.NO_RECONOCIDO,
    });
    await auditor.registrarAccion(
      usuario.id_usuario,
      'control de acceso',
      'accesos',
      'rechazado',
      `Intento de acceso sin identificación (${fecha} ${hora})`
    );
    return {
      identificado: false,
      autorizado: false,
      motivo: MOTIVOS.NO_RECONOCIDO,
      mensaje: MENSAJE_NO_RECONOCIDO,
    };
  }

  const { fila } = coincidencia;
  // Un cliente inactivo no puede entrar aunque su rostro esté registrado.
  const validacion =
    fila.cliente_estado === 'activo'
      ? await validarMembresia(fila.id_cliente)
      : { autorizado: false, motivo: MOTIVOS.MEMBRESIA_INEXISTENTE };

  // RN-10: SIEMPRE se registra el intento, autorizado o no.
  await accesoModelo.insertarAcceso({
    idCliente: fila.id_cliente,
    fecha,
    hora,
    resultado: validacion.autorizado ? 'autorizado' : 'rechazado',
    motivo: validacion.autorizado ? null : validacion.motivo,
  });

  // FR-016 (T053): auditoría de cada resultado del control de acceso.
  await auditor.registrarAccion(
    usuario.id_usuario,
    'control de acceso',
    'accesos',
    validacion.autorizado ? 'autorizado' : 'rechazado',
    `Cliente ${fila.id_cliente}: ${validacion.autorizado ? 'acceso autorizado' : validacion.motivo}`
  );

  return {
    identificado: true,
    autorizado: validacion.autorizado,
    ...(validacion.autorizado ? {} : { motivo: validacion.motivo }),
    cliente: { id_cliente: fila.id_cliente, nombre: fila.nombre, apellido: fila.apellido },
  };
}
