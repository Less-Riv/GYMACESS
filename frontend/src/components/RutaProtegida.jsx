// Ruta protegida: exige sesión (y opcionalmente roles) para renderizar.
// La ocultación en el frontend es solo UX; la autoridad de seguridad es el
// backend (FR-005).
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RutaProtegida({ children, roles }) {
  const { autenticado, usuario } = useAuth();

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
