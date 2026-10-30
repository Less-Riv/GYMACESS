// Formulario de cliente reutilizable (T035 US2, T057 US6).
// Obligatorios: nombre, apellido y correo; opcionales: teléfono y dirección
// (aclaración 2026-10-09). La validación del backend es la autoridad.
// La lógica no cambia: mismos estados, misma validación y mismos mensajes;
// solo se rediseña la presentación con el tema oscuro compartido.
import { useState } from 'react';
import { IconoAlerta } from './iconos.jsx';

const VACIO = { nombre: '', apellido: '', correo: '', telefono: '', direccion: '' };

export default function ClienteForm({ cliente, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(() => ({
    nombre: cliente?.nombre || '',
    apellido: cliente?.apellido || '',
    correo: cliente?.correo || '',
    telefono: cliente?.telefono || '',
    direccion: cliente?.direccion || '',
  }));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function cambiar(campo) {
    return (evento) => setDatos({ ...datos, [campo]: evento.target.value });
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await onGuardar(datos);
    } catch (e) {
      // Se muestra el mensaje claro devuelto por el backend.
      setError(e.message || 'No se pudo guardar el cliente');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="tarjeta-oscura formulario" onSubmit={manejarEnvio}>
      <h2>{cliente ? 'Modificar cliente' : 'Registrar cliente'}</h2>
      <div className="campo">
        <label htmlFor="cliente-nombre">Nombre *</label>
        <input
          id="cliente-nombre"
          value={datos.nombre}
          onChange={cambiar('nombre')}
          required
        />
      </div>
      <div className="campo">
        <label htmlFor="cliente-apellido">Apellido *</label>
        <input
          id="cliente-apellido"
          value={datos.apellido}
          onChange={cambiar('apellido')}
          required
        />
      </div>
      <div className="campo">
        <label htmlFor="cliente-correo">Correo *</label>
        <input
          id="cliente-correo"
          type="email"
          value={datos.correo}
          onChange={cambiar('correo')}
          required
        />
      </div>
      <div className="campo">
        <label htmlFor="cliente-telefono">Teléfono</label>
        <input
          id="cliente-telefono"
          value={datos.telefono}
          onChange={cambiar('telefono')}
        />
      </div>
      <div className="campo">
        <label htmlFor="cliente-direccion">Dirección</label>
        <input
          id="cliente-direccion"
          value={datos.direccion}
          onChange={cambiar('direccion')}
        />
      </div>
      {error && (
        <div className="alerta alerta-error" role="alert">
          <IconoAlerta />
          <span className="alerta-texto">{error}</span>
        </div>
      )}
      <div className="form-acciones">
        <button type="submit" className="boton-primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        {onCancelar && (
          <button type="button" className="boton-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
