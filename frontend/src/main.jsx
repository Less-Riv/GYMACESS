import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
// Variables de color y accesibilidad del tema (compartidas por todas las
// pantallas; ver frontend/src/styles/tema.css).
import './styles/tema.css';
import './estilos.css';

// Punto de entrada de la aplicación React (Sprint 1).
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
