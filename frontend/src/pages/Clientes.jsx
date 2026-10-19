// Página de clientes (T035 US2, T052 US5): listado paginado con columnas
// según rol y alta de clientes para administrador y recepcionista.
// El entrenador no ve correo ni dirección: el backend ya proyecta los campos
// (FR-025); el frontend solo refleja ese contrato.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClienteForm from '../components/ClienteForm.jsx';

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
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Clientes</h1>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>

      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      {puedeRegistrar && (
        <button onClick={() => setMostrarAlta(!mostrarAlta)}>
          {mostrarAlta ? 'Ocultar formulario' : 'Registrar cliente'}
        </button>
      )}

      {mostrarAlta && (
        <ClienteForm onGuardar={registrarCliente} onCancelar={() => setMostrarAlta(false)} />
      )}

      <table>
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
              <td>{cliente.estado}</td>
              <td>
                {usuario.rol !== 'entrenador' && (
                  <Link to={`/clientes/${cliente.id_cliente}`}>Ver</Link>
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

      {/* Paginación (FR-027): límite fijo de 20 por página. */}
      <nav style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button onClick={() => setPagina(pagina - 1)} disabled={pagina <= 1}>
          Anterior
        </button>
        <span>
          Página {pagina} de {Math.max(1, datos.totalPaginas)} ({datos.total} en total)
        </span>
        <button onClick={() => setPagina(pagina + 1)} disabled={pagina >= datos.totalPaginas}>
          Siguiente
        </button>
      </nav>
    </main>
  );
}
