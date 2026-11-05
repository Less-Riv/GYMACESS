// Página de reportes del Sprint 4 (T011; US-S4-01 a US-S4-07).
// Solo el administrador: el backend responde 403 a los demás roles
// (FR-001, FR-036); ocultar la opción en la interfaz no es una medida de
// seguridad. Las cuatro pestañas son clientes, membresías, pagos y adeudos, y
// accesos; pagos y adeudos comparten pantalla pero son dos reportes
// distintos (research.md §D9).
import { useCallback, useEffect, useState } from 'react';
import { descargarReporte, listarAuditoriaReportes, listarReporte } from '../services/api.js';
import EncabezadoPagina from '../components/EncabezadoPagina.jsx';
import { IconoAlerta, IconoExito } from '../components/iconos.jsx';
import TarjetaIndicador from '../components/TarjetaIndicador.jsx';
import FiltroReporte from '../components/FiltroReporte.jsx';
import TablaReporte from '../components/TablaReporte.jsx';

// Definición de las cuatro pestañas: tipo de reporte, estados admitidos por el
// filtro, columnas del listado e indicadores de sus totales.
const PESTANAS = [
  {
    id: 'clientes',
    etiqueta: 'Clientes',
    tipos: ['clientes'],
    estados: ['activo', 'inactivo'],
    columnas: [
      { clave: 'id_cliente', etiqueta: 'ID' },
      { clave: 'nombre_completo', etiqueta: 'Cliente' },
      { clave: 'correo', etiqueta: 'Correo' },
      { clave: 'telefono', etiqueta: 'Teléfono' },
      { clave: 'fecha_registro', etiqueta: 'Registro' },
      { clave: 'estado', etiqueta: 'Estado' },
    ],
    indicadores: (totales) => [
      { etiqueta: 'Clientes', valor: totales.total },
      { etiqueta: 'Activos', valor: totales.por_estado?.activo ?? 0 },
      { etiqueta: 'Inactivos', valor: totales.por_estado?.inactivo ?? 0 },
    ],
  },
  {
    id: 'membresias',
    etiqueta: 'Membresías',
    tipos: ['membresias'],
    estados: ['activo', 'vencida', 'suspendida', 'cancelada'],
    columnas: [
      { clave: 'id_membresia', etiqueta: 'ID' },
      { clave: 'nombre_completo', etiqueta: 'Cliente' },
      { clave: 'tipo_membresia', etiqueta: 'Tipo' },
      { clave: 'fecha_inicio', etiqueta: 'Inicio' },
      { clave: 'fecha_fin', etiqueta: 'Fin' },
      { clave: 'estado', etiqueta: 'Estado' },
      { clave: 'grupo', etiqueta: 'Grupo' },
    ],
    indicadores: (totales) => [
      { etiqueta: 'Membresías', valor: totales.total },
      { etiqueta: 'Activas', valor: totales.activas ?? 0 },
      { etiqueta: 'Próximas a vencer', valor: totales.proximas_a_vencer ?? 0 },
      { etiqueta: 'Vencidas', valor: totales.vencidas ?? 0 },
      { etiqueta: 'Suspendidas o canceladas', valor: totales.suspendidas_o_canceladas ?? 0 },
    ],
  },
  {
    id: 'pagos',
    etiqueta: 'Pagos y adeudos',
    tipos: ['pagos', 'adeudos'],
    estados: [],
    columnas: [
      { clave: 'id_cliente', etiqueta: 'Cliente' },
      { clave: 'monto', etiqueta: 'Monto' },
      { clave: 'total_pagado', etiqueta: 'Pagado' },
      { clave: 'saldo_pendiente', etiqueta: 'Saldo' },
      { clave: 'estado_membresia', etiqueta: 'Membresía' },
      { clave: 'fecha_fin', etiqueta: 'Vence' },
    ],
    indicadores: (totales) => [
      { etiqueta: 'Pagos', valor: totales.total_pagos ?? 0 },
      { etiqueta: 'Ingresos', valor: totales.total_ingresos ?? '0.00' },
      { etiqueta: 'Clientes con adeudo', valor: totales.total_clientes_con_adeudo ?? 0 },
      { etiqueta: 'Total adeudo', valor: totales.total_adeudo ?? '0.00' },
    ],
  },
  {
    id: 'accesos',
    etiqueta: 'Accesos',
    tipos: ['accesos'],
    estados: ['autorizado', 'rechazado'],
    columnas: [
      { clave: 'id_acceso', etiqueta: 'ID' },
      { clave: 'nombre_completo', etiqueta: 'Cliente' },
      { clave: 'fecha', etiqueta: 'Fecha' },
      { clave: 'hora', etiqueta: 'Hora' },
      { clave: 'resultado', etiqueta: 'Resultado' },
      { clave: 'motivo', etiqueta: 'Motivo' },
    ],
    indicadores: (totales) => [
      { etiqueta: 'Accesos', valor: totales.total },
      { etiqueta: 'Autorizados', valor: totales.autorizados ?? 0 },
      { etiqueta: 'Rechazados', valor: totales.rechazados ?? 0 },
    ],
  },
];

// Convierte los filtros del formulario en la cadena de consulta de la API.
function aParametros(filtros, pagina) {
  const params = new URLSearchParams();
  if (filtros.desde) params.set('desde', filtros.desde);
  if (filtros.hasta) params.set('hasta', filtros.hasta);
  if (filtros.estado) params.set('estado', filtros.estado);
  if (pagina && pagina > 1) params.set('pagina', String(pagina));
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

export default function Reportes() {
  const [pestana, setPestana] = useState(PESTANAS[0].id);
  const [datos, setDatos] = useState({});
  const [filtros, setFiltros] = useState({});
  const [paginas, setPaginas] = useState({});
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [auditoria, setAuditoria] = useState([]);

  const activa = PESTANAS.find((p) => p.id === pestana) || PESTANAS[0];

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const tipos = PESTANAS.find((p) => p.id === pestana)?.tipos || [];
      const cargados = {};
      const nuevasPaginas = {};
      for (const tipo of tipos) {
        const params = aParametros(filtros, paginas[tipo]);
        const respuesta = await listarReporte(tipo, params);
        cargados[tipo] = respuesta;
        nuevasPaginas[tipo] = respuesta.paginacion?.pagina ?? 1;
      }
      setDatos(cargados);
      setPaginas(nuevasPaginas);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [pestana, filtros, paginas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Auditoría de los reportes (US-S4-06): solo el administrador puede
  // consultarla y una falla aquí no bloquea los reportes.
  useEffect(() => {
    let vivo = true;
    async function cargarAuditoria() {
      try {
        const respuesta = await listarAuditoriaReportes();
        if (vivo) setAuditoria(respuesta.registros || []);
      } catch (_e) {
        // Sin auditoría disponible: la página sigue siendo útil sin ella.
      }
    }
    cargarAuditoria();
    return () => {
      vivo = false;
    };
  }, []);

  function aplicarFiltros(nuevos) {
    setFiltros(nuevos);
    setPaginas({});
  }

  function limpiarFiltros() {
    setFiltros({});
    setPaginas({});
  }

  function cambiarPagina(tipo, pagina) {
    setPaginas((actuales) => ({ ...actuales, [tipo]: pagina }));
  }

  async function exportar(tipo) {
    try {
      const resultado = await descargarReporte(tipo, aParametros(filtros));
      const url = URL.createObjectURL(resultado.blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = resultado.nombre;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
      setError('');
      setMensaje(
        resultado.truncado
          ? `Archivo exportado con ${resultado.filasExportadas} de ${resultado.totalFilas} filas: el conjunto filtrado supera el límite de exportación.`
          : `Archivo exportado con ${resultado.filasExportadas} filas.`
      );
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="pagina pagina-dashboard">
      <EncabezadoPagina titulo="Reportes" />

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

        <nav className="pestanas" aria-label="Tipos de reporte">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pestana ${p.id === pestana ? 'activa' : ''}`}
              onClick={() => setPestana(p.id)}
            >
              {p.etiqueta}
            </button>
          ))}
        </nav>

        <FiltroReporte
          estados={activa.estados}
          cargando={cargando}
          onAplicar={aplicarFiltros}
          onLimpiar={limpiarFiltros}
        />

        {activa.tipos.map((tipo) => {
          const reporte = datos[tipo];
          if (!reporte) return null;
          const indicadores = PESTANAS.find((p) => p.id === pestana);
          return (
            <section className="tarjeta-oscura" key={tipo}>
              <h2>
                {tipo === 'adeudos' ? 'Adeudos pendientes' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </h2>
              <div className="indicadores">
                {(indicadores?.indicadores(reporte.totales) || []).map((indicador) => (
                  <TarjetaIndicador
                    key={indicador.etiqueta}
                    etiqueta={indicador.etiqueta}
                    valor={indicador.valor}
                  />
                ))}
              </div>
              <TablaReporte
                columnas={indicadores?.columnas || []}
                filas={reporte.filas || []}
                paginacion={reporte.paginacion}
                cargando={cargando}
                onCambiarPagina={(pagina) => cambiarPagina(tipo, pagina)}
              />
              <button
                type="button"
                className="boton-primario"
                onClick={() => exportar(tipo)}
              >
                Exportar a PDF
              </button>
            </section>
          );
        })}

        {cargando && !datos[activa.tipos[0]] && (
          <p className="cargando">Cargando reporte…</p>
        )}

        <section className="tarjeta-oscura">
          <h2>Auditoría de reportes</h2>
          {auditoria.length === 0 ? (
            <p className="estado-vacio">Sin operaciones de reportes todavía.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-oscura">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Resultado</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.slice(0, 20).map((registro) => (
                    <tr key={registro.id_auditoria || registro.fecha}>
                      <td>{registro.fecha}</td>
                      <td>{registro.nombre || registro.usuario || registro.id_usuario}</td>
                      <td>{registro.accion}</td>
                      <td>{registro.resultado}</td>
                      <td>{registro.descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
