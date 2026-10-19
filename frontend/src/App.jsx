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

function Inicio() {
  const { usuario, cerrarSesion } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;

  return (
    <main className="pagina-centrada">
      <div className="tarjeta">
        <h1>Sistema de Gestión de Gimnasio</h1>
        <p>Hola, {usuario.nombre} ({usuario.rol}).</p>
        <nav>
          {(usuario.rol === 'administrador' || usuario.rol === 'recepcionista' || usuario.rol === 'entrenador') && (
            <Link to="/clientes">Clientes</Link>
          )}
          {usuario.rol === 'administrador' && <Link to="/usuarios">Usuarios</Link>}
          {usuario.rol === 'administrador' && (
            <Link to="/tipos-membresia">Tipos de membresía</Link>
          )}
          {(usuario.rol === 'administrador' ||
            usuario.rol === 'recepcionista' ||
            usuario.rol === 'entrenador') && (
            <Link to="/membresias">Membresías</Link>
          )}
          {(usuario.rol === 'administrador' || usuario.rol === 'recepcionista') && (
            <Link to="/pagos">Pagos</Link>
          )}
          {(usuario.rol === 'administrador' || usuario.rol === 'recepcionista') && (
            <Link to="/punto-acceso">Punto de acceso</Link>
          )}
          {(usuario.rol === 'administrador' ||
            usuario.rol === 'recepcionista' ||
            usuario.rol === 'entrenador') && (
            <Link to="/accesos">Accesos</Link>
          )}
          {usuario.rol === 'cliente' && <Link to="/mi-cuenta">Mi cuenta</Link>}
        </nav>
        <button onClick={cerrarSesion}>Cerrar sesión</button>
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
