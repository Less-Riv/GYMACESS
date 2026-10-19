// Página del punto de acceso (T049 US-S2-07, T054 US-S2-08).
//
// Flujo distintivo del sprint: capturar rostro → identificar → validar
// membresía → autorizar o rechazar → el backend registra SIEMPRE el intento
// (RN-10).
// Reintentos ilimitados (FR-011): si no se reconoce el rostro, el operador
// puede capturar de nuevo tantas veces como necesite.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';
import CapturaFacial from '../components/CapturaFacial.jsx';

// Mensaje fijo exigido por la spec (FR-011).
const MENSAJE_NO_RECONOCIDO =
  'No se reconoció tu rostro. Intenta de nuevo o consulta al personal.';

// Traduce el motivo del backend a un mensaje comprensible para el operador.
function textoMotivo(motivo) {
  switch (motivo) {
    case 'identificacion_no_reconocida':
      return MENSAJE_NO_RECONOCIDO;
    case 'membresia_vencida':
      return 'La membresía del cliente está vencida. Debe renovarla para acceder.';
    case 'membresia_suspendida':
      return 'La membresía del cliente está suspendida. Consulta con el administrador.';
    case 'membresia_cancelada':
      return 'La membresía del cliente está cancelada. Consulta con el administrador.';
    case 'membresia_inexistente':
      return 'El cliente no tiene una membresía registrada.';
    default:
      return 'Acceso no autorizado.';
  }
}

export default function PuntoAcceso() {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function identificar(descriptor) {
    setEnviando(true);
    setError('');
    try {
      const respuesta = await pedir('/accesos/identificar', {
        metodo: 'POST',
        cuerpo: { descriptor },
      });
      setResultado(respuesta);
    } catch (e) {
      setError(e.message);
      setResultado(null);
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    setResultado(null);
    setError('');
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h1>Punto de acceso</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      <p>
        Presenta el rostro del cliente frente a la cámara. El intento queda registrado siempre,
        tanto si se autoriza como si se rechaza.
      </p>

      {error && <p className="mensaje-error">{error}</p>}

      {!resultado && <CapturaFacial onDescriptor={identificar} textoBoton="Identificar" />}
      {enviando && <p>Identificando…</p>}

      {resultado && !enviando && (
        <section className="tarjeta" style={{ marginTop: '1rem' }}>
          {resultado.autorizado ? (
            <>
              <h2 style={{ color: 'green' }}>Acceso autorizado</h2>
              <p>
                <strong>Cliente:</strong> {resultado.cliente.nombre} {resultado.cliente.apellido}
              </p>
            </>
          ) : (
            <>
              <h2 style={{ color: 'red' }}>Acceso rechazado</h2>
              <p>{textoMotivo(resultado.motivo)}</p>
              {resultado.cliente && (
                <p>
                  <strong>Cliente identificado:</strong> {resultado.cliente.nombre}{' '}
                  {resultado.cliente.apellido}
                </p>
              )}
            </>
          )}
          <button onClick={reiniciar}>Nuevo intento</button>
        </section>
      )}
    </main>
  );
}
