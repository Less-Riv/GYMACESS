// Generación del archivo PDF de los reportes (T042; FR-018, FR-020, FR-021,
// FR-022).
// El documento se genera con `pdfkit` (licencia MIT, sin binarios ni red)
// sobre las fuentes estándar, cuyo juego de caracteres es WinAnsi: cubre el
// español con acentos y eñe (FR-021). Un carácter fuera de ese conjunto NO
// se escribe de forma corrupta: se rechaza la exportación con un error de
// validación (research.md §D1).
import PDFDocument from 'pdfkit';
import { ERRORES } from '../utils/respuestas.js';

// Caracteres fuera de Latin-1 que sí aparecen en nombres y comentarios y
// tienen equivalente en las fuentes estándar del PDF.
const PERMITIDOS_ESPECIALES = new Set([
  '‘', // comilla simple izquierda
  '’', // comilla simple derecha
  '“', // comilla doble izquierda
  '”', // comilla doble derecha
  '–', // raya
  '—', // raya larga
  '•', // viñeta
  '…', // puntos suspensivos
]);

// Ancho útil de la página en horizontal A4 con los márgenes del documento.
const ANCHO_UTIL = 841.89 - 60;

// Valida que todos los textos de la tabla se puedan representar. Si no, se
// rechaza la exportación en lugar de generar un archivo corrupto (FR-021).
export function validarCaracteresExportables(filas, columnas) {
  for (const fila of filas) {
    for (const columna of columnas) {
      const valor = fila[columna.clave];
      if (valor === null || valor === undefined) continue;
      if (!esRepresentable(String(valor))) {
        throw ERRORES.validacion(
          `El dato "${columna.etiqueta}" contiene caracteres que no admite el formato PDF`
        );
      }
    }
  }
}

function esRepresentable(texto) {
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0);
    if (codigo <= 0xff) continue;
    if (PERMITIDOS_ESPECIALES.has(caracter)) continue;
    return false;
  }
  return true;
}

// Crea el documento PDF del reporte y devuelve el flujo de pdfkit, ya escrito.
// El llamante lo conecta a la respuesta HTTP y lo cierra con `end()`.
export function generarReportePdf({
  titulo,
  subtitulo = '',
  columnas,
  filas,
  totales = [],
  aviso = null,
}) {
  const documento = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 30,
  });

  const anchoColumna = Math.max(60, (ANCHO_UTIL - 40) / Math.max(columnas.length, 1));
  const anchoUtil = anchoColumna * columnas.length;

  // Encabezado del documento.
  documento.fontSize(16).fillColor('#111827').text(titulo);
  if (subtitulo) {
    documento.moveDown(0.2).fontSize(10).fillColor('#4b5563').text(subtitulo);
  }
  documento.moveDown(0.6);

  // Totales del reporte.
  if (totales.length > 0) {
    documento.fontSize(10).fillColor('#111827');
    documento.text(totales.map((total) => `${total.etiqueta}: ${total.valor}`).join('   |   '));
    documento.moveDown(0.6);
  }

  // Cabecera de la tabla.
  let y = documento.y;
  documento.rect(30, y, anchoUtil, 18).fill('#0f172a');
  documento.fillColor('#f8fafc').fontSize(9);
  let x = 30;
  for (const columna of columnas) {
    documento.text(columna.etiqueta, x + 4, y + 5, {
      width: anchoColumna - 8,
      ellipsis: true,
      lineBreak: false,
    });
    x += anchoColumna;
  }
  y += 18;

  // Filas del reporte.
  documento.fillColor('#111827').fontSize(9);
  for (const fila of filas) {
    if (y > 560) {
      documento.addPage();
      y = 40;
    }
    x = 30;
    for (const columna of columnas) {
      const valor = fila[columna.clave];
      documento.text(valor === null || valor === undefined ? '' : String(valor), x + 4, y + 3, {
        width: anchoColumna - 8,
        ellipsis: true,
        lineBreak: false,
      });
      x += anchoColumna;
    }
    y += 16;
    documento.moveTo(30, y).lineTo(30 + anchoUtil, y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
  }

  // Aviso de truncamiento: el archivo deja constancia de que no contiene el
  // conjunto filtrado completo (FR-019).
  if (aviso) {
    documento.moveDown(0.8).fontSize(9).fillColor('#b45309').text(aviso);
  }

  return documento;
}
