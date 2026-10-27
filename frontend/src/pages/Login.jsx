// Página de inicio de sesión (T028, US1).
// Pantalla partida a pantalla completa: panel de marca con carrusel animado
// (izquierda, decorativa) y formulario de acceso sobre fondo oscuro (derecha).
// La lógica de autenticación, los campos (correo y contraseña) y la llamada
// a la API no cambian respecto del Sprint 1.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

// Cada rol redirige a su pantalla principal tras iniciar sesión.
const DESTINOS_POR_ROL = {
  administrador: '/usuarios',
  recepcionista: '/clientes',
  entrenador: '/clientes',
  cliente: '/mi-cuenta',
};

// Contenido de los tres slides del carrusel del panel izquierdo.
const SLIDES = ['reconocimiento', 'accesos', 'marca'];

const INTERVALO_SLIDE_MS = 4000;

// Icono SVG sencillo del logo (mancuerna): se usa en la marca del panel y
// en la tarjeta de marca del carrusel. Sin librerías externas.
const ICONO_MANCUERNA = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="1.6" y="8.6" width="3.2" height="6.8" rx="1.1" />
    <rect x="19.2" y="8.6" width="3.2" height="6.8" rx="1.1" />
    <rect x="5.6" y="10.4" width="12.8" height="3.2" rx="1.6" />
  </svg>
);

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [slideActivo, setSlideActivo] = useState(0);
  const [reducirMovimiento, setReducirMovimiento] = useState(false);

  // Si el usuario pide menos movimiento, el carrusel deja de avanzar solo
  // (las transiciones se desactivan desde el CSS con la misma consulta).
  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aplicar = () => setReducirMovimiento(consulta.matches);
    aplicar();
    consulta.addEventListener('change', aplicar);
    return () => consulta.removeEventListener('change', aplicar);
  }, []);

  // Avance automático cada 4 s. Al depender del slide activo, hacer clic en
  // un punto también reinicia la cuenta atrás.
  useEffect(() => {
    if (reducirMovimiento) return undefined;
    const temporizador = setInterval(() => {
      setSlideActivo((actual) => (actual + 1) % SLIDES.length);
    }, INTERVALO_SLIDE_MS);
    return () => clearInterval(temporizador);
  }, [slideActivo, reducirMovimiento]);

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

  function elegirSlide(indice) {
    setSlideActivo(indice);
  }

  return (
    <main className="pagina-login">
      {/* Panel de marca: carrusel con las tarjetas animadas (solo decorativo,
          la operativa real vive en el formulario). */}
      <aside className="login-panel" aria-label="GymAccess">
        <div className="login-marca">
          <span className="login-logo" aria-hidden="true">{ICONO_MANCUERNA}</span>
          <span className="login-nombre">
            Gym<span className="login-nombre-acento">Access</span>
          </span>
        </div>

        {/* Titular del panel: mensaje principal, siempre visible (los slides
            del carrusel cambian debajo). */}
        <h2 className="login-titular">
          Controla quién entra, <span className="titular-acento">sin filas.</span>
        </h2>

        <div className="carrusel" role="group" aria-label="Destacados de GymAccess">
          {/* Slide 1: reconocimiento facial */}
          <div
            className={`carrusel-diapositiva${slideActivo === 0 ? ' activa' : ''}`}
            aria-hidden={slideActivo !== 0}
          >
            <div className="tarjeta-flotante tarjeta-facial">
              <div className="marco-rostro" aria-hidden="true">
                <span className="esquina esquina-sup-izq" />
                <span className="esquina esquina-sup-der" />
                <span className="esquina esquina-inf-izq" />
                <span className="esquina esquina-inf-der" />
                {/* Rostro simple en SVG, dentro del recuadro tipo escáner. */}
                <svg className="rostro-svg" viewBox="0 0 48 48" aria-hidden="true">
                  <circle cx="24" cy="20" r="11" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" />
                  <circle cx="20" cy="18.5" r="1.7" fill="rgba(255,255,255,0.9)" />
                  <circle cx="28" cy="18.5" r="1.7" fill="rgba(255,255,255,0.9)" />
                  <path d="M19 24.5c1.4 1.9 3.1 2.8 5 2.8s3.6-.9 5-2.8" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M14 38c2.6-4 6-6 10-6s7.4 2 10 6" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="tarjeta-facial-datos">
                <p className="tarjeta-facial-nombre">Min Cabrera</p>
                <p className="tarjeta-facial-rol">Membresía mensual activa</p>
                <span className="chip-acceso">
                  <span className="chip-acceso-punto" aria-hidden="true" />
                  Acceso autorizado
                </span>
              </div>
            </div>
          </div>

          {/* Slide 2: accesos del día */}
          <div
            className={`carrusel-diapositiva${slideActivo === 1 ? ' activa' : ''}`}
            aria-hidden={slideActivo !== 1}
          >
            <div className="tarjeta-flotante tarjeta-accesos">
              <p className="tarjeta-accesos-cifra">128</p>
              <p className="tarjeta-accesos-etiqueta">accesos hoy</p>
              <ul className="tarjeta-accesos-detalle">
                <li>
                  <span>Reconocimiento facial</span>
                  <strong>96</strong>
                </li>
                <li>
                  <span>Código de acceso</span>
                  <strong>32</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Slide 3: mensaje de marca */}
          <div
            className={`carrusel-diapositiva${slideActivo === 2 ? ' activa' : ''}`}
            aria-hidden={slideActivo !== 2}
          >
            <div className="tarjeta-flotante tarjeta-marca">
              <div className="tarjeta-marca-cabecera">
                <span className="tarjeta-marca-logo" aria-hidden="true">{ICONO_MANCUERNA}</span>
                <p className="tarjeta-marca-titulo">GymAccess</p>
              </div>
              <p className="tarjeta-marca-lema">Gestión de gimnasio</p>
            </div>
          </div>

          {/* Puntos del carrusel: clic para elegir slide */}
          <div className="carrusel-puntos">
            {SLIDES.map((slide, indice) => (
              <button
                key={slide}
                type="button"
                className={`carrusel-punto${slideActivo === indice ? ' activo' : ''}`}
                onClick={() => elegirSlide(indice)}
                aria-label={`Ir al destacado ${indice + 1} de ${SLIDES.length}`}
                aria-current={slideActivo === indice ? 'true' : undefined}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Formulario: mismos campos, lógica y redirección que el Sprint 1,
          solo cambia la apariencia (fondo oscuro) y se agrega el botón de
          mostrar/ocultar contraseña. */}
      <section className="login-formulario">
        <form className="tarjeta tarjeta-login" onSubmit={manejarEnvio}>
          <h1>Iniciar sesión en GymAccess</h1>

          <div className="campo">
            <label htmlFor="login-correo">Correo</label>
            <input
              id="login-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="campo">
            <label htmlFor="login-password">Contraseña</label>
            <div className="campo-password">
              <input
                id="login-password"
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              {/* Solo presentación: alterna el tipo del input, no toca el
                  valor ni la lógica de autenticación. */}
              <button
                type="button"
                className="boton-ojo"
                onClick={() => setMostrarPassword((visible) => !visible)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarPassword}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.6-6.2 10-6.2S22 12 22 12s-3.6 6.2-10 6.2S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="2.6" />
                  {mostrarPassword && <path d="M4 20 20 4" />}
                </svg>
              </button>
            </div>
          </div>

          {error && <p className="mensaje-error" role="alert">{error}</p>}

          <button type="submit" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Iniciar sesión'}
          </button>

          <p className="nota-ayuda">
            ¿Olvidaste tu contraseña? Pide a recepción que la restablezca.
          </p>
        </form>
      </section>
    </main>
  );
}
