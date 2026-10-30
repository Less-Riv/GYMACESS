// Página de clientes (T035 US2, T052 US5): listado paginado con columnas
// según rol y alta de clientes para administrador y recepcionista.
// El entrenador no ve correo ni dirección: el backend ya proyecta los campos
// (FR-025); el frontend solo refleja ese contrato.
// La lógica no cambia: mismos estados, misma paginación (FR-027, límite de
// 20 por página), mismas llamadas y mismos permisos; solo se rediseña la
// presentación con el tema oscuro compartido (patrón de Usuarios.jsx).
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClienteForm from '../components/ClienteForm.jsx';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';
import './Clientes.css';

// Chip de estado según el valor del backend; los no previstos quedan con el
// estilo neutro base del chip.
const CLASES_ESTADO = {
  activo: 'chip-activo',
  inactivo: 'chip-inactivo',
};

export default function Clientes() {
  const { usuario } = useAuth();
  const puedeRegistrar = ['administrador', 'recepcionista'].includes(usuario.rol);

  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ clientes: [], total: 0, totalPaginas: 0 });
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedir(`/clientes?pagina=${pagina}`);
      setDatos(respuesta);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function registrarCliente(datosFormulario) {
    await pedir('/clientes', { metodo: 'POST', cuerpo: datosFormulario });
    setMostrarAlta(false);
    setMensaje(`Cliente ${datosFormulario.nombre} ${datosFormulario.apellido} registrado correctamente.`);
    await cargar();
  }

  return (
    <main className="pagina pagina-clientes">
      <EncabezadoPagina titulo="Clientes" />

      <div className="contenido-pagina ancho">
        {mensaje && (
          <div className="alerta alerta-exito" role="status">
            <IconoExito />
            <span className="alerta-texto">{mensaje}</span>
          </div>
        )}

        {error && (
          <div className="alerta alerta-error" role="alert">
            <IconoAlerta />
            <span className="alerta-texto">{error}</span>
            <button type="button" className="boton-reintentar" onClick={cargar}>
              Reintentar
            </button>
          </div>
        )}

        {puedeRegistrar && (
          <div className="acciones-fila">
            <button
              type="button"
              className="boton-primario"
              onClick={() => setMostrarAlta(!mostrarAlta)}
            >
              {mostrarAlta ? 'Ocultar formulario' : 'Registrar cliente'}
            </button>
          </div>
        )}

        {mostrarAlta && (
          <ClienteForm onGuardar={registrarCliente} onCancelar={() => setMostrarAlta(false)} />
        )}

        <section className="tarjeta-oscura">
          <div className="listado-cabecera">
            <h2>Clientes registrados</h2>
            <span className="listado-total">{datos.total}</span>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla-oscura">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  {usuario.rol !== 'entrenador' && <th>Correo</th>}
                  <th>Teléfono</th>
                  {usuario.rol !== 'entrenador' && <th>Dirección</th>}
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {datos.clientes.map((cliente) => (
                  <tr key={cliente.id_cliente}>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.apellido}</td>
                    {usuario.rol !== 'entrenador' && <td>{cliente.correo}</td>}
                    <td>{cliente.telefono || '—'}</td>
                    {usuario.rol !== 'entrenador' && <td>{cliente.direccion || '—'}</td>}
                    <td>
                      <span className={`chip ${CLASES_ESTADO[cliente.estado] || ''}`}>
                        {cliente.estado}
                      </span>
                    </td>
                    <td>
                      {usuario.rol !== 'entrenador' && (
                        <Link className="enlace" to={`/clientes/${cliente.id_cliente}`}>
                          Ver
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {datos.clientes.length === 0 && (
                  <tr>
                    <td colSpan={7}>No hay clientes registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Paginación (FR-027): límite fijo de 20 por página. */}
        <nav className="paginacion" aria-label="Paginación de clientes">
          <button
            type="button"
            className="boton-secundario"
            onClick={() => setPagina(pagina - 1)}
            disabled={pagina <= 1}
          >
            Anterior
          </button>
          <span className="paginacion-texto">
            Página {pagina} de {Math.max(1, datos.totalPaginas)} ({datos.total} en total)
          </span>
          <button
            type="button"
            className="boton-secundario"
            onClick={() => setPagina(pagina + 1)}
            disabled={pagina >= datos.totalPaginas}
          >
            Siguiente
          </button>
        </nav>
      </div>
    </main>
  );
}
