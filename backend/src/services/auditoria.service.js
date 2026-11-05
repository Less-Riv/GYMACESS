// Lógica de la auditoría funcional del Sprint 2 (T006; FR-016).
// Registra las acciones importantes de este módulo: asignación y renovación de
// membresías, registro de pagos, registro de información facial y resultados
// del control de acceso.
//
// Sprint 4: los reportes añaden dos acciones más, `generar_reporte` y
// `exportar_reporte`, siempre con el módulo `reportes`. La descripción lleva
// el tipo de reporte y los filtros aplicados en el formato compacto
// `tipo=<tipo>; desde=<fecha>; hasta=<fecha>; estado=<valor>; pagina=<n>`
// (research.md §D6). Un intento denegado por permisos se registra con
// resultado `rechazado`; una petición sin token no se registra porque no hay
// usuario al que atribuirla.
//
// SEGURIDAD (research.md §6): las descripciones NUNCA contienen datos
// biométricos (ni descriptores ni medidas faciales); solo identificadores y
// resultados.
//
// La auditoría es best-effort: un fallo al registrarla NO debe impedir la
// operación principal del negocio; se registra el error en consola para
// diagnóstico.
import * as auditoriaModelo from '../models/auditoria.model.js';

export async function registrarAccion(idUsuario, accion, modulo, resultado, descripcion) {
  if (!idUsuario) {
    // Sin usuario autenticado no hay a quién atribuir; no se registra.
    return;
  }
  try {
    await auditoriaModelo.insertarRegistro({
      idUsuario,
      accion,
      modulo,
      resultado,
      descripcion,
    });
  } catch (error) {
    console.error('[auditoria] No se pudo registrar la acción:', error.message);
  }
}

export async function consultarRegistros(filtros) {
  return auditoriaModelo.listarRegistros(filtros);
}
