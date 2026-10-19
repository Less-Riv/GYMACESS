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

  // Ruta no encontrada → 404 con envelope consistente.
  app.use((_req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada', codigo: 'NO_ENCONTRADA' });
  });

  // Middleware central de errores: siempre el último.
  app.use(manejarErrores);

  return app;
}
