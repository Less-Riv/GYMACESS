// Página de tipos de membresía (T015, US-S2-01): alta y modificación del
// catálogo administrativo (FR-001). Solo el administrador accede; el backend
// también valida el rol (FR-021).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';

const VACIO = { nombre: '', descripcion: '', duracion: '', precio: '' };

export default function TiposMembresia() {
  const [tipos, setTipos] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [editando, setEditando] = useState(null); // id del tipo en edición
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedir('/tipos-membresia');
      setTipos(respuesta.tipos);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setMensaje('');
    setError('');
    const cuerpo = {
      nombre: formulario.nombre,
      descripcion: formulario.descripcion || undefined,
      duracion: Number(formulario.duracion),
      precio: Number(formulario.precio),
    };

    try {
      if (editando) {
        await pedir(`/tipos-membresia/${editando}`, { metodo: 'PUT', cuerpo });
        setMensaje('Tipo de membresía actualizado correctamente.');
      } else {
        await pedir('/tipos-membresia', { metodo: 'POST', cuerpo });
        setMensaje(`Tipo "${cuerpo.nombre}" registrado correctamente.`);
      }
      setFormulario(VACIO);
      setEditando(null);
      setMostrarAlta(false);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  function editar(tipo) {
    setEditando(tipo.id_tipo_membresia);
    setMostrarAlta(true);
    setMensaje('');
    setError('');
    setFormulario({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      duracion: String(tipo.duracion),
      precio: String(tipo.precio),
    });
  }

  function cancelar() {
    setFormulario(VACIO);
    setEditando(null);
    setMostrarAlta(false);
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Tipos de membresía</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      <button onClick={() => (mostrarAlta ? cancelar() : setMostrarAlta(true))}>
        {mostrarAlta ? 'Ocultar formulario' : 'Registrar tipo de membresía'}
      </button>

      {mostrarAlta && (
        <form onSubmit={guardar} style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem', maxWidth: 420 }}>
          <label>
            Nombre
            <input
              value={formulario.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              required
            />
          </label>
          <label>
            Descripción
            <input
              value={formulario.descripcion}
              onChange={(e) => cambiar('descripcion', e.target.value)}
            />
          </label>
          <label>
            Duración (días)
            <input
              type="number"
              min="1"
              value={formulario.duracion}
              onChange={(e) => cambiar('duracion', e.target.value)}
              required
            />
          </label>
          <label>
            Precio
            <input
              type="number"
              min="0"
              step="0.01"
              value={formulario.precio}
              onChange={(e) => cambiar('precio', e.target.value)}
              required
            />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">{editando ? 'Guardar cambios' : 'Registrar'}</button>
            <button type="button" onClick={cancelar}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <table style={{ marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Duración (días)</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {tipos.map((tipo) => (
            <tr key={tipo.id_tipo_membresia}>
              <td>{tipo.nombre}</td>
              <td>{tipo.descripcion || '—'}</td>
              <td>{tipo.duracion}</td>
              <td>${tipo.precio}</td>
              <td>{tipo.estado}</td>
              <td>
                <button onClick={() => editar(tipo)}>Modificar</button>
              </td>
            </tr>
          ))}
          {tipos.length === 0 && (
            <tr>
              <td colSpan={6}>No hay tipos de membresía registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
