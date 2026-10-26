// Lógica del dashboard administrativo (T052, US6; FR-016, FR-017, FR-018).
// Compone la respuesta con el periodo efectivo y los doce indicadores de
// contracts/api-dashboard.md. El porcentaje de objetivos cumplidos se
// devuelve a un decimal como texto y es 0.0 cuando no hay objetivos del
// periodo (FR-018). Exclusivo del administrador (FR-015).
import * as dashboardModelo from '../models/dashboard.model.js';
import { validarPeriodo } from '../validators/dashboard.validator.js';

// Redondea a un decimal sin artefactos de coma flotante (0.375 → 37.5).
function unDecimal(valor) {
  return (Math.round(valor * 10) / 10).toFixed(1);
}

export async function obtenerIndicadores(query) {
  const periodo = validarPeriodo(query);

  const [
    clientes,
    membresias,
    accesos,
    entrenadores,
    rutinas,
    objetivos,
    progresos,
  ] = await Promise.all([
    dashboardModelo.indicadoresDeClientes(),
    dashboardModelo.indicadoresDeMembresias(),
    dashboardModelo.indicadoresDeAccesos(periodo.desde, periodo.hasta),
    dashboardModelo.indicadoresDeEntrenadores(),
    dashboardModelo.indicadoresDeRutinas(),
    dashboardModelo.indicadoresDeObjetivos(periodo.desde, periodo.hasta),
    dashboardModelo.indicadoresDeProgresos(periodo.desde, periodo.hasta),
  ]);

  // FR-018: sin objetivos del periodo el porcentaje es 0.0 (no NaN).
  const porcentaje =
    objetivos.total === 0 ? '0.0' : unDecimal((objetivos.cumplidos / objetivos.total) * 100);

  return {
    periodo,
    clientes: { activos: clientes.activos },
    membresias,
    accesos,
    entrenadores,
    asignaciones: {
      con_entrenador: clientes.conEntrenador,
      sin_entrenador: clientes.sinEntrenador,
    },
    rutinas,
    objetivos: {
      cumplidos: objetivos.cumplidos,
      pendientes: objetivos.pendientes,
      porcentaje_cumplidos: porcentaje,
    },
    progresos,
  };
}
