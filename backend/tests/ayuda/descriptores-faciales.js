// Utilidad de pruebas del Sprint 2: descriptores faciales sintéticos de 128
// valores para las pruebas de rostros y accesos (sin cámara ni modelo real).
// El descriptor real se calcula en el navegador con face-api (research.md §1);
// en pruebas solo se necesita un arreglo numérico válido de 128 dimensiones.

export const DIMENSIONES = 128;

// Descriptor determinista: cada ejecución produce el mismo arreglo para la
// misma semilla, lo que permite simular "la misma cara" en distintas pruebas.
export function descriptorDePrueba(semilla = 1) {
  return Array.from({ length: DIMENSIONES }, (_valor, indice) =>
    Number((Math.sin(semilla * 100 + indice) * 0.5).toFixed(6))
  );
}

// Distancia euclidiana entre dos descriptores (misma fórmula que usa el
// backend en acceso-facial.service.js) para construir casos de prueba.
export function distanciaEuclidiana(a, b) {
  const suma = a.reduce((acumulado, valor, indice) => {
    const diferencia = valor - b[indice];
    return acumulado + diferencia * diferencia;
  }, 0);
  return Math.sqrt(suma);
}
