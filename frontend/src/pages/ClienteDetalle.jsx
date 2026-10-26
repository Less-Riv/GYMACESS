// Detalle y modificación de un cliente (T057, US6; FR-010).
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { pedir, listarObjetivos, listarProgresos } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClienteForm from '../components/ClienteForm.jsx';
import CapturaFacial from '../components/CapturaFacial.jsx';
import AsignarEntrenador from '../components/AsignarEntrenador.jsx';

export default function ClienteDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const puedeModificar = ['administrador', 'recepcionista'].includes(usuario.rol);

  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(false);
  // Registro facial (T034, US-S2-06): estado del descriptor del cliente.
  const [rostro, setRostro] = useState(null);
  const [mostrarCaptura, setMostrarCaptura] = useState(false);
  const [enviandoRostro, setEnviandoRostro] = useState(false);
  // Seguimiento del cliente (US-S3-04): objetivos y progresos en modo
  // lectura; el registro es exclusivo del entrenador de la carga.
  const [seguimiento, setSeguimiento] = useState({ objetivos: [], progresos: [] });

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedir(`/clientes/${id}`);
      setCliente(respuesta.cliente);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Carga el estado del registro facial del cliente (solo admin y
  // recepcionista pueden verlo; el backend también lo valida).
  useEffect(() => {
    if (!puedeModificar) return;
    let vivo = true;
    async function cargarRostro() {
      try {
        const respuesta = await pedir(`/rostros/${id}`);
        if (vivo) setRostro(respuesta);
      } catch (_e) {
        // Sin registro facial aún: se queda en "pendiente"; no se bloquea la
        // página por esto.
      }
    }
    cargarRostro();
    return () => {
      vivo = false;
    };
  }, [id, puedeModificar]);

  // Carga los objetivos y progresos del cliente en modo lectura (US-S3-04).
  useEffect(() => {
    let vivo = true;
    async function cargarSeguimiento() {
      try {
        const [objetivos, progresos] = await Promise.all([
          listarObjetivos(`?cliente_id=${id}`),
          listarProgresos(`?cliente_id=${id}`),
        ]);
        if (vivo) {
          setSeguimiento({ objetivos: objetivos.objetivos, progresos: progresos.progresos });
        }
      } catch (_e) {
        // Sin permiso o sin datos: la página no se bloquea por esto.
      }
    }
    cargarSeguimiento();
    return () => {
      vivo = false;
    };
  }, [id]);

  // Envía el descriptor calculado en el navegador al backend (FR-017).
  async function guardarRostro(descriptor) {
    setEnviandoRostro(true);
    setMensaje('');
    setError('');
    try {
      const respuesta = await pedir(`/rostros/${id}`, {
        metodo: 'POST',
        cuerpo: { descriptor },
      });
      setRostro(respuesta.rostro);
      setMostrarCaptura(false);
      setMensaje('Información facial registrada correctamente.');
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviandoRostro(false);
    }
  }

  async function modificarCliente(datosFormulario) {
    // Confirmación antes de guardar cambios (constitución Principio XI).
    if (!window.confirm('¿Guardar los cambios de este cliente?')) return;
    const respuesta = await pedir(`/clientes/${id}`, {
      metodo: 'PATCH',
      cuerpo: datosFormulario,
    });
    setCliente(respuesta.cliente);
    setEditando(false);
    setMensaje('Cliente actualizado correctamente.');
  }

  if (!cliente) {
    return (
      <main style={{ padding: '2rem' }}>
        <p>Cargando…</p>
        {error && <p className="mensaje-error">{error}</p>}
        <Link to="/clientes">Volver al listado</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h1>
        {cliente.nombre} {cliente.apellido}
      </h1>
      <p>
        <Link to="/clientes">Volver al listado</Link>
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}

      {editando ? (
        <ClienteForm
          cliente={cliente}
          onGuardar={modificarCliente}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <div className="tarjeta">
          <p>
            <strong>Correo:</strong> {cliente.correo}
          </p>
          <p>
            <strong>Teléfono:</strong> {cliente.telefono || '—'}
          </p>
          <p>
            <strong>Dirección:</strong> {cliente.direccion || '—'}
          </p>
          <p>
            <strong>Estado:</strong> {cliente.estado}
          </p>
          <p>
            <strong>Fecha de registro:</strong>{' '}
            {cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString() : '—'}
          </p>
          {puedeModificar && (
            <button onClick={() => setEditando(true)}>Modificar cliente</button>
          )}
        </div>
      )}

      {/* Registro facial (US-S2-06): solo administrador y recepcionista. */}
      {puedeModificar && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Registro facial</h2>
          <p>
            <strong>Estado:</strong> {rostro?.estado_registro || 'pendiente'}
            {rostro?.fecha_registro
              ? ` · registrado el ${new Date(rostro.fecha_registro).toLocaleDateString()}`
              : ''}
          </p>

          {mostrarCaptura ? (
            enviandoRostro ? (
              <p>Enviando descriptor…</p>
            ) : (
              <CapturaFacial onDescriptor={guardarRostro} />
            )
          ) : (
            <button onClick={() => setMostrarCaptura(true)}>
              {rostro?.estado_registro === 'completo'
                ? 'Volver a capturar el rostro'
                : 'Registrar rostro'}
            </button>
          )}
        </section>
      )}

      {/* Asignación de entrenador (US-S3-02): administrador y recepcionista. */}
      {puedeModificar && <AsignarEntrenador idCliente={id} />}

      {/* Rutinas del cliente (US-S3-03): enlace al módulo filtrado. */}
      {puedeModificar && (
        <p style={{ marginTop: '1rem' }}>
          <Link to={`/rutinas?cliente_id=${id}`}>Ver rutinas de este cliente</Link>
        </p>
      )}

      {/* Seguimiento (US-S3-04): objetivos y histórico de progresos en modo
          lectura; el registro es del entrenador de la carga (RN-19). */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Objetivos de entrenamiento</h2>
        {seguimiento.objetivos.length === 0 ? (
          <p>Sin objetivos registrados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Fecha objetivo</th>
                <th>Cierre</th>
              </tr>
            </thead>
            <tbody>
              {seguimiento.objetivos.map((objetivo) => (
                <tr key={objetivo.id_objetivo}>
                  <td>{objetivo.descripcion}</td>
                  <td>{objetivo.estado}</td>
                  <td>{objetivo.fecha_objetivo || '—'}</td>
                  <td>{objetivo.fecha_cierre || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2>Histórico de progresos</h2>
        {seguimiento.progresos.length === 0 ? (
          <p>Sin progresos registrados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Comentario</th>
                <th>Peso</th>
                <th>Cintura</th>
              </tr>
            </thead>
            <tbody>
              {seguimiento.progresos.map((progreso) => (
                <tr key={progreso.id_progreso}>
                  <td>{progreso.fecha}</td>
                  <td>{progreso.comentario}</td>
                  <td>{progreso.peso ? `${progreso.peso} kg` : '—'}</td>
                  <td>{progreso.cintura ? `${progreso.cintura} cm` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
