// Página de consulta de accesos (T068, US-S2-09).
// Tres vistas según rol (principio VI de docs/reglas.md):
// - administrador y recepcionista: listado completo con filtros de fecha,
//   resultado y cliente, incluyendo motivos de rechazo (FR-015).
// - entrenador: vista básica (cliente, fecha, hora y resultado), SIN motivos.
// El cliente no accede a esta página; consulta los suyos en "Mi cuenta"
// (/api/accesos/mis-accesos, FR-028).
// La lógica no cambia: mismos estados, misma función cargar con sus
// parámetros y dependencias, mismos filtros y mismas columnas condicionales
// por rol; solo se rediseña la presentación con el tema oscuro compartido.
import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';

// Chip de resultado según el valor del backend; los no previstos quedan con
// el estilo neutro base del chip.
const CLASES_RESULTADO = {
  autorizado: 'chip-autorizado',
  rechazado: 'chip-rechazado',
};

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
    <main className="pagina pagina-accesos">
      <EncabezadoPagina titulo="Accesos" />

      <div className="contenido-pagina">
        {esBasico && (
          <div className="alerta alerta-info" role="note">
            <span className="alerta-texto">
              <em>
                Vista básica: se muestran cliente, fecha, hora y resultado. Los motivos de
                rechazo no están disponibles para tu rol.
              </em>
            </span>
          </div>
        )}

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

        {!esBasico && (
          <section className="tarjeta-oscura">
            <div className="filtros">
              <div className="campo">
                <label htmlFor="acceso-fecha">Fecha</label>
                <input
                  id="acceso-fecha"
                  type="date"
                  value={filtros.fecha}
                  onChange={(e) => cambiarFiltro('fecha', e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="acceso-resultado">Resultado</label>
                <select
                  id="acceso-resultado"
                  value={filtros.resultado}
                  onChange={(e) => cambiarFiltro('resultado', e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="autorizado">Autorizado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
              <button
                type="button"
                className="boton-secundario"
                onClick={() => setFiltros({ fecha: '', resultado: '' })}
              >
                Limpiar filtros
              </button>
            </div>
          </section>
        )}

        <section className="tarjeta-oscura">
          <div className="listado-cabecera">
            <h2>Registros de acceso</h2>
            <span className="listado-total">{accesos.length}</span>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla-oscura">
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
                    <td>
                      <span
                        className={`chip ${CLASES_RESULTADO[acceso.resultado] || ''}`}
                      >
                        {acceso.resultado}
                      </span>
                    </td>
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
          </div>
        </section>
      </div>
    </main>
  );
}
