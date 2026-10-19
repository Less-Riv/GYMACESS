// Lógica de negocio de usuarios (T040, US3; T045, US4).
// Reglas: contraseña siempre con hash bcrypt (FR-002), correo único (409),
// cliente_id solo para rol 'cliente' y resuelto por el backend dentro de una
// transacción (aclaración 2026-10-14).
import bcrypt from 'bcrypt';
import * as usuarioModelo from '../models/usuario.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import { obtenerPool } from '../config/database.js';
import { ERRORES } from '../utils/respuestas.js';

async function resolverClienteId(rol, clienteId) {
  if (rol === 'cliente') {
    if (!clienteId) {
      throw ERRORES.validacion('El usuario con rol cliente requiere un cliente asociado (cliente_id)');
    }
    const cliente = await clienteModelo.buscarClientePorId(clienteId);
    if (!cliente) {
      throw ERRORES.validacion('El cliente indicado en cliente_id no existe');
    }
    return clienteId;
  }
  // Los roles administrativo y operativo no tienen cliente asociado.
  return null;
}

// Alta automática del cliente (aclaración 2026-10-14): reutiliza el cliente
// que ya tenga el mismo correo o lo crea con el nombre y el apellido del
// formulario. Se ejecuta SIEMPRE sobre la conexión de la transacción.
async function crearOReutilizarCliente(datos, conexion) {
  const existente = await clienteModelo.buscarClientePorCorreo(datos.correo, conexion);
  if (existente) {
    return existente.id_cliente;
  }
  return clienteModelo.crearCliente(
    {
      nombre: datos.nombre,
      apellido: datos.apellido ?? '',
      correo: datos.correo,
    },
    conexion
  );
}

export async function crearUsuario(datos) {
  const existente = await usuarioModelo.buscarUsuarioPorCorreo(datos.correo);
  if (existente) {
    throw ERRORES.conflictCorreo();
  }

  // FR-002: la contraseña se almacena SIEMPRE como hash bcrypt. Se calcula
  // antes de abrir la transacción para que la sesión dure lo mínimo posible.
  const hash = await bcrypt.hash(datos.password, 10);

  if (datos.rol !== 'cliente') {
    // Los roles administrativo y operativo nunca crean clientes: cualquier
    // cliente_id enviado en el cuerpo se ignora.
    const id = await usuarioModelo.crearUsuario({
      nombre: datos.nombre,
      correo: datos.correo,
      password: hash,
      rol: datos.rol,
      clienteId: null,
    });
    return usuarioModelo.buscarUsuarioPorId(id);
  }

  // Rol 'cliente': cliente y usuario se crean juntos, o no se crea ninguno.
  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();

    const clienteId = await crearOReutilizarCliente(datos, conexion);

    // Un cliente solo puede estar vinculado a un usuario.
    const usuarioAsociado = await usuarioModelo.buscarUsuarioPorClienteId(clienteId, conexion);
    if (usuarioAsociado) {
      throw ERRORES.conflictClienteConUsuario();
    }

    const id = await usuarioModelo.crearUsuario(
      {
        nombre: datos.nombre,
        correo: datos.correo,
        password: hash,
        rol: datos.rol,
        clienteId,
      },
      conexion
    );

    await conexion.commit();
    return usuarioModelo.buscarUsuarioPorId(id);
  } catch (error) {
    // Rollback: no deben quedar registros a medias (ni cliente huérfano).
    try {
      await conexion.rollback();
    } catch (_rollbackError) {
      // La conexión ya quedó inutilizable; se libera en el finally.
    }
    throw error;
  } finally {
    conexion.release();
  }
}

export async function listarUsuarios() {
  return usuarioModelo.listarUsuarios();
}

export async function asignarRol(id, rol, clienteId) {
  const usuario = await usuarioModelo.buscarUsuarioPorId(id);
  if (!usuario) {
    throw ERRORES.noEncontrado('Usuario');
  }

  // Cambiar a 'cliente' exige cliente asociado; dejar de serlo lo limpia (T045).
  const clienteFinal = await resolverClienteId(rol, clienteId);

  await usuarioModelo.actualizarRol(id, rol);
  await usuarioModelo.actualizarClienteId(id, clienteFinal);
  return usuarioModelo.buscarUsuarioPorId(id);
}
