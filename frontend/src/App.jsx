// Enrutamiento principal del frontend (Sprint 1 y 2).
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Login from './pages/Login.jsx';
import Clientes from './pages/Clientes.jsx';
import ClienteDetalle from './pages/ClienteDetalle.jsx';
import Usuarios from './pages/Usuarios.jsx';
import MiCuenta from './pages/MiCuenta.jsx';
import TiposMembresia from './pages/TiposMembresia.jsx';
import Membresias from './pages/Membresias.jsx';
import Pagos from './pages/Pagos.jsx';
import PuntoAcceso from './pages/PuntoAcceso.jsx';
import Accesos from './pages/Accesos.jsx';
import Entrenadores from './pages/Entrenadores.jsx';
import Rutinas from './pages/Rutinas.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Personal from './pages/Personal.jsx';
import Reportes from './pages/Reportes.jsx';
// Estilos del menú de inicio (tema oscuro, mismas variables compartidas).
import './pages/Inicio.css';

// Icono del logo (mismo SVG de mancuerna que usan el login y Usuarios).
const ICONO_MANCUERNA = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="1.6" y="8.6" width="3.2" height="6.8" rx="1.1" />
    <rect x="19.2" y="8.6" width="3.2" height="6.8" rx="1.1" />
    <rect x="5.6" y="10.4" width="12.8" height="3.2" rx="1.6" />
  </svg>
);

// Módulos del menú de inicio, agrupados por área. Cada `visible` replica
// EXACTAMENTE la condición por rol que tenía el enlace original (no se
// tocaron permisos ni rutas): los grupos sin módulos visibles para el rol
// del usuario se omiten por completo, incluido su subtítulo.
const MODULOS = [
  {
    titulo: 'Personas',
    items: [
      {
        ruta: '/clientes',
        nombre: 'Clientes',
        descripcion: 'Ficha, membresías y seguimiento de cada cliente.',
        visible: (rol) => rol === 'administrador' || rol === 'recepcionista' || rol === 'entrenador',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3.5 19c.9-3 3-4.6 5.5-4.6s4.6 1.6 5.5 4.6" />
            <path d="M16 5.6a3 3 0 0 1 0 5.6" />
            <path d="M17.6 14.7c2 .5 3.4 1.9 3.9 4.3" />
          </svg>
        ),
      },
      {
        ruta: '/usuarios',
        nombre: 'Usuarios',
        descripcion: 'Cuentas del personal y asignación de roles.',
        visible: (rol) => rol === 'administrador',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="10" cy="8" r="3.4" />
            <path d="M4 19.2c1-3.2 3.4-4.9 6-4.9 1.1 0 2.2.3 3.1.8" />
            <path d="m15 16.8 2 2 3.6-3.9" />
          </svg>
        ),
      },
      {
        ruta: '/entrenadores',
        nombre: 'Entrenadores',
        descripcion: 'Directorio de entrenadores y disponibilidad.',
        visible: (rol) => rol === 'administrador',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 9v6M4.8 10.2v3.6M17 9v6M19.2 10.2v3.6M7 12h10" />
          </svg>
        ),
      },
      {
        ruta: '/personal',
        nombre: 'Personal',
        descripcion: 'Carga de entrenadores y asignaciones.',
        visible: (rol) => rol === 'administrador' || rol === 'recepcionista',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <circle cx="12" cy="10" r="2.3" />
            <path d="M8.2 17c.7-1.9 2.1-2.9 3.8-2.9s3.1 1 3.8 2.9" />
          </svg>
        ),
      },
    ],
  },
  {
    titulo: 'Membresías y pagos',
    items: [
      {
        ruta: '/tipos-membresia',
        nombre: 'Tipos de membresía',
        descripcion: 'Planes, precios y duración de cada membresía.',
        visible: (rol) => rol === 'administrador',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11.5 3.5h7a2 2 0 0 1 2 2v7L11 18l-7.5-7.5 8-7Z" />
            <circle cx="16.7" cy="7.3" r="1.3" />
          </svg>
        ),
      },
      {
        ruta: '/membresias',
        nombre: 'Membresías',
        descripcion: 'Altas, renovaciones y vigencias.',
        visible: (rol) => rol === 'administrador' || rol === 'recepcionista' || rol === 'entrenador',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2.5" />
            <path d="M3 10h18" />
            <path d="M7 14.5h5" />
          </svg>
        ),
      },
      {
        ruta: '/pagos',
        nombre: 'Pagos',
        descripcion: 'Registro y consulta de pagos.',
        visible: (rol) => rol === 'administrador' || rol === 'recepcionista',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="6.5" width="18" height="11" rx="2.5" />
            <circle cx="12" cy="12" r="2.6" />
            <path d="M6.5 12h.01M17.5 12h.01" />
          </svg>
        ),
      },
    ],
  },
  {
    titulo: 'Control de acceso',
    items: [
      {
        ruta: '/punto-acceso',
        nombre: 'Punto de acceso',
        descripcion: 'Control de entrada con rostro o código.',
        visible: (rol) => rol === 'administrador' || rol === 'recepcionista',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8.5V6a2 2 0 0 1 2-2h2.5" />
            <path d="M15.5 4H18a2 2 0 0 1 2 2v2.5" />
            <path d="M20 15.5V18a2 2 0 0 1-2 2h-2.5" />
            <path d="M8.5 20H6a2 2 0 0 1-2-2v-2.5" />
            <circle cx="12" cy="10.8" r="2.2" />
            <path d="M8.6 16.4c.7-1.5 2-2.3 3.4-2.3s2.7.8 3.4 2.3" />
          </svg>
        ),
      },
      {
        ruta: '/accesos',
        nombre: 'Accesos',
        descripcion: 'Historial de entradas al gimnasio.',
        visible: (rol) => rol === 'administrador' || rol === 'recepcionista' || rol === 'entrenador',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6h11M9 12h11M9 18h11" />
            <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="2.6" />
          </svg>
        ),
      },
    ],
  },
  {
    titulo: 'Entrenamiento y análisis',
    items: [
      {
        ruta: '/rutinas',
        nombre: 'Rutinas',
        descripcion: 'Plantillas de rutinas y ejercicios.',
        visible: (rol) => rol === 'administrador' || rol === 'recepcionista' || rol === 'entrenador',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
            <path d="M3.5 9.5h17M8 3.2v3.4M16 3.2v3.4" />
            <path d="m9 14.6 2.1 2.1 3.9-4" />
          </svg>
        ),
      },
      {
        ruta: '/dashboard',
        nombre: 'Dashboard',
        descripcion: 'Indicadores de socios, ingresos y accesos.',
        visible: (rol) => rol === 'administrador',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 20h16" />
            <path d="M7 17v-5M12 17V8M17 17v-7" strokeWidth="2.2" />
          </svg>
        ),
      },
      {
        ruta: '/reportes',
        nombre: 'Reportes',
        descripcion: 'Clientes, membresías, pagos, adeudos y accesos.',
        visible: (rol) => rol === 'administrador',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 3.5h8l4 4v13H6z" />
            <path d="M14 3.5v4h4" />
            <path d="M9 12h6M9 15.5h6" />
          </svg>
        ),
      },
    ],
  },
  {
    titulo: 'Cuenta',
    items: [
      {
        ruta: '/mi-cuenta',
        nombre: 'Mi cuenta',
        descripcion: 'Tu perfil, tu membresía y tu entrenamiento.',
        visible: (rol) => rol === 'cliente',
        icono: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8.2" r="3.4" />
            <path d="M5.5 19.5c1-3.4 3.6-5.2 6.5-5.2 1.3 0 2.5.4 3.5 1" />
            <path d="m15.6 17.4 1.8 1.8 3.3-3.6" />
          </svg>
        ),
      },
    ],
  },
];

function Inicio() {
  const { usuario, cerrarSesion } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;

  // Solo presentación: iniciales del nombre y el rol con la primera letra
  // en mayúscula seguido del valor crudo que entrega el backend.
  const iniciales = usuario.nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const rolTitulo = usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1);

  return (
    <main className="pagina-inicio">
      {/* Barra superior: marca, chip del usuario y cierre de sesión. */}
      <header className="barra-superior">
        <div className="barra-izquierda">
          <span className="barra-logo" aria-hidden="true">{ICONO_MANCUERNA}</span>
          <span className="barra-marca">
            Gym<span className="barra-marca-acento">Access</span>
          </span>
        </div>
        <div className="barra-derecha">
          <div className="chip-usuario">
            <span className="chip-iniciales" aria-hidden="true">{iniciales}</span>
            <span className="chip-datos">
              <span className="chip-nombre">{usuario.nombre}</span>
              <span className="chip-rol">{rolTitulo} · {usuario.rol}</span>
            </span>
          </div>
          <button type="button" className="boton-secundario" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="inicio-contenido">
        {/* Bienvenida */}
        <section className="bienvenida">
          <h1 className="bienvenida-titulo">
            Hola, <span className="bienvenida-nombre">{usuario.nombre}</span>
          </h1>
          <p className="bienvenida-sub">Elige un módulo para empezar.</p>
        </section>

        {/* Módulos agrupados: los grupos sin tarjetas visibles no se pintan. */}
        {MODULOS.map((grupo) => {
          const visibles = grupo.items.filter((item) => item.visible(usuario.rol));
          if (visibles.length === 0) return null;
          return (
            <section className="grupo" key={grupo.titulo}>
              <h2 className="grupo-titulo">{grupo.titulo}</h2>
              <div className="modulos">
                {visibles.map((item) => (
                  <Link className="modulo" to={item.ruta} key={item.ruta}>
                    <span className="modulo-icono" aria-hidden="true">{item.icono}</span>
                    <span className="modulo-nombre">{item.nombre}</span>
                    <span className="modulo-descripcion">{item.descripcion}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/clientes"
        element={
          <RutaProtegida roles={['administrador', 'recepcionista', 'entrenador']}>
            <Clientes />
          </RutaProtegida>
        }
      />
      <Route
        path="/clientes/:id"
        element={
          <RutaProtegida roles={['administrador', 'recepcionista']}>
            <ClienteDetalle />
          </RutaProtegida>
        }
      />
      <Route
        path="/rutinas"
        element={
          <RutaProtegida roles={['administrador', 'recepcionista', 'entrenador']}>
            <Rutinas />
          </RutaProtegida>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RutaProtegida roles={['administrador']}>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route
        path="/reportes"
        element={
          <RutaProtegida roles={['administrador']}>
            <Reportes />
          </RutaProtegida>
        }
      />
      <Route
        path="/personal"
        element={
          <RutaProtegida roles={['administrador', 'recepcionista']}>
            <Personal />
          </RutaProtegida>
        }
      />
      <Route
        path="/entrenadores"
        element={
          <RutaProtegida roles={['administrador', 'recepcionista']}>
            <Entrenadores />
          </RutaProtegida>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RutaProtegida roles={['administrador']}>
            <Usuarios />
          </RutaProtegida>
        }
      />
      <Route
        path="/tipos-membresia"
        element={
          <RutaProtegida roles={['administrador']}>
            <TiposMembresia />
          </RutaProtegida>
        }
      />
      <Route
        path="/membresias"
        element={
          <RutaProtegida roles={['administrador', 'recepcionista', 'entrenador']}>
            <Membresias />
          </RutaProtegida>
        }
      />
      <Route
        path="/pagos"
        element={
          <RutaProtegida roles={['administrador', 'recepcionista']}>
            <Pagos />
          </RutaProtegida>
        }
      />
      <Route
        path="/punto-acceso"
        element={
          <RutaProtegida roles={['administrador', 'recepcionista']}>
            <PuntoAcceso />
          </RutaProtegida>
        }
      />
      <Route
        path="/accesos"
        element={
          <RutaProtegida roles={['administrador', 'recepcionista', 'entrenador']}>
            <Accesos />
          </RutaProtegida>
        }
      />
      <Route
        path="/mi-cuenta"
        element={
          <RutaProtegida roles={['cliente']}>
            <MiCuenta />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
