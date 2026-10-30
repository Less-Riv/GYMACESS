// Encabezado compartido de las pantallas con tema oscuro: marca GymAccess
// (mismo icono SVG del login), título de la pantalla y botón secundario
// "Volver al inicio". Los hijos opcionales se muestran a la izquierda de ese
// botón (por ejemplo, "Volver al listado").
// Solo presentación: no toca rutas, permisos ni lógica.
import { Link } from 'react-router-dom';
import { IconoMancuerna } from './iconos.jsx';

export default function EncabezadoPagina({ titulo, children }) {
  return (
    <header className="barra-superior">
      <div className="barra-izquierda">
        <span className="barra-logo" aria-hidden="true">
          <IconoMancuerna />
        </span>
        <span className="barra-marca">
          Gym<span className="barra-marca-acento">Access</span>
        </span>
        <span className="barra-separador" aria-hidden="true" />
        <h1 className="barra-titulo">{titulo}</h1>
      </div>
      <div className="barra-acciones">
        {children}
        <Link to="/" className="boton-secundario">
          Volver al inicio
        </Link>
      </div>
    </header>
  );
}
