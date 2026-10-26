// Formulario de registro de progreso de un cliente (T039, US4; FR-011,
// clarificación 2026-10-19).
// Basta la fecha y el comentario; el peso y las medidas son opcionales y el
// objetivo también. Los progresos son inmutables: no hay edición posterior.
import { useCallback, useEffect, useState } from 'react';
import { listarObjetivos, registrarProgreso } from '../services/api.js';

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
    <section style={{ marginTop: '2rem' }}>
      <h2>Registrar progreso</h2>
      {mensaje && <p className="mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      <form onSubmit={enviar} style={{ display: 'grid', gap: '0.5rem', maxWidth: 480 }}>
        <label>
          Fecha
          <input type="date" value={fecha} onChange={(ev) => setFecha(ev.target.value)} required />
        </label>
        <label>
          Comentario
          <textarea
            value={comentario}
            maxLength={500}
            rows={3}
            onChange={(ev) => setComentario(ev.target.value)}
            required
          />
        </label>
        <label>
          Peso (kg, opcional)
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={peso}
            onChange={(ev) => setPeso(ev.target.value)}
          />
        </label>

        <fieldset>
          <legend>Medidas (cm, opcionales)</legend>
          <label>
            Pecho
            <input
              type="number"
              step="0.1"
              min="0"
              value={medidas.pecho}
              onChange={(ev) => cambiarMedida('pecho', ev.target.value)}
            />
          </label>
          <label>
            Cintura
            <input
              type="number"
              step="0.1"
              min="0"
              value={medidas.cintura}
              onChange={(ev) => cambiarMedida('cintura', ev.target.value)}
            />
          </label>
          <label>
            Cadera
            <input
              type="number"
              step="0.1"
              min="0"
              value={medidas.cadera}
              onChange={(ev) => cambiarMedida('cadera', ev.target.value)}
            />
          </label>
          <label>
            Muslos
            <input
              type="number"
              step="0.1"
              min="0"
              value={medidas.muslos}
              onChange={(ev) => cambiarMedida('muslos', ev.target.value)}
            />
          </label>
        </fieldset>

        <label>
          Vincular a un objetivo (opcional)
          <select value={idObjetivo} onChange={(ev) => setIdObjetivo(ev.target.value)}>
            <option value="">Sin objetivo</option>
            {objetivos.map((objetivo) => (
              <option key={objetivo.id_objetivo} value={objetivo.id_objetivo}>
                {objetivo.descripcion} ({objetivo.estado})
              </option>
            ))}
          </select>
        </label>

        <button type="submit">Registrar progreso</button>
      </form>
    </section>
  );
}
