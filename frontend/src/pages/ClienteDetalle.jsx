// Detalle y modificación de un cliente (T057, US6; FR-010).
// La lógica no cambia respecto de la versión anterior: mismos estados, mismas
// llamadas (/clientes/:id, /rostros/:id, objetivos y progresos), mismas
// validaciones y los mismos permisos por rol; solo se rediseña la
// presentación con el tema oscuro compartido (patrón de Usuarios.jsx).
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { pedir, listarObjetivos, listarProgresos } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClienteForm from '../components/ClienteForm.jsx';
import CapturaFacial from '../components/CapturaFacial.jsx';
import AsignarEntrenador from '../components/AsignarEntrenador.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';
import './Clientes.css';

// Chip de estado según el valor del backend; los no previstos quedan con el
// estilo neutro base del chip.
const CLASES_ESTADO = {
  activo: 'chip-activo',
  inactivo: 'chip-inactivo',
  completo: 'chip-activo',
  completado: 'chip-activo',
  pendiente: 'chip-suspendida',
  cancelado: 'chip-cancelada',
  cancelada: 'chip-cancelada',
  vencida: 'chip-vencida',
  suspendida: 'chip-suspendida',
};

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
      <main className="pagina pagina-cliente-detalle">
        <EncabezadoPagina titulo="Detalle del cliente">
          <Link to="/clientes" className="boton-secundario">
            Volver al listado
          </Link>
        </EncabezadoPagina>

        <div className="contenido-pagina">
          <p className="cargando">Cargando…</p>
          {error && (
            <div className="alerta alerta-error" role="alert">
              <IconoAlerta />
              <span className="alerta-texto">{error}</span>
              <button type="button" className="boton-reintentar" onClick={cargar}>
                Reintentar
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="pagina pagina-cliente-detalle">
      <EncabezadoPagina titulo={`${cliente.nombre} ${cliente.apellido}`}>
        <Link to="/clientes" className="boton-secundario">
          Volver al listado
        </Link>
      </EncabezadoPagina>

      <div className="contenido-pagina">
        {mensaje && (
          <div className="alerta alerta-exito" role="status">
            <IconoExito />
            <span className="alerta-texto">{mensaje}</span>
          </div>
        )}

        {error && (
          <div className="alerta alerta-error" role="alert">
            <IconoAlerta />
            <span className="alerta-texto">{error}</span>
            <button type="button" className="boton-reintentar" onClick={cargar}>
              Reintentar
            </button>
          </div>
        )}

        {editando ? (
          <ClienteForm
            cliente={cliente}
            onGuardar={modificarCliente}
            onCancelar={() => setEditando(false)}
          />
        ) : (
          <section className="tarjeta-oscura">
            <h2>Datos del cliente</h2>
            <dl className="lista-datos">
              <div className="dato-fila">
                <dt>Correo:</dt>
                <dd>{cliente.correo}</dd>
              </div>
              <div className="dato-fila">
                <dt>Teléfono:</dt>
                <dd>{cliente.telefono || '—'}</dd>
              </div>
              <div className="dato-fila">
                <dt>Dirección:</dt>
                <dd>{cliente.direccion || '—'}</dd>
              </div>
              <div className="dato-fila">
                <dt>Estado:</dt>
                <dd>
                  <span className={`chip ${CLASES_ESTADO[cliente.estado] || ''}`}>
                    {cliente.estado}
                  </span>
                </dd>
              </div>
              <div className="dato-fila">
                <dt>Fecha de registro:</dt>
                <dd>
                  {cliente.fecha_registro
                    ? new Date(cliente.fecha_registro).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
            </dl>
            {puedeModificar && (
              <div className="acciones-fila">
                <button
                  type="button"
                  className="boton-primario"
                  onClick={() => setEditando(true)}
                >
                  Modificar cliente
                </button>
              </div>
            )}
          </section>
        )}

        {/* Registro facial (US-S2-06): solo administrador y recepcionista. */}
        {puedeModificar && (
          <section className="tarjeta-oscura">
            <h2>Registro facial</h2>
            <p className="dato-texto">
              <strong>Estado:</strong>{' '}
              <span
                className={`chip ${CLASES_ESTADO[rostro?.estado_registro || 'pendiente'] || ''}`}
              >
                {rostro?.estado_registro || 'pendiente'}
              </span>
              {rostro?.fecha_registro
                ? ` · registrado el ${new Date(rostro.fecha_registro).toLocaleDateString()}`
                : ''}
            </p>

            {mostrarCaptura ? (
              enviandoRostro ? (
                <p className="cargando">Enviando descriptor…</p>
              ) : (
                <CapturaFacial onDescriptor={guardarRostro} />
              )
            ) : (
              <div className="acciones-fila">
                <button
                  type="button"
                  className="boton-primario"
                  onClick={() => setMostrarCaptura(true)}
                >
                  {rostro?.estado_registro === 'completo'
                    ? 'Volver a capturar el rostro'
                    : 'Registrar rostro'}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Asignación de entrenador (US-S3-02): administrador y recepcionista. */}
        {puedeModificar && <AsignarEntrenador idCliente={id} />}

        {/* Rutinas del cliente (US-S3-03): enlace al módulo filtrado. */}
        {puedeModificar && (
          <p className="fila-enlace">
            <Link className="enlace" to={`/rutinas?cliente_id=${id}`}>
              Ver rutinas de este cliente
            </Link>
          </p>
        )}

        {/* Seguimiento (US-S3-04): objetivos y histórico de progresos en modo
            lectura; el registro es del entrenador de la carga (RN-19). */}
        <section className="tarjeta-oscura">
          <h2>Objetivos de entrenamiento</h2>
          {seguimiento.objetivos.length === 0 ? (
            <p className="estado-vacio">Sin objetivos registrados.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-oscura">
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
                      <td>
                        <span className={`chip ${CLASES_ESTADO[objetivo.estado] || ''}`}>
                          {objetivo.estado}
                        </span>
                      </td>
                      <td>{objetivo.fecha_objetivo || '—'}</td>
                      <td>{objetivo.fecha_cierre || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="subtitulo-seccion">Histórico de progresos</h2>
          {seguimiento.progresos.length === 0 ? (
            <p className="estado-vacio">Sin progresos registrados.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-oscura">
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
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
