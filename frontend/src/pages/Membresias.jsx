// Página de membresías (T025 US-S2-02, T059 US-S2-03): asignación de
// membresías y listado con estado efectivo. Asignar y renovar: administrador y
// recepcionista (FR-003); el entrenador solo consulta (vista básica, sin
// importes, ya proyectada por el backend).
// La fecha de fin la calcula el backend con la duración del tipo (FR-002); el
// formulario solo pide cliente, tipo y fecha de inicio.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ModalConfirmacion from '../components/ModalConfirmacion.jsx';

const VACIO = { id_cliente: '', id_tipo_membresia: '', fecha_inicio: '' };

export default function Membresias() {
  const { usuario } = useAuth();
  const puedeGestionar = ['administrador', 'recepcionista'].includes(usuario.rol);

  const [datos, setDatos] = useState({ membresias: [] });
  const [clientes, setClientes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [renovando, setRenovando] = useState(null); // membresía en confirmación
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedir('/membresias');
      setDatos(respuesta);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // El formulario de alta solo necesita clientes y tipos para los roles que
  // gestionan membresías.
  useEffect(() => {
    if (!puedeGestionar) return;
    let vivo = true;
    async function cargarOpciones() {
      try {
        const [listaClientes, listaTipos] = await Promise.all([
          pedir('/clientes?pagina=1'),
          pedir('/tipos-membresia'),
        ]);
        if (!vivo) return;
        setClientes(listaClientes.clientes);
        // El recepcionista solo recibe los tipos activos desde el backend.
        setTipos(listaTipos.tipos.filter((tipo) => tipo.estado === 'activo'));
      } catch (e) {
        if (vivo) setError(e.message);
      }
    }
    cargarOpciones();
    return () => {
      vivo = false;
    };
  }, [puedeGestionar]);

  function cambiar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function asignar(evento) {
    evento.preventDefault();
    setMensaje('');
    setError('');
    try {
      const respuesta = await pedir('/membresias', {
        metodo: 'POST',
        cuerpo: {
          id_cliente: Number(formulario.id_cliente),
          id_tipo_membresia: Number(formulario.id_tipo_membresia),
          fecha_inicio: formulario.fecha_inicio,
        },
      });
      setMensaje(
        `Membresía ${respuesta.membresia.tipo} registrada: del ${respuesta.membresia.fecha_inicio} al ${respuesta.membresia.fecha_fin}.`
      );
      setFormulario(VACIO);
      setMostrarAlta(false);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function confirmarRenovacion() {
    if (!renovando) return;
    setMensaje('');
    setError('');
    try {
      const respuesta = await pedir(`/membresias/${renovando.id_membresia}/renovar`, {
        metodo: 'PUT',
        // Se renueva con el mismo tipo de la membresía; el backend extiende la
        // vigencia sumando la duración (FR-005).
        cuerpo: { id_tipo_membresia: renovando.id_tipo_membresia },
      });
      setMensaje(
        `Membresía renovada hasta el ${respuesta.membresia.fecha_fin}.`
      );
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setRenovando(null);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <h1>Membresías</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {puedeGestionar && (
        <button onClick={() => setMostrarAlta((valor) => !valor)}>
          {mostrarAlta ? 'Ocultar formulario' : 'Asignar membresía'}
        </button>
      )}

      {mostrarAlta && (
        <form
          onSubmit={asignar}
          style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem', maxWidth: 420 }}
        >
          <label>
            Cliente
            <select
              value={formulario.id_cliente}
              onChange={(e) => cambiar('id_cliente', e.target.value)}
              required
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id_cliente} value={cliente.id_cliente}>
                  {cliente.nombre} {cliente.apellido}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo de membresía
            <select
              value={formulario.id_tipo_membresia}
              onChange={(e) => cambiar('id_tipo_membresia', e.target.value)}
              required
            >
              <option value="">Seleccione un tipo</option>
              {tipos.map((tipo) => (
                <option key={tipo.id_tipo_membresia} value={tipo.id_tipo_membresia}>
                  {tipo.nombre} ({tipo.duracion} días, ${tipo.precio})
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha de inicio
            <input
              type="date"
              value={formulario.fecha_inicio}
              onChange={(e) => cambiar('fecha_inicio', e.target.value)}
              required
            />
          </label>
          <button type="submit">Asignar</button>
        </form>
      )}

      <table style={{ marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Estado</th>
            {puedeGestionar && <th>Acción</th>}
          </tr>
        </thead>
        <tbody>
          {datos.membresias.map((membresia) => (
            <tr key={membresia.id_membresia}>
              <td>
                {membresia.cliente
                  ? `${membresia.cliente.nombre} ${membresia.cliente.apellido}`
                  : membresia.id_cliente}
              </td>
              <td>{membresia.tipo}</td>
              <td>{membresia.fecha_inicio}</td>
              <td>{membresia.fecha_fin}</td>
              <td>{membresia.estado}</td>
              {puedeGestionar && (
                <td>
                  <button onClick={() => setRenovando(membresia)}>Renovar</button>
                </td>
              )}
            </tr>
          ))}
          {datos.membresias.length === 0 && (
            <tr>
              <td colSpan={puedeGestionar ? 6 : 5}>No hay membresías registradas.</td>
            </tr>
          )}
        </tbody>
      </table>

      {renovando && (
        <ModalConfirmacion
          titulo="Renovar membresía"
          mensaje={`Se extenderá la vigencia de la membresía ${renovando.id_membresia} (${renovando.tipo}) sumando la duración del tipo elegido. ¿Continuar?`}
          alConfirmar={confirmarRenovacion}
          alCancelar={() => setRenovando(null)}
        />
      )}
    </main>
  );
}
