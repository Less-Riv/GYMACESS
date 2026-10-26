// Tarjeta de indicador del dashboard (T054, US6; FR-016).
// Presenta cada indicador del contrato con su etiqueta y valor; sin datos se
// muestra el cero con su etiqueta correspondiente (US-S3-06 esc. 2).
export default function TarjetaIndicador({ etiqueta, valor, sufijo = '' }) {
  return (
    <div
      className="tarjeta"
      style={{ padding: '0.75rem', textAlign: 'center', minWidth: 140 }}
      role="group"
      aria-label={etiqueta}
    >
      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>{etiqueta}</p>
      <p style={{ margin: '0.25rem 0 0', fontSize: '1.6rem', fontWeight: 700 }}>
        {valor}
        {sufijo && <span style={{ fontSize: '1rem' }}>{sufijo}</span>}
      </p>
    </div>
  );
}
