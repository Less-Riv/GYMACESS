// Formulario de cliente reutilizable (T035 US2, T057 US6).
// Obligatorios: nombre, apellido y correo; opcionales: teléfono y dirección
// (aclaración 2026-10-09). La validación del backend es la autoridad.
import { useState } from 'react';

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
    <form className="tarjeta" onSubmit={manejarEnvio}>
      <h2>{cliente ? 'Modificar cliente' : 'Registrar cliente'}</h2>
      <label>
        Nombre *
        <input value={datos.nombre} onChange={cambiar('nombre')} required />
      </label>
      <label>
        Apellido *
        <input value={datos.apellido} onChange={cambiar('apellido')} required />
      </label>
      <label>
        Correo *
        <input type="email" value={datos.correo} onChange={cambiar('correo')} required />
      </label>
      <label>
        Teléfono
        <input value={datos.telefono} onChange={cambiar('telefono')} />
      </label>
      <label>
        Dirección
        <input value={datos.direccion} onChange={cambiar('direccion')} />
      </label>
      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        {onCancelar && (
          <button type="button" onClick={onCancelar} style={{ background: '#6b7280' }}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
