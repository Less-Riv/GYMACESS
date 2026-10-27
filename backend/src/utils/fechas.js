// Normalización de fechas de MySQL para la respuesta HTTP (data-model.md).
//
// mysql2 devuelve las columnas DATE como objeto `Date` de JavaScript y
// `JSON.stringify` las serializa como `2026-09-01T06:00:00.000Z`, que no es el
// formato `YYYY-MM-DD` que exigen los contratos. Todas las proyecciones de
// respuesta pasan por aquí para devolver siempre texto.
export function aFechaISO(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  return new Date(valor).toISOString().slice(0, 10);
}
