// Validación de entrada de clientes (T031, US2, FR-013; data-model.md).
// Restricciones citadas del modelo de datos:
// - nombre: VARCHAR(100), obligatorio
// - apellido: VARCHAR(100), obligatorio
// - correo: VARCHAR(150), obligatorio y con formato válido (único en MySQL)
// - telefono: VARCHAR(20), opcional
// - direccion: VARCHAR(200), opcional
import { ERRORES } from '../utils/respuestas.js';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LONGITUDES = {
  nombre: 100,
  apellido: 100,
  correo: 150,
  telefono: 20,
  direccion: 200,
};

function validarCampoTexto(valor, campo, { obligatorio }) {
  if (valor === undefined || valor === null || valor === '') {
    if (obligatorio) {
      throw ERRORES.validacion(`El campo ${campo} es obligatorio`);
    }
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
    throw ERRORES.validacion(
      `El campo ${campo} no puede exceder ${LONGITUDES[campo]} caracteres`
    );
  }
  return limpio.length === 0 ? null : limpio;
}

export function validarCliente(body) {
  const nombre = validarCampoTexto(body?.nombre, 'nombre', { obligatorio: true });
  const apellido = validarCampoTexto(body?.apellido, 'apellido', { obligatorio: true });

  const correoCrudo = validarCampoTexto(body?.correo, 'correo', { obligatorio: true });
  if (!FORMATO_CORREO.test(correoCrudo)) {
    throw ERRORES.validacion('El correo tiene un formato inválido');
  }

  return {
    nombre,
    apellido,
    correo: correoCrudo.toLowerCase(),
    telefono: validarCampoTexto(body?.telefono, 'telefono', { obligatorio: false }),
    direccion: validarCampoTexto(body?.direccion, 'direccion', { obligatorio: false }),
  };
}

// Para modificación (US6): solo los campos enviados, mismo formato de validación.
export function validarClienteParcial(body) {
  const permitidos = ['nombre', 'apellido', 'correo', 'telefono', 'direccion'];
  const enviados = Object.keys(body || {}).filter((campo) => permitidos.includes(campo));
  if (enviados.length === 0) {
    throw ERRORES.validacion('No hay campos válidos para modificar');
  }

  // Validar por campo presente; el correo requiere formato si se envía.
  const datos = {};
  for (const campo of enviados) {
    if (campo === 'correo') {
      const correo = validarCampoTexto(body.correo, 'correo', { obligatorio: true });
      if (!FORMATO_CORREO.test(correo)) {
        throw ERRORES.validacion('El correo tiene un formato inválido');
      }
      datos.correo = correo.toLowerCase();
    } else {
      datos[campo] = validarCampoTexto(body[campo], campo, { obligatorio: false });
      if (datos[campo] === null && (campo === 'nombre' || campo === 'apellido')) {
        throw ERRORES.validacion(`El campo ${campo} es obligatorio`);
      }
    }
  }
  return datos;
}
