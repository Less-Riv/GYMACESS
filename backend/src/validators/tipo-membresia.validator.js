// Validación de entrada de tipos de membresía (T011, US-S2-01; FR-001, FR-020).
// Restricciones citadas del modelo de datos:
// - nombre: VARCHAR(100), obligatorio
// - descripcion: VARCHAR(255), opcional
// - duracion: INT UNSIGNED, obligatoria y mayor que 0 (días)
// - precio: DECIMAL(10,2), obligatorio y mayor o igual que 0
// - estado: ENUM('activo','inactivo'), opcional (modificación)
import { ERRORES } from '../utils/respuestas.js';

const LONGITUDES = { nombre: 100, descripcion: 255 };
const ESTADOS = ['activo', 'inactivo'];

function texto(valor, campo, { obligatorio }) {
  if (valor === undefined || valor === null || valor === '') {
    if (obligatorio) throw ERRORES.validacion(`El campo ${campo} es obligatorio`);
    return null;
  }
  if (typeof valor !== 'string') {
    throw ERRORES.validacion(`El campo ${campo} debe ser texto`);
  }
  const limpio = valor.trim();
  if (limpio.length === 0 && obligatorio) {
    throw ERRORES.validacion(`El campo ${campo} es obligatorio`);
  }
  if (limpio.length > LONGITUDES[campo]) {
    throw ERRORES.validacion(`El campo ${campo} no puede exceder ${LONGITUDES[campo]} caracteres`);
  }
  return limpio.length === 0 ? null : limpio;
}

function validarDuracion(valor) {
  const duracion = Number(valor);
  if (!Number.isInteger(duracion) || duracion <= 0) {
    throw ERRORES.validacion('La duración en días debe ser un número entero mayor que 0');
  }
  return duracion;
}

function validarPrecio(valor) {
  const precio = Number(valor);
  if (Number.isNaN(precio) || precio < 0) {
    throw ERRORES.validacion('El precio debe ser un número mayor o igual que 0');
  }
  return precio;
}

function validarEstado(valor) {
  if (valor === undefined || valor === null) return null;
  if (!ESTADOS.includes(valor)) {
    throw ERRORES.validacion(`El estado debe ser uno de: ${ESTADOS.join(', ')}`);
  }
  return valor;
}

export function validarTipoMembresia(body) {
  return {
    nombre: texto(body?.nombre, 'nombre', { obligatorio: true }),
    descripcion: texto(body?.descripcion, 'descripcion', { obligatorio: false }),
    duracion: validarDuracion(body?.duracion),
    precio: validarPrecio(body?.precio),
  };
}

// Para modificación (US-S2-01 esc. 4): solo los campos enviados.
export function validarTipoMembresiaParcial(body) {
  const permitidos = ['nombre', 'descripcion', 'duracion', 'precio', 'estado'];
  const enviados = Object.keys(body || {}).filter((campo) => permitidos.includes(campo));
  if (enviados.length === 0) {
    throw ERRORES.validacion('No hay campos válidos para modificar');
  }

  const datos = {};
  for (const campo of enviados) {
    switch (campo) {
      case 'nombre':
        datos.nombre = texto(body.nombre, 'nombre', { obligatorio: true });
        break;
      case 'descripcion':
        datos.descripcion = texto(body.descripcion, 'descripcion', { obligatorio: false });
        break;
      case 'duracion':
        datos.duracion = validarDuracion(body.duracion);
        break;
      case 'precio':
        datos.precio = validarPrecio(body.precio);
        break;
      case 'estado':
        datos.estado = validarEstado(body.estado);
        break;
      default:
        break;
    }
  }
  return datos;
}
