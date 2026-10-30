// Formulario de registro de progreso de un cliente (T039, US4; FR-011,
// clarificación 2026-10-19).
// Basta la fecha y el comentario; el peso y las medidas son opcionales y el
// objetivo también. Los progresos son inmutables: no hay edición posterior.
// La lógica no cambia: mismos estados, misma función enviar con su payload y
// mismas condiciones; solo se rediseña la presentación con el tema oscuro
// compartido (campos etiquetados, fieldset de medidas y botón primario).
import { useCallback, useEffect, useState } from 'react';
import { listarObjetivos, registrarProgreso } from '../services/api.js';
import { IconoAlerta, IconoExito } from './iconos.jsx';

export default function RegistroProgreso({ idCliente, onRegistrado }) {
  const [objetivos, setObjetivos] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [comentario, setComentario] = useState('');
  const [peso, setPeso] = useState('');
  const [medidas, setMedidas] = useState({ pecho: '', cintura: '', cadera: '', muslos: '' });
  const [idObjetivo, setIdObjetivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarObjetivos = useCallback(async () => {
    try {
      const respuesta = await listarObjetivos(`?cliente_id=${idCliente}`);
      setObjetivos(respuesta.objetivos);
    } catch (_e) {
      // Sin objetivos disponibles: el formulario sigue siendo usable.
    }
  }, [idCliente]);

  useEffect(() => {
    cargarObjetivos();
  }, [cargarObjetivos]);

  function cambiarMedida(campo, valor) {
    setMedidas((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function enviar(ev) {
    ev.preventDefault();
    try {
      await registrarProgreso({
        id_cliente: Number(idCliente),
        fecha,
        comentario: comentario.trim(),
        peso: peso === '' ? null : Number(peso),
        pecho: medidas.pecho === '' ? null : Number(medidas.pecho),
        cintura: medidas.cintura === '' ? null : Number(medidas.cintura),
        cadera: medidas.cadera === '' ? null : Number(medidas.cadera),
        muslos: medidas.muslos === '' ? null : Number(medidas.muslos),
        id_objetivo: idObjetivo === '' ? null : Number(idObjetivo),
      });
      setComentario('');
      setPeso('');
      setMedidas({ pecho: '', cintura: '', cadera: '', muslos: '' });
      setIdObjetivo('');
      setMensaje('Progreso registrado correctamente.');
      setError('');
      if (onRegistrado) onRegistrado();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="tarjeta-oscura">
      <h2>Registrar progreso</h2>
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
        </div>
      )}

      <form className="formulario" onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="progreso-fecha">Fecha</label>
          <input
            id="progreso-fecha"
            type="date"
            value={fecha}
            onChange={(ev) => setFecha(ev.target.value)}
            required
          />
        </div>
        <div className="campo">
          <label htmlFor="progreso-comentario">Comentario</label>
          <textarea
            id="progreso-comentario"
            value={comentario}
            maxLength={500}
            rows={3}
            onChange={(ev) => setComentario(ev.target.value)}
            required
          />
        </div>
        <div className="campo">
          <label htmlFor="progreso-peso">Peso (kg, opcional)</label>
          <input
            id="progreso-peso"
            type="number"
            step="0.01"
            min="0.01"
            value={peso}
            onChange={(ev) => setPeso(ev.target.value)}
          />
        </div>

        <fieldset>
          <legend>Medidas (cm, opcionales)</legend>
          <div className="campo">
            <label htmlFor="progreso-pecho">Pecho</label>
            <input
              id="progreso-pecho"
              type="number"
              step="0.1"
              min="0"
              value={medidas.pecho}
              onChange={(ev) => cambiarMedida('pecho', ev.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="progreso-cintura">Cintura</label>
            <input
              id="progreso-cintura"
              type="number"
              step="0.1"
              min="0"
              value={medidas.cintura}
              onChange={(ev) => cambiarMedida('cintura', ev.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="progreso-cadera">Cadera</label>
            <input
              id="progreso-cadera"
              type="number"
              step="0.1"
              min="0"
              value={medidas.cadera}
              onChange={(ev) => cambiarMedida('cadera', ev.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="progreso-muslos">Muslos</label>
            <input
              id="progreso-muslos"
              type="number"
              step="0.1"
              min="0"
              value={medidas.muslos}
              onChange={(ev) => cambiarMedida('muslos', ev.target.value)}
            />
          </div>
        </fieldset>

        <div className="campo">
          <label htmlFor="progreso-objetivo">Vincular a un objetivo (opcional)</label>
          <select
            id="progreso-objetivo"
            value={idObjetivo}
            onChange={(ev) => setIdObjetivo(ev.target.value)}
          >
            <option value="">Sin objetivo</option>
            {objetivos.map((objetivo) => (
              <option key={objetivo.id_objetivo} value={objetivo.id_objetivo}>
                {objetivo.descripcion} ({objetivo.estado})
              </option>
            ))}
          </select>
        </div>

        <div className="form-acciones">
          <button type="submit" className="boton-primario">
            Registrar progreso
          </button>
        </div>
      </form>
    </section>
  );
}
