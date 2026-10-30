// Página de tipos de membresía (T015, US-S2-01): alta y modificación del
// catálogo administrativo (FR-001). Solo el administrador accede; el backend
// también valida el rol (FR-021).
// La lógica no cambia: mismos estados, mismas llamadas (GET/POST/PUT
// /tipos-membresia), mismas validaciones y los mismos mensajes; solo se
// rediseña la presentación con el tema oscuro compartido (patrón de
// Usuarios.jsx).
import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';

const VACIO = { nombre: '', descripcion: '', duracion: '', precio: '' };

// Chip de estado según el valor del backend; los no previstos quedan con el
// estilo neutro base del chip.
const CLASES_ESTADO = {
  activo: 'chip-activo',
  inactivo: 'chip-inactivo',
};

export default function TiposMembresia() {
  const [tipos, setTipos] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [editando, setEditando] = useState(null); // id del tipo en edición
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedir('/tipos-membresia');
      setTipos(respuesta.tipos);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setMensaje('');
    setError('');
    const cuerpo = {
      nombre: formulario.nombre,
      descripcion: formulario.descripcion || undefined,
      duracion: Number(formulario.duracion),
      precio: Number(formulario.precio),
    };

    try {
      if (editando) {
        await pedir(`/tipos-membresia/${editando}`, { metodo: 'PUT', cuerpo });
        setMensaje('Tipo de membresía actualizado correctamente.');
      } else {
        await pedir('/tipos-membresia', { metodo: 'POST', cuerpo });
        setMensaje(`Tipo "${cuerpo.nombre}" registrado correctamente.`);
      }
      setFormulario(VACIO);
      setEditando(null);
      setMostrarAlta(false);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  function editar(tipo) {
    setEditando(tipo.id_tipo_membresia);
    setMostrarAlta(true);
    setMensaje('');
    setError('');
    setFormulario({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      duracion: String(tipo.duracion),
      precio: String(tipo.precio),
    });
  }

  function cancelar() {
    setFormulario(VACIO);
    setEditando(null);
    setMostrarAlta(false);
  }

  return (
    <main className="pagina pagina-tipos">
      <EncabezadoPagina titulo="Tipos de membresía" />

      <div className="contenido-pagina">
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

        <div className="acciones-fila">
          <button
            type="button"
            className="boton-primario"
            onClick={() => (mostrarAlta ? cancelar() : setMostrarAlta(true))}
          >
            {mostrarAlta ? 'Ocultar formulario' : 'Registrar tipo de membresía'}
          </button>
        </div>

        {mostrarAlta && (
          <form className="tarjeta-oscura formulario" onSubmit={guardar}>
            <h2>
              {editando ? 'Modificar tipo de membresía' : 'Registrar tipo de membresía'}
            </h2>
            <div className="campo">
              <label htmlFor="tipo-nombre">Nombre</label>
              <input
                id="tipo-nombre"
                value={formulario.nombre}
                onChange={(e) => cambiar('nombre', e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="tipo-descripcion">Descripción</label>
              <input
                id="tipo-descripcion"
                value={formulario.descripcion}
                onChange={(e) => cambiar('descripcion', e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="tipo-duracion">Duración (días)</label>
              <input
                id="tipo-duracion"
                type="number"
                min="1"
                value={formulario.duracion}
                onChange={(e) => cambiar('duracion', e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="tipo-precio">Precio</label>
              <input
                id="tipo-precio"
                type="number"
                min="0"
                step="0.01"
                value={formulario.precio}
                onChange={(e) => cambiar('precio', e.target.value)}
                required
              />
            </div>
            <div className="form-acciones">
              <button type="submit" className="boton-primario">
                {editando ? 'Guardar cambios' : 'Registrar'}
              </button>
              <button type="button" className="boton-secundario" onClick={cancelar}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        <section className="tarjeta-oscura">
          <div className="listado-cabecera">
            <h2>Tipos registrados</h2>
            <span className="listado-total">{tipos.length}</span>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla-oscura">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Duración (días)</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {tipos.map((tipo) => (
                  <tr key={tipo.id_tipo_membresia}>
                    <td>{tipo.nombre}</td>
                    <td>{tipo.descripcion || '—'}</td>
                    <td>{tipo.duracion}</td>
                    <td>${tipo.precio}</td>
                    <td>
                      <span className={`chip ${CLASES_ESTADO[tipo.estado] || ''}`}>
                        {tipo.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="boton-mini"
                        onClick={() => editar(tipo)}
                      >
                        Modificar
                      </button>
                    </td>
                  </tr>
                ))}
                {tipos.length === 0 && (
                  <tr>
                    <td colSpan={6}>No hay tipos de membresía registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
