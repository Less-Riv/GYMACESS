-- Migración 002: tablas del Sprint 2 (FR-019; data-model.md).
-- Motor InnoDB, codificación utf8mb4. Ejecutar con:
--   node database/scripts/ejecutar-migraciones.js
-- Las tablas tipos_membresia, membresias y pagos ya creadas en el Sprint 1 se
-- reutilizan sin duplicarse; pagos solo recibe el ajuste NOT NULL exigido por
-- la RN-05 (todo pago pertenece a una membresía del mismo cliente).

-- ---------------------------------------------------------------------------
-- ROSTROS: información facial (descriptor) por cliente; un registro por cliente
-- (FR-009, FR-017, FR-019). El descriptor es un arreglo JSON de 128 números.
-- Nunca se devuelve en la API; solo su estado de registro.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rostros (
  id_rostro INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED NOT NULL,
  descriptor TEXT NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (id_rostro),
  -- Unicidad 1:1: dos capturas del mismo cliente actualizan, nunca duplican.
  UNIQUE KEY uq_rostros_cliente (id_cliente),
  CONSTRAINT fk_rostros_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- ACCESOS: cada intento de entrada genera un registro (RN-10, RN-11, FR-014).
-- id_cliente es NULL cuando no hubo identificación exitosa (rostro no
-- reconocido). Los registros no se eliminan de manera ordinaria.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accesos (
  id_acceso INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  resultado ENUM('autorizado', 'rechazado') NOT NULL,
  -- Motivo obligatorio cuando el resultado es rechazado (RN-11).
  motivo VARCHAR(80) NULL,
  PRIMARY KEY (id_acceso),
  KEY ix_accesos_cliente_fecha (id_cliente, fecha),
  KEY ix_accesos_fecha (fecha),
  CONSTRAINT fk_accesos_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- AUDITORIA: acciones importantes del sistema (FR-016, project-context §7.10).
-- La consulta es exclusiva del administrador.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario INT UNSIGNED NOT NULL,
  accion VARCHAR(60) NOT NULL,
  modulo VARCHAR(40) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resultado VARCHAR(20) NOT NULL,
  descripcion VARCHAR(255) NULL,
  PRIMARY KEY (id_auditoria),
  KEY ix_auditoria_fecha (fecha),
  KEY ix_auditoria_modulo (modulo),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- AJUSTE A TABLA EXISTENTE (RN-05): todo pago debe estar asociado a una
-- membresía del mismo cliente. La tabla no tiene datos funcionales del
-- Sprint 1, por lo que el ajuste no afecta información existente.
-- ---------------------------------------------------------------------------
ALTER TABLE pagos
  MODIFY id_membresia INT UNSIGNED NOT NULL;
