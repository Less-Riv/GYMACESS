-- Migración 001: tablas base del Sprint 1 (FR-016, FR-023).
-- Motor InnoDB, codificación utf8mb4. Ejecutar con:
--   node database/scripts/ejecutar-migraciones.js

-- Tabla de control de migraciones aplicadas (infraestructura).
CREATE TABLE IF NOT EXISTS esquema_migraciones (
  nombre VARCHAR(255) NOT NULL PRIMARY KEY,
  fecha_ejecucion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- CLIENTES (funcional en este sprint; FR-009, FR-010, FR-011)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL,
  telefono VARCHAR(20) NULL,
  direccion VARCHAR(200) NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (id_cliente),
  UNIQUE KEY uq_clientes_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- USUARIOS (funcional en este sprint; FR-006, FR-007)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('administrador', 'recepcionista', 'entrenador', 'cliente') NOT NULL,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  cliente_id INT UNSIGNED NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_correo (correo),
  CONSTRAINT fk_usuarios_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes (id_cliente) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- TABLAS DE ESTRUCTURA INICIAL SIN OPERACIONES FUNCIONALES (FR-016)
-- Corresponden al Sprint 2: solo claves primarias y foráneas en este sprint.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_membresia (
  id_tipo_membresia INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NULL,
  duracion INT UNSIGNED NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (id_tipo_membresia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS membresias (
  id_membresia INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED NOT NULL,
  id_tipo_membresia INT UNSIGNED NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado ENUM('activo', 'vencida', 'suspendida', 'cancelada') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (id_membresia),
  CONSTRAINT fk_membresias_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE RESTRICT,
  CONSTRAINT fk_membresias_tipo FOREIGN KEY (id_tipo_membresia)
    REFERENCES tipos_membresia (id_tipo_membresia) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS pagos (
  id_pago INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED NOT NULL,
  id_membresia INT UNSIGNED NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha_pago DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago VARCHAR(50) NULL,
  estado ENUM('completado', 'pendiente', 'cancelado') NOT NULL DEFAULT 'completado',
  PRIMARY KEY (id_pago),
  CONSTRAINT fk_pagos_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE RESTRICT,
  CONSTRAINT fk_pagos_membresia FOREIGN KEY (id_membresia)
    REFERENCES membresias (id_membresia) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
