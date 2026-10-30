// Página del punto de acceso (T049 US-S2-07, T054 US-S2-08).
//
// Flujo distintivo del sprint: capturar rostro → identificar → validar
// membresía → autorizar o rechazar → el backend registra SIEMPRE el intento
// (RN-10).
// Reintentos ilimitados (FR-011): si no se reconoce el rostro, el operador
// puede capturar de nuevo tantas veces como necesite.
// La lógica no cambia: mismos estados (resultado, error, enviando), misma
// llamada POST /accesos/identificar, mismo textoMotivo y mismas condiciones
// de render; solo se rediseña la presentación con el tema oscuro compartido.
import { useState } from 'react';
import { pedir } from '../services/api.js';
import CapturaFacial from '../components/CapturaFacial.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';
import './PuntoAcceso.css';

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
    <main className="pagina pagina-punto-acceso">
      <EncabezadoPagina titulo="Punto de acceso" />

      <div className="contenido-pagina">
        <p className="texto-guia">
          Presenta el rostro del cliente frente a la cámara. El intento queda registrado
          siempre, tanto si se autoriza como si se rechaza.
        </p>

        {error && (
          <div className="alerta alerta-error" role="alert">
            <IconoAlerta />
            <span className="alerta-texto">{error}</span>
            <button type="button" className="boton-reintentar" onClick={reiniciar}>
              Reintentar
            </button>
          </div>
        )}

        {!resultado && (
          <section className="tarjeta-oscura tarjeta-captura">
            <CapturaFacial onDescriptor={identificar} textoBoton="Identificar" />
          </section>
        )}
        {enviando && <p className="cargando">Identificando…</p>}

        {resultado && !enviando && (
          <section className="tarjeta-oscura tarjeta-resultado">
            {resultado.autorizado ? (
              <>
                <div className="resultado resultado-ok">
                  <span className="resultado-icono" aria-hidden="true">
                    <IconoExito />
                  </span>
                  <h2 className="resultado-titulo">Acceso autorizado</h2>
                </div>
                <p className="dato-texto">
                  <strong>Cliente:</strong> {resultado.cliente.nombre}{' '}
                  {resultado.cliente.apellido}
                </p>
              </>
            ) : (
              <>
                <div className="resultado resultado-no">
                  <span className="resultado-icono" aria-hidden="true">
                    <IconoAlerta />
                  </span>
                  <h2 className="resultado-titulo">Acceso rechazado</h2>
                </div>
                <p className="dato-texto">{textoMotivo(resultado.motivo)}</p>
                {resultado.cliente && (
                  <p className="dato-texto">
                    <strong>Cliente identificado:</strong> {resultado.cliente.nombre}{' '}
                    {resultado.cliente.apellido}
                  </p>
                )}
              </>
            )}
            <div className="acciones-fila">
              <button type="button" className="boton-primario" onClick={reiniciar}>
                Nuevo intento
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
