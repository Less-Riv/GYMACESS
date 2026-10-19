// Contexto global mínimo de sesión (research.md D3): token JWT y usuario
// autenticado, persistidos en localStorage y validados contra el backend.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  pedir,
  guardarSesion,
  borrarSesion,
  obtenerToken,
  obtenerUsuarioGuardado,
  configurarCierreSesion,
} from '../services/api.js';

const ContextoAuth = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerUsuarioGuardado());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // La sesión se hidrata desde localStorage; la autoridad real sigue en el
    // backend, que rechaza tokens inválidos o usuarios desactivados.
    setCargando(false);
  }, []);

  useEffect(() => {
    configurarCierreSesion(() => setUsuario(null));
  }, []);

  const iniciarSesion = useCallback(async (correo, password) => {
    const datos = await pedir('/auth/login', {
      metodo: 'POST',
      cuerpo: { correo, password },
    });
    guardarSesion(datos.token, datos.usuario);
    setUsuario(datos.usuario);
    return datos.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    setUsuario(null);
  }, []);

  const valor = {
    usuario,
    cargando,
    autenticado: Boolean(usuario && obtenerToken()),
    iniciarSesion,
    cerrarSesion,
  };

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

export function useAuth() {
  return useContext(ContextoAuth);
}
