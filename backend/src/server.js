// Punto de entrada del servidor backend.
import { crearApp } from './app.js';
import { entorno } from './config/entorno.js';

const app = crearApp();

app.listen(entorno.PORT, () => {
  console.log(`Backend del gimnasio escuchando en http://localhost:${entorno.PORT}/api`);
});
