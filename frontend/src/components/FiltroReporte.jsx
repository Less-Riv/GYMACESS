// Filtro de los reportes del Sprint 4 (T010; FR-012, FR-013, FR-015).
// Reúne el periodo (desde y hasta), el estado cuando el reporte lo admite y
// los periodos predefinidos (hoy, semana, mes y personalizado). Es un
// componente de presentación: no consulta nada y avisa al padre con los
// filtros aplicados.
import { useState } from 'react';

// Periodos predefinidos del filtro (research.md §D3).
const PERIODOS = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: 'semana', etiqueta: 'Semana' },
  { id: 'mes', etiqueta: 'Mes' },
  { id: 'personalizado', etiqueta: 'Personalizado' },
];

function fechaISO(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

// Calcula el rango del periodo predefinido elegido.
function rangoDePeriodo(periodo) {
  const hoy = fechaISO(0);
  if (periodo === 'hoy') return { desde: hoy, hasta: hoy };
  if (periodo === 'semana') return { desde: fechaISO(-6), hasta: hoy };
  if (periodo === 'mes') return { desde: fechaISO(-29), hasta: hoy };
  return null;
}

export default function FiltroReporte({
  estados = [],
  onAplicar,
  onLimpiar,
  cargando = false,
}) {
  const [periodo, setPeriodo] = useState('mes');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('');

  function aplicar() {
    const rango = rangoDePeriodo(periodo);
    const filtros = {
      desde: rango ? rango.desde : desde,
      hasta: rango ? rango.hasta : hasta,
      estado: estado || undefined,
    };
    onAplicar(filtros);
  }

  function limpiar() {
    setPeriodo('mes');
    setDesde('');
    setHasta('');
    setEstado('');
    onLimpiar();
  }

  const personalizado = periodo === 'personalizado';

  return (
    <form
      className="tarjeta-oscura filtros"
      onSubmit={(ev) => {
        ev.preventDefault();
        aplicar();
      }}
    >
      <div className="campo">
        <label htmlFor="reporte-periodo">Periodo</label>
        <select
          id="reporte-periodo"
          value={periodo}
          onChange={(ev) => setPeriodo(ev.target.value)}
        >
          {PERIODOS.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </div>

      {personalizado && (
        <>
          <div className="campo">
            <label htmlFor="reporte-desde">Desde</label>
            <input
              id="reporte-desde"
              type="date"
              value={desde}
              onChange={(ev) => setDesde(ev.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="reporte-hasta">Hasta</label>
            <input
              id="reporte-hasta"
              type="date"
              value={hasta}
              onChange={(ev) => setHasta(ev.target.value)}
            />
          </div>
        </>
      )}

      {estados.length > 0 && (
        <div className="campo">
          <label htmlFor="reporte-estado">Estado</label>
          <select
            id="reporte-estado"
            value={estado}
            onChange={(ev) => setEstado(ev.target.value)}
          >
            <option value="">Todos</option>
            {estados.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </div>
      )}

      <button type="submit" className="boton-primario" disabled={cargando}>
        Aplicar
      </button>
      <button type="button" className="boton-secundario" onClick={limpiar}>
        Periodo por defecto
      </button>
    </form>
  );
}
