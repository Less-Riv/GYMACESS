// Página de pagos (T042 US-S2-04, T064 US-S2-05): registro de pagos y vista
// de adeudos.
// - Registrar pago: administrador y recepcionista (FR-006). Métodos cerrados:
//   efectivo y transferencia (clarificación Q2); admite pagos parciales.
// - Adeudos: solo administrador (US-S2-05, FR-007); el saldo es precio vigente
//   del tipo menos pagos registrados, nunca negativo.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

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
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <h1>Pagos</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {puedeRegistrar && (
        <>
          <button onClick={() => setMostrarAlta((valor) => !valor)}>
            {mostrarAlta ? 'Ocultar formulario' : 'Registrar pago'}
          </button>

          {mostrarAlta && (
            <form
              onSubmit={registrar}
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
                Membresía
                <select
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
              </label>
              <label>
                Monto
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formulario.monto}
                  onChange={(e) => cambiar('monto', e.target.value)}
                  required
                />
              </label>
              <label>
                Método de pago
                <select
                  value={formulario.metodo_pago}
                  onChange={(e) => cambiar('metodo_pago', e.target.value)}
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </label>
              <button type="submit">Registrar pago</button>
            </form>
          )}
        </>
      )}

      {historial.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Historial de pagos</h2>
          <table>
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
                  <td>{pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleString() : '—'}</td>
                  <td>${pago.monto}</td>
                  <td>{pago.metodo_pago}</td>
                  <td>{pago.tipo_membresia || pago.id_membresia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {esAdministrador && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Adeudos por cliente</h2>
          <table>
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
                    <button onClick={() => verHistorial(adeudo)}>Ver historial</button>
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
        </section>
      )}
    </main>
  );
}
