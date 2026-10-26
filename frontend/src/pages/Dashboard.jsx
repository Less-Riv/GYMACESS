// Página del dashboard administrativo (T055, US6; FR-016, FR-017, FR-018).
// Exclusiva del administrador: el backend responde 403 a los demás roles
// (FR-025); el filtro de periodo recalcula los indicadores en cada consulta.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerDashboard, pedir } from '../services/api.js';
import TarjetaIndicador from '../components/TarjetaIndicador.jsx';

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
      <main style={{ padding: '2rem' }}>
        <h1>Dashboard</h1>
        {error ? <p className="mensaje-error">{error}</p> : <p>Cargando indicadores…</p>}
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1>Dashboard administrativo</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          cargar();
        }}
        style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}
      >
        <label>
          Desde
          <input type="date" value={desde} onChange={(ev) => setDesde(ev.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={hasta} onChange={(ev) => setHasta(ev.target.value)} />
        </label>
        <button type="submit">Aplicar periodo</button>
        <button type="button" onClick={limpiarPeriodo}>
          Periodo por defecto
        </button>
      </form>

      <p>
        Periodo: <strong>{datos.periodo.desde}</strong> al <strong>{datos.periodo.hasta}</strong>
      </p>

      <section>
        <h2>Clientes y membresías</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <TarjetaIndicador etiqueta="Clientes activos" valor={datos.clientes.activos} />
          <TarjetaIndicador etiqueta="Membresías vigentes" valor={datos.membresias.vigentes} />
          <TarjetaIndicador etiqueta="Membresías vencidas" valor={datos.membresias.vencidas} />
          <TarjetaIndicador etiqueta="Accesos del periodo" valor={datos.accesos.recientes} />
          <TarjetaIndicador etiqueta="Accesos rechazados" valor={datos.accesos.rechazados} />
        </div>
      </section>

      <section>
        <h2>Entrenamiento</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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

      <section>
        <h2>Objetivos y progresos del periodo</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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

      <section>
        <h2>Auditoría reciente</h2>
        {auditoria.length === 0 ? (
          <p>Sin registros de auditoría todavía.</p>
        ) : (
          <table>
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
                  <td>{registro.resultado}</td>
                  <td>{registro.descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
