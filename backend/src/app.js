// Aplicación Express del backend (Sprint 1).
// Encadenamiento: rutas → middleware central de errores (FR-020).
import express from 'express';
import cors from 'cors';
import { entorno } from './config/entorno.js';
import { manejarErrores } from './middlewares/errores.js';
import { rutasSalud } from './routes/salud.routes.js';
import { rutasAuth } from './routes/auth.routes.js';
import { rutasUsuarios } from './routes/usuarios.routes.js';
import { rutasClientes } from './routes/clientes.routes.js';
import { rutasTiposMembresia } from './routes/tipos-membresia.routes.js';
import { rutasMembresias } from './routes/membresias.routes.js';
import { rutasRostros } from './routes/rostros.routes.js';
import { rutasPagos } from './routes/pagos.routes.js';
import { rutasAccesos } from './routes/accesos.routes.js';
import { rutasMiCuentaSprint2 } from './routes/mi-cuenta-sprint2.routes.js';
import { rutasEntrenadores } from './routes/entrenadores.routes.js';
import { rutasAsignaciones } from './routes/asignaciones.routes.js';
import { rutasRutinas } from './routes/rutinas.routes.js';
import { rutasObjetivos, rutasProgresos } from './routes/progresos.routes.js';
import { rutasMiEntrenamiento } from './routes/mi-entrenamiento.routes.js';
import { rutasDashboard } from './routes/dashboard.routes.js';
import { rutasPersonal } from './routes/personal.routes.js';
import { rutasAuditoria } from './routes/auditoria.routes.js';

export function crearApp() {
  const app = express();

  app.use(express.json());
  if (entorno.NODE_ENV === 'desarrollo') {
    app.use(cors());
  }

  app.use('/api', rutasSalud);
  app.use('/api/auth', rutasAuth);
  app.use('/api/usuarios', rutasUsuarios);
  app.use('/api/clientes', rutasClientes);
  app.use('/api/tipos-membresia', rutasTiposMembresia);
  app.use('/api/membresias', rutasMembresias);
  app.use('/api/rostros', rutasRostros);
  app.use('/api/pagos', rutasPagos);
  app.use('/api/accesos', rutasAccesos);
  app.use('/api/mi-cuenta', rutasMiCuentaSprint2);
  // Sprint 3: entrenadores (US-S3-01).
  app.use('/api/entrenadores', rutasEntrenadores);
  // Sprint 3: asignaciones entrenador-cliente (US-S3-02).
  app.use('/api/asignaciones', rutasAsignaciones);
  // Sprint 3: rutinas de entrenamiento (US-S3-03).
  app.use('/api/rutinas', rutasRutinas);
  // Sprint 3: objetivos y progresos (US-S3-04).
  app.use('/api/objetivos', rutasObjetivos);
  app.use('/api/progresos', rutasProgresos);
  // Sprint 3: vista propia del cliente (US-S3-05).
  app.use('/api/mi-entrenamiento', rutasMiEntrenamiento);
  // Sprint 3: dashboard administrativo (US-S3-06).
  app.use('/api/dashboard', rutasDashboard);
  // Sprint 3: consulta de la carga del personal (US-S3-07).
  app.use('/api/personal', rutasPersonal);
  // Auditoría (FR-020; contrato del Sprint 2, endpoint completado en T063).
  app.use('/api/auditoria', rutasAuditoria);

  // Ruta no encontrada → 404 con envelope consistente.
  app.use((_req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada', codigo: 'NO_ENCONTRADA' });
  });

  // Middleware central de errores: siempre el último.
  app.use(manejarErrores);

  return app;
}
