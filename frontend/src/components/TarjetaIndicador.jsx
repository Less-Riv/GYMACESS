// Tarjeta de indicador del dashboard (T054, US6; FR-016).
// Presenta cada indicador del contrato con su etiqueta y valor; sin datos se
// muestra el cero con su etiqueta correspondiente (US-S3-06 esc. 2).
// La lógica no cambia: mismas props (etiqueta, valor, sufijo), mismo
// role="group" con aria-label; solo se sustituye la tarjeta clara por la
// tarjeta oscura del tema compartido.
export default function TarjetaIndicador({ etiqueta, valor, sufijo = '' }) {
  return (
    <div className="tarjeta-indicador" role="group" aria-label={etiqueta}>
      <p className="indicador-etiqueta">{etiqueta}</p>
      <p className="indicador-valor">
        {valor}
        {sufijo && <span className="indicador-sufijo">{sufijo}</span>}
      </p>
    </div>
  );
}
