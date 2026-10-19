// Página de consulta de accesos (T068, US-S2-09).
// Tres vistas según rol (principio VI de docs/reglas.md):
// - administrador y recepcionista: listado completo con filtros de fecha,
//   resultado y cliente, incluyendo motivos de rechazo (FR-015).
// - entrenador: vista básica (cliente, fecha, hora y resultado), SIN motivos.
// El cliente no accede a esta página; consulta los suyos en "Mi cuenta"
// (/api/accesos/mis-accesos, FR-028).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Accesos() {
  const { usuario } = useAuth();
  const esBasico = usuario.rol === 'entrenador';

  const [accesos, setAccesos] = useState([]);
  const [filtros, setFiltros] = useState({ fecha: '', resultado: '' });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      // El entrenador usa la vista básica; los demás la completa con filtros.
      const rutaBase = esBasico ? '/accesos/basicos' : '/accesos';
      const parametros = new URLSearchParams();
      if (!esBasico && filtros.fecha) parametros.append('fecha', filtros.fecha);
      if (!esBasico && filtros.resultado) parametros.append('resultado', filtros.resultado);
      const consulta = parametros.toString();

      const respuesta = await pedir(`${rutaBase}${consulta ? `?${consulta}` : ''}`);
      setAccesos(respuesta.accesos);
      setMensaje('');
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [esBasico, filtros.fecha, filtros.resultado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiarFiltro(campo, valor) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }));
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <h1>Accesos</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {esBasico && (
        <p>
          <em>
            Vista básica: se muestran cliente, fecha, hora y resultado. Los motivos de rechazo no
            están disponibles para tu rol.
          </em>
        </p>
      )}

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {!esBasico && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <label>
            Fecha
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => cambiarFiltro('fecha', e.target.value)}
            />
          </label>
          <label>
            Resultado
            <select
              value={filtros.resultado}
              onChange={(e) => cambiarFiltro('resultado', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="autorizado">Autorizado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setFiltros({ fecha: '', resultado: '' })}
            style={{ alignSelf: 'flex-end' }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <table style={{ marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Cliente</th>
            <th>Resultado</th>
            {!esBasico && <th>Motivo</th>}
          </tr>
        </thead>
        <tbody>
          {accesos.map((acceso) => (
            <tr key={acceso.id_acceso}>
              <td>{acceso.fecha}</td>
              <td>{acceso.hora}</td>
              <td>
                {acceso.cliente
                  ? `${acceso.cliente.nombre} ${acceso.cliente.apellido}`
                  : '—'}
              </td>
              <td>{acceso.resultado}</td>
              {!esBasico && <td>{acceso.motivo || '—'}</td>}
            </tr>
          ))}
          {accesos.length === 0 && (
            <tr>
              <td colSpan={esBasico ? 4 : 5}>No hay registros de acceso.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
