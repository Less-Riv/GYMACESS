// Página de inicio de sesión (T028, US1).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Cada rol redirige a su pantalla principal tras iniciar sesión.
const DESTINOS_POR_ROL = {
  administrador: '/usuarios',
  recepcionista: '/clientes',
  entrenador: '/clientes',
  cliente: '/mi-cuenta',
};

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const usuario = await iniciarSesion(correo, password);
      navegar(DESTINOS_POR_ROL[usuario.rol] || '/');
    } catch (e) {
      // Se muestra el mensaje claro del backend (sin detalles internos).
      setError(e.message || 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="pagina-centrada">
      <form className="tarjeta" onSubmit={manejarEnvio}>
        <h1>Iniciar sesión</h1>
        <label>
          Correo
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="mensaje-error" role="alert">{error}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
