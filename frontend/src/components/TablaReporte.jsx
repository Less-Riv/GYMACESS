// Tabla de los reportes del Sprint 4 (T010; FR-014, FR-015).
// Presenta las filas del reporte con las columnas que cada una define, el
// estado vacío con un mensaje claro (FR-015, RN-33) y la paginación del
// listado (FR-014). Es de presentación: no consulta nada y avisa al padre
// cuando se cambia de página.
export default function TablaReporte({
  columnas = [],
  filas = [],
  paginacion = null,
  onCambiarPagina,
  cargando = false,
  vacio = 'No hay datos para el filtro elegido.',
}) {
  if (!cargando && filas.length === 0) {
    return <p className="estado-vacio">{vacio}</p>;
  }

  const pagina = paginacion?.pagina ?? 1;
  const totalPaginas = paginacion?.totalPaginas ?? 0;
  const total = paginacion?.total ?? filas.length;

  return (
    <>
      <div className="tabla-contenedor">
        <table className="tabla-oscura">
          <thead>
            <tr>
              {columnas.map((columna) => (
                <th key={columna.clave}>{columna.etiqueta}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, indice) => (
              <tr key={fila.id ?? indice}>
                {columnas.map((columna) => (
                  <td key={columna.clave}>
                    {columna.render ? columna.render(fila) : (fila[columna.clave] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="filtros">
          <p className="dato-texto">
            Página {pagina} de {totalPaginas} · {total} registros
          </p>
          <button
            type="button"
            className="boton-secundario"
            onClick={() => onCambiarPagina(pagina - 1)}
            disabled={pagina <= 1}
          >
            Anterior
          </button>
          <button
            type="button"
            className="boton-secundario"
            onClick={() => onCambiarPagina(pagina + 1)}
            disabled={pagina >= totalPaginas}
          >
            Siguiente
          </button>
        </div>
      )}
    </>
  );
}
