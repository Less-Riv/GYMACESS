// Página del dashboard administrativo (T055, US6; FR-016, FR-017, FR-018).
// Exclusiva del administrador: el backend responde 403 a los demás roles
// (FR-025); el filtro de periodo recalcula los indicadores en cada consulta.
// La lógica no cambia: mismos estados, misma función cargar con su periodo,
// mismo efecto de auditoría (con su bandera vivo y su fallback), misma
// función limpiarPeriodo y los mismos indicadores; solo se rediseña la
// presentación con el tema oscuro compartido.
import { useCallback, useEffect, useState } from 'react';
import { obtenerDashboard, pedir } from '../services/api.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';
import TarjetaIndicador from '../components/TarjetaIndicador.jsx';

// Chip del resultado de auditoría según el valor del backend ('exitoso',
// 'autorizado', 'rechazado'); los valores no previstos quedan con el estilo
// neutro base del chip.
const CLASES_RESULTADO = {
  exitoso: 'chip-activo',
  autorizado: 'chip-autorizado',
  rechazado: 'chip-rechazado',
};

export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [auditoria, setAuditoria] = useState([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      const consulta = params.toString();
      const respuesta = await obtenerDashboard(consulta ? `?${consulta}` : '');
      setDatos(respuesta);
      setError('');
      setMensaje('Indicadores actualizados.');
    } catch (e) {
      setError(e.message);
    }
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Auditoría del sprint (FR-020): solo el administrador puede consultarla;
  // una falla aquí no bloquea los indicadores.
  useEffect(() => {
    let vivo = true;
    async function cargarAuditoria() {
      try {
        const respuesta = await pedir('/auditoria');
        if (vivo) setAuditoria(respuesta.auditoria || respuesta.registros || []);
      } catch (_e) {
        // Sin auditoría disponible: la página sigue siendo útil sin ella.
      }
    }
    cargarAuditoria();
    return () => {
      vivo = false;
    };
  }, []);

  function limpiarPeriodo() {
    setDesde('');
    setHasta('');
  }

  if (!datos) {
    return (
      <main className="pagina pagina-dashboard">
        <EncabezadoPagina titulo="Dashboard" />
        <div className="contenido-pagina">
          {error ? (
            <div className="alerta alerta-error" role="alert">
              <IconoAlerta />
              <span className="alerta-texto">{error}</span>
              <button type="button" className="boton-reintentar" onClick={cargar}>
                Reintentar
              </button>
            </div>
          ) : (
            <p className="cargando">Cargando indicadores…</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="pagina pagina-dashboard">
      <EncabezadoPagina titulo="Dashboard administrativo" />

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

        <form
          className="tarjeta-oscura filtros"
          onSubmit={(ev) => {
            ev.preventDefault();
            cargar();
          }}
        >
          <div className="campo">
            <label htmlFor="dashboard-desde">Desde</label>
            <input
              id="dashboard-desde"
              type="date"
              value={desde}
              onChange={(ev) => setDesde(ev.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="dashboard-hasta">Hasta</label>
            <input
              id="dashboard-hasta"
              type="date"
              value={hasta}
              onChange={(ev) => setHasta(ev.target.value)}
            />
          </div>
          <button type="submit" className="boton-primario">
            Aplicar periodo
          </button>
          <button type="button" className="boton-secundario" onClick={limpiarPeriodo}>
            Periodo por defecto
          </button>
        </form>

        <p className="dato-texto">
          Periodo: <strong>{datos.periodo.desde}</strong> al{' '}
          <strong>{datos.periodo.hasta}</strong>
        </p>

        <section className="tarjeta-oscura">
          <h2>Clientes y membresías</h2>
          <div className="indicadores">
            <TarjetaIndicador etiqueta="Clientes activos" valor={datos.clientes.activos} />
            <TarjetaIndicador etiqueta="Membresías vigentes" valor={datos.membresias.vigentes} />
            <TarjetaIndicador etiqueta="Membresías vencidas" valor={datos.membresias.vencidas} />
            <TarjetaIndicador etiqueta="Accesos del periodo" valor={datos.accesos.recientes} />
            <TarjetaIndicador etiqueta="Accesos rechazados" valor={datos.accesos.rechazados} />
          </div>
        </section>

        <section className="tarjeta-oscura">
          <h2>Entrenamiento</h2>
          <div className="indicadores">
            <TarjetaIndicador etiqueta="Entrenadores registrados" valor={datos.entrenadores.registrados} />
            <TarjetaIndicador etiqueta="Entrenadores activos" valor={datos.entrenadores.activos} />
            <TarjetaIndicador
              etiqueta="Clientes con entrenador"
              valor={datos.asignaciones.con_entrenador}
            />
            <TarjetaIndicador
              etiqueta="Clientes sin entrenador"
              valor={datos.asignaciones.sin_entrenador}
            />
            <TarjetaIndicador etiqueta="Rutinas activas" valor={datos.rutinas.activas} />
          </div>
        </section>

        <section className="tarjeta-oscura">
          <h2>Objetivos y progresos del periodo</h2>
          <div className="indicadores">
            <TarjetaIndicador etiqueta="Objetivos cumplidos" valor={datos.objetivos.cumplidos} />
            <TarjetaIndicador etiqueta="Objetivos pendientes" valor={datos.objetivos.pendientes} />
            <TarjetaIndicador
              etiqueta="% de objetivos cumplidos"
              valor={datos.objetivos.porcentaje_cumplidos}
              sufijo="%"
            />
            <TarjetaIndicador etiqueta="Progresos registrados" valor={datos.progresos.registrados} />
          </div>
        </section>

        <section className="tarjeta-oscura">
          <h2>Auditoría reciente</h2>
          {auditoria.length === 0 ? (
            <p className="estado-vacio">Sin registros de auditoría todavía.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-oscura">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Módulo</th>
                    <th>Resultado</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.slice(0, 20).map((registro) => (
                    <tr key={registro.id_auditoria || registro.fecha}>
                      <td>{registro.fecha}</td>
                      <td>{registro.nombre_usuario || registro.id_usuario}</td>
                      <td>{registro.accion}</td>
                      <td>{registro.modulo}</td>
                      <td>
                        <span className={`chip ${CLASES_RESULTADO[registro.resultado] || ''}`}>
                          {registro.resultado}
                        </span>
                      </td>
                      <td>{registro.descripcion}</td>
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
