// Rutas de infraestructura: comprobación de vida del backend (quickstart).
import { Router } from 'express';

export const rutasSalud = Router();

rutasSalud.get('/salud', (_req, res) => {
  res.json({ estado: 'ok' });
});
