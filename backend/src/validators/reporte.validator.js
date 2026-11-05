// Validación de los filtros de los reportes del Sprint 4 (T005; FR-012,
// FR-013, FR-016, FR-039).
// - desde y hasta son opcionales y van en formato ISO YYYY-MM-DD.
// - El periodo por defecto es el primer día del mes anterior hasta hoy, el
//   mismo criterio del dashboard (research.md §D3).
// - 400 VALIDACION si desde es posterior a hasta o si un formato no es ISO.
// - estado es opcional y se valida contra el listado del tipo de reporte; un
//   valor no previsto se rechaza (FR-013).
// - pagina es un entero mayor o igual que 1 y se normaliza a 1 cuando no es
//   válida (data-model.md §3).
import { ERRORES } from '../utils/respuestas.js';
import { validarPeriodo } from './dashboard.validator.js';

// Estados admitidos por tipo de reporte: salen del ENUM de cada tabla
// (FR-013). Los reportes de pagos y adeudos no admiten filtro por estado.
const ESTADOS_POR_TIPO = {
  clientes: ['activo', 'inactivo'],
  membresias: ['activo', 'vencida', 'suspendida', 'cancelada'],
  accesos: ['autorizado', 'rechazado'],
  pagos: [],
  adeudos: [],
};

// Tamaño de página de los listados (research.md §D2): 20 registros, el mismo
// valor que usa el módulo de clientes.
export const LIMITE_PAGINA = 20;

export function validarFiltroReporte(tipo, query) {
  const { desde, hasta } = validarPeriodo(query);

  const admitidos = ESTADOS_POR_TIPO[tipo];
  if (admitidos === undefined) {
    throw ERRORES.interno();
  }

  let estado = null;
  const estadoRecibido = query?.estado;
  if (estadoRecibido !== undefined && estadoRecibido !== null && estadoRecibido !== '') {
    if (admitidos.length === 0) {
      throw ERRORES.validacion(`El reporte de ${tipo} no admite filtro por estado`);
    }
    if (!admitidos.includes(estadoRecibido)) {
      throw ERRORES.validacion(
        `El estado debe ser uno de: ${admitidos.join(', ')}`
      );
    }
    estado = estadoRecibido;
  }

  const pagina = normalizarPagina(query?.pagina);

  return { desde, hasta, estado, pagina };
}

// La página se normaliza a 1 cuando no es un entero válido: es un parámetro
// de navegación, no un dato de negocio, y un valor raro no debe tumbar el
// reporte (data-model.md §3).
function normalizarPagina(valor) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1) {
    return 1;
  }
  return numero;
}
