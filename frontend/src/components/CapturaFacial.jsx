// Captura facial con la cámara del navegador (T033, US-S2-06/US-S2-07).
//
// Flujo (research.md §1, procesamiento combinado):
//   1. getUserMedia con facingMode 'user' muestra la vista previa.
//   2. face-api (pesos locales en /modelos-faciales/) detecta el rostro y
//      calcula el descriptor de 128 números en el navegador.
//   3. El componente entrega el descriptor como arreglo; NUNCA se envía la
//      imagen al backend (solo el descriptor numérico, research.md §6).
//
// Condiciones de captura (FR-025): luz frontal, sin contraluz y un solo rostro.
// La lógica no cambia: mismos estados, misma carga de modelos y misma
// captura; solo se rediseña la presentación con el tema oscuro compartido.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { IconoAlerta } from './iconos.jsx';

const RUTA_MODELOS = '/modelos-faciales';

export default function CapturaFacial({ onDescriptor, textoBoton = 'Capturar rostro' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const transmisionRef = useRef(null);
  const modelosListosRef = useRef(false);

  const [estado, setEstado] = useState('cargando'); // cargando | listo | capturando | error
  const [mensaje, setMensaje] = useState('');

  // Carga los modelos locales una sola vez y arranca la cámara.
  const preparar = useCallback(async () => {
    try {
      if (!modelosListosRef.current) {
        setMensaje('Cargando el modelo de reconocimiento…');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(RUTA_MODELOS),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(RUTA_MODELOS),
          faceapi.nets.faceRecognitionNet.loadFromUri(RUTA_MODELOS),
        ]);
        modelosListosRef.current = true;
      }

      setMensaje('Solicitando acceso a la cámara…');
      const transmision = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      transmisionRef.current = transmision;
      if (videoRef.current) {
        videoRef.current.srcObject = transmision;
        await videoRef.current.play();
      }
      setMensaje('');
      setEstado('listo');
    } catch (error) {
      setEstado('error');
      setMensaje(
        'No se pudo acceder a la cámara o al modelo. Verifica los permisos del navegador y que los modelos estén en /modelos-faciales/.'
      );
    }
  }, []);

  useEffect(() => {
    preparar();
    // Limpieza: se apaga la cámara al desmontar el componente.
    return () => {
      if (transmisionRef.current) {
        transmisionRef.current.getTracks().forEach((pista) => pista.stop());
      }
    };
  }, [preparar]);

  async function capturar() {
    if (!videoRef.current) return;
    setEstado('capturando');
    setMensaje('');

    try {
      const deteccion = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        )
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!deteccion) {
        setMensaje(
          'No se detectó un rostro. Colócate de frente, con buena luz y sin contraluz, e intenta de nuevo.'
        );
        setEstado('listo');
        return;
      }

      // Dibuja el recorte capturado para que el operador vea qué se envió.
      if (canvasRef.current && videoRef.current) {
        const { width, height } = videoRef.current;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        faceapi.matchDimensions(canvasRef.current, { width, height });
        const contexto = canvasRef.current.getContext('2d');
        contexto.drawImage(videoRef.current, 0, 0, width, height);
      }

      // El descriptor viaja como arreglo de 128 números (contrato).
      const descriptor = Array.from(deteccion.descriptor);
      setEstado('listo');
      onDescriptor(descriptor);
    } catch (_error) {
      setEstado('listo');
      setMensaje('Ocurrió un error al procesar la imagen. Intenta de nuevo.');
    }
  }

  return (
    <div className="captura">
      <p className="captura-ayuda">
        <strong>Condiciones de captura:</strong> luz frontal, evita el contraluz y asegúrate de
        que solo haya un rostro en el encuadre.
      </p>

      <video ref={videoRef} muted playsInline className="captura-visor" />
      <canvas ref={canvasRef} className="captura-canvas" />

      {/* Mientras carga es un aviso neutro; los fallos y las indicaciones de
          captura se muestran como alerta de error. */}
      {mensaje &&
        (estado === 'cargando' ? (
          <div className="alerta alerta-info" role="status">
            <span className="alerta-texto">{mensaje}</span>
          </div>
        ) : (
          <div className="alerta alerta-error" role="alert">
            <IconoAlerta />
            <span className="alerta-texto">{mensaje}</span>
          </div>
        ))}

      <button
        type="button"
        className="boton-primario"
        onClick={capturar}
        disabled={estado !== 'listo'}
      >
        {estado === 'cargando'
          ? 'Preparando…'
          : estado === 'capturando'
            ? 'Procesando…'
            : textoBoton}
      </button>
    </div>
  );
}
