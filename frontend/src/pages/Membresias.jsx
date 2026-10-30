// Página de membresías (T025 US-S2-02, T059 US-S2-03): asignación de
// membresías y listado con estado efectivo. Asignar y renovar: administrador y
// recepcionista (FR-003); el entrenador solo consulta (vista básica, sin
// importes, ya proyectada por el backend).
// La fecha de fin la calcula el backend con la duración del tipo (FR-002); el
// formulario solo pide cliente, tipo y fecha de inicio.
// La lógica no cambia: mismos estados, mismas llamadas (GET /membresias,
// POST /membresias, PUT /membresias/:id/renovar, opciones del formulario) y
// los mismos permisos por rol; solo se rediseña la presentación con el tema
// oscuro compartido (patrón de Usuarios.jsx).
import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ModalConfirmacion from '../components/ModalConfirmacion.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';

const VACIO = { id_cliente: '', id_tipo_membresia: '', fecha_inicio: '' };

// Chip de estado según el valor calculado por el backend; los no previstos
// quedan con el estilo neutro base del chip.
const CLASES_ESTADO = {
  vigente: 'chip-vigente',
  activa: 'chip-activo',
  activo: 'chip-activo',
  vencida: 'chip-vencida',
  vencido: 'chip-vencida',
  suspendida: 'chip-suspendida',
  cancelada: 'chip-cancelada',
  inactivo: 'chip-inactivo',
};

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
    <main className="pagina pagina-membresias">
      <EncabezadoPagina titulo="Membresías" />

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

        {puedeGestionar && (
          <div className="acciones-fila">
            <button
              type="button"
              className="boton-primario"
              onClick={() => setMostrarAlta((valor) => !valor)}
            >
              {mostrarAlta ? 'Ocultar formulario' : 'Asignar membresía'}
            </button>
          </div>
        )}

        {mostrarAlta && (
          <form className="tarjeta-oscura formulario" onSubmit={asignar}>
            <h2>Asignar membresía</h2>
            <div className="campo">
              <label htmlFor="memb-cliente">Cliente</label>
              <select
                id="memb-cliente"
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
            </div>
            <div className="campo">
              <label htmlFor="memb-tipo">Tipo de membresía</label>
              <select
                id="memb-tipo"
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
            </div>
            <div className="campo">
              <label htmlFor="memb-fecha">Fecha de inicio</label>
              <input
                id="memb-fecha"
                type="date"
                value={formulario.fecha_inicio}
                onChange={(e) => cambiar('fecha_inicio', e.target.value)}
                required
              />
            </div>
            <div className="form-acciones">
              <button type="submit" className="boton-primario">
                Asignar
              </button>
            </div>
          </form>
        )}

        <section className="tarjeta-oscura">
          <div className="listado-cabecera">
            <h2>Membresías registradas</h2>
            <span className="listado-total">{datos.membresias.length}</span>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla-oscura">
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
                    <td>
                      <span className={`chip ${CLASES_ESTADO[membresia.estado] || ''}`}>
                        {membresia.estado}
                      </span>
                    </td>
                    {puedeGestionar && (
                      <td>
                        <button
                          type="button"
                          className="boton-mini"
                          onClick={() => setRenovando(membresia)}
                        >
                          Renovar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {datos.membresias.length === 0 && (
                  <tr>
                    <td colSpan={puedeGestionar ? 6 : 5}>
                      No hay membresías registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {renovando && (
          <ModalConfirmacion
            titulo="Renovar membresía"
            mensaje={`Se extenderá la vigencia de la membresía ${renovando.id_membresia} (${renovando.tipo}) sumando la duración del tipo elegido. ¿Continuar?`}
            alConfirmar={confirmarRenovacion}
            alCancelar={() => setRenovando(null)}
          />
        )}
      </div>
    </main>
  );
}
