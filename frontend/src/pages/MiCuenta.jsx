// Página "Mi cuenta" (T074 US-S2-10, Sprint 1: perfil personal).
// El cliente consulta únicamente su propia información (FR-028, RN-14): el
// dato se resuelve en el backend desde el token; la página no envía
// identificadores de clientes.
// Secciones del Sprint 2: membresía con días restantes y estado, historial de
// pagos, adeudo (fórmula FR-007) y accesos propios.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';

export default function MiCuenta() {
  const [cliente, setCliente] = useState(null);
  const [membresia, setMembresia] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [adeudo, setAdeudo] = useState(null);
  const [accesos, setAccesos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    pedir('/clientes/mi-cuenta')
      .then((respuesta) => {
        if (activo) setCliente(respuesta.cliente);
      })
      .catch((e) => {
        if (activo) {
          // Mensaje claro devuelto por el backend (sin errores técnicos).
          setError(e.message || 'No se pudo cargar tu información');
        }
      });

    // Secciones del Sprint 2: se cargan en paralelo y una falla no bloquea al
    // resto de la página.
    async function cargarSecciones() {
      try {
        const [respMembresia, respPagos, respAdeudo, respAccesos] = await Promise.all([
          pedir('/mi-cuenta/membresia').catch(() => null),
          pedir('/mi-cuenta/pagos').catch(() => ({ pagos: [] })),
          pedir('/mi-cuenta/adeudo').catch(() => null),
          pedir('/mi-cuenta/accesos').catch(() => ({ accesos: [] })),
        ]);
        if (!activo) return;
        if (respMembresia) setMembresia(respMembresia);
        setPagos(respPagos?.pagos || []);
        if (respAdeudo) setAdeudo(respAdeudo);
        setAccesos(respAccesos?.accesos || []);
      } catch (_e) {
        // Silencio: la página sigue siendo útil con el perfil del Sprint 1.
      }
    }
    cargarSecciones();

    return () => {
      activo = false;
    };
  }, []);

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Mi cuenta</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}

      {error && (
        <div className="tarjeta">
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        </div>
      )}

      {cliente && (
        <div className="tarjeta">
          <p>
            <strong>Nombre:</strong> {cliente.nombre} {cliente.apellido}
          </p>
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
          <p>
            <em>Desde aquí no puedes modificar tus datos; contacta a recepción si necesitas
            actualizarlos.</em>
          </p>
        </div>
      )}

      {/* Membresía (US-S2-10 esc. 1) */}
      <section className="tarjeta" style={{ marginTop: '1rem' }}>
        <h2>Mi membresía</h2>
        {membresia?.membresia ? (
          <>
            <p>
              <strong>Tipo:</strong> {membresia.membresia.tipo} (
              {membresia.membresia.duracion} días)
            </p>
            <p>
              <strong>Inicio:</strong> {membresia.membresia.fecha_inicio}
            </p>
            <p>
              <strong>Fin:</strong> {membresia.membresia.fecha_fin}
            </p>
            <p>
              <strong>Días restantes:</strong> {membresia.membresia.dias_restantes}
            </p>
            <p>
              <strong>Estado:</strong> {membresia.membresia.estado}
            </p>
          </>
        ) : (
          <p>{membresia?.mensaje || 'Cargando tu membresía…'}</p>
        )}
      </section>

      {/* Adeudo (US-S2-10 esc. 3, 6 y 7) */}
      <section className="tarjeta" style={{ marginTop: '1rem' }}>
        <h2>Mi adeudo</h2>
        {adeudo ? (
          adeudo.mensaje ? (
            <p>{adeudo.mensaje}</p>
          ) : (
            <>
              <p>
                <strong>Precio de la membresía:</strong> ${adeudo.precio_membresia}
              </p>
              <p>
                <strong>Total pagado:</strong> ${adeudo.total_pagado}
              </p>
              <p>
                <strong>Saldo pendiente:</strong> ${adeudo.saldo_pendiente}
              </p>
              <p>
                <strong>Estado de la cuenta:</strong> {adeudo.estado_cuenta}
              </p>
            </>
          )
        ) : (
          <p>Cargando tu adeudo…</p>
        )}
      </section>

      {/* Pagos (US-S2-10 esc. 2) */}
      <section className="tarjeta" style={{ marginTop: '1rem' }}>
        <h2>Mis pagos</h2>
        {pagos.length > 0 ? (
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
              {pagos.map((pago) => (
                <tr key={pago.id_pago}>
                  <td>{pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleString() : '—'}</td>
                  <td>${pago.monto}</td>
                  <td>{pago.metodo_pago}</td>
                  <td>{pago.tipo_membresia || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No tienes pagos registrados.</p>
        )}
      </section>

      {/* Accesos (US-S2-10 esc. 4) */}
      <section className="tarjeta" style={{ marginTop: '1rem' }}>
        <h2>Mis accesos</h2>
        {accesos.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Resultado</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {accesos.map((acceso, indice) => (
                <tr key={`${acceso.fecha}-${acceso.hora}-${indice}`}>
                  <td>{acceso.fecha}</td>
                  <td>{acceso.hora}</td>
                  <td>{acceso.resultado}</td>
                  <td>{acceso.motivo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No tienes registros de acceso todavía.</p>
        )}
      </section>
    </main>
  );
}
