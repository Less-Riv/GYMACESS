// Página de pagos (T042 US-S2-04, T064 US-S2-05): registro de pagos y vista
// de adeudos.
// - Registrar pago: administrador y recepcionista (FR-006). Métodos cerrados:
//   efectivo y transferencia (clarificación Q2); admite pagos parciales.
// - Adeudos: solo administrador (US-S2-05, FR-007); el saldo es precio vigente
//   del tipo menos pagos registrados, nunca negativo.
// La lógica no cambia: mismos estados, mismas llamadas (opciones del
// formulario, POST /pagos, GET /pagos?cliente_id=, GET /pagos/adeudos) y los
// mismos permisos por rol; solo se rediseña la presentación con el tema
// oscuro compartido (patrón de Usuarios.jsx).
import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';

const VACIO = { id_cliente: '', id_membresia: '', monto: '', metodo_pago: 'efectivo' };

export default function Pagos() {
  const { usuario } = useAuth();
  const esAdministrador = usuario.rol === 'administrador';
  const puedeRegistrar = esAdministrador || usuario.rol === 'recepcionista';

  const [clientes, setClientes] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [adeudos, setAdeudos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Opciones del formulario (solo para roles que registran pagos).
  useEffect(() => {
    if (!puedeRegistrar) return;
    let vivo = true;
    async function cargarClientes() {
      try {
        const respuesta = await pedir('/clientes?pagina=1');
        if (vivo) setClientes(respuesta.clientes);
      } catch (e) {
        if (vivo) setError(e.message);
      }
    }
    cargarClientes();
    return () => {
      vivo = false;
    };
  }, [puedeRegistrar]);

  // Las membresías del cliente elegido limitan las opciones de pago (RN-05).
  useEffect(() => {
    if (!formulario.id_cliente) {
      setMembresias([]);
      return;
    }
    let vivo = true;
    async function cargarMembresias() {
      try {
        const respuesta = await pedir(`/membresias?cliente_id=${formulario.id_cliente}`);
        if (vivo) setMembresias(respuesta.membresias);
      } catch (e) {
        if (vivo) setError(e.message);
      }
    }
    cargarMembresias();
    return () => {
      vivo = false;
    };
  }, [formulario.id_cliente]);

  const cargarAdeudos = useCallback(async () => {
    if (!esAdministrador) return;
    try {
      const respuesta = await pedir('/pagos/adeudos');
      setAdeudos(respuesta.adeudos);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [esAdministrador]);

  useEffect(() => {
    cargarAdeudos();
  }, [cargarAdeudos]);

  function cambiar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function registrar(evento) {
    evento.preventDefault();
    setMensaje('');
    setError('');
    try {
      const respuesta = await pedir('/pagos', {
        metodo: 'POST',
        cuerpo: {
          id_cliente: Number(formulario.id_cliente),
          id_membresia: Number(formulario.id_membresia),
          monto: Number(formulario.monto),
          metodo_pago: formulario.metodo_pago,
        },
      });
      setMensaje(`Pago de $${respuesta.pago.monto} registrado correctamente.`);
      setFormulario(VACIO);
      setMostrarAlta(false);
      await cargarAdeudos();
    } catch (e) {
      setError(e.message);
    }
  }

  async function verHistorial(cliente) {
    setMensaje('');
    setError('');
    try {
      const respuesta = await pedir(`/pagos?cliente_id=${cliente.id_cliente}`);
      setHistorial(respuesta.pagos);
      if (respuesta.pagos.length === 0) {
        const nombre = cliente.nombre_completo || `${cliente.nombre} ${cliente.apellido}`;
        setMensaje(`El cliente ${nombre} no tiene pagos registrados.`);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="pagina pagina-pagos">
      <EncabezadoPagina titulo="Pagos" />

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
            <button type="button" className="boton-reintentar" onClick={cargarAdeudos}>
              Reintentar
            </button>
          </div>
        )}

        {puedeRegistrar && (
          <>
            <div className="acciones-fila">
              <button
                type="button"
                className="boton-primario"
                onClick={() => setMostrarAlta((valor) => !valor)}
              >
                {mostrarAlta ? 'Ocultar formulario' : 'Registrar pago'}
              </button>
            </div>

            {mostrarAlta && (
              <form className="tarjeta-oscura formulario" onSubmit={registrar}>
                <h2>Registrar pago</h2>
                <div className="campo">
                  <label htmlFor="pago-cliente">Cliente</label>
                  <select
                    id="pago-cliente"
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
                  <label htmlFor="pago-membresia">Membresía</label>
                  <select
                    id="pago-membresia"
                    value={formulario.id_membresia}
                    onChange={(e) => cambiar('id_membresia', e.target.value)}
                    required
                  >
                    <option value="">Seleccione la membresía</option>
                    {membresias.map((membresia) => (
                      <option key={membresia.id_membresia} value={membresia.id_membresia}>
                        {membresia.tipo} ({membresia.fecha_inicio} a {membresia.fecha_fin})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="pago-monto">Monto</label>
                  <input
                    id="pago-monto"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formulario.monto}
                    onChange={(e) => cambiar('monto', e.target.value)}
                    required
                  />
                </div>
                <div className="campo">
                  <label htmlFor="pago-metodo">Método de pago</label>
                  <select
                    id="pago-metodo"
                    value={formulario.metodo_pago}
                    onChange={(e) => cambiar('metodo_pago', e.target.value)}
                    required
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div className="form-acciones">
                  <button type="submit" className="boton-primario">
                    Registrar pago
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {historial.length > 0 && (
          <section className="tarjeta-oscura">
            <div className="listado-cabecera">
              <h2>Historial de pagos</h2>
              <span className="listado-total">{historial.length}</span>
            </div>
            <div className="tabla-contenedor">
              <table className="tabla-oscura">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Membresía</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((pago) => (
                    <tr key={pago.id_pago}>
                      <td>
                        {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleString() : '—'}
                      </td>
                      <td>${pago.monto}</td>
                      <td>{pago.metodo_pago}</td>
                      <td>{pago.tipo_membresia || pago.id_membresia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {esAdministrador && (
          <section className="tarjeta-oscura">
            <div className="listado-cabecera">
              <h2>Adeudos por cliente</h2>
              <span className="listado-total">{adeudos.length}</span>
            </div>
            <div className="tabla-contenedor">
              <table className="tabla-oscura">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Precio de la membresía</th>
                    <th>Total pagado</th>
                    <th>Saldo pendiente</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {adeudos.map((adeudo) => (
                    <tr key={adeudo.id_cliente}>
                      <td>{adeudo.nombre_completo}</td>
                      <td>${adeudo.precio_membresia}</td>
                      <td>${adeudo.total_pagado}</td>
                      <td>${adeudo.saldo_pendiente}</td>
                      <td>
                        <button
                          type="button"
                          className="boton-mini"
                          onClick={() => verHistorial(adeudo)}
                        >
                          Ver historial
                        </button>
                      </td>
                    </tr>
                  ))}
                  {adeudos.length === 0 && (
                    <tr>
                      <td colSpan={5}>No hay clientes con membresías activas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
