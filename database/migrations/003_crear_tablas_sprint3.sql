-- Migración 003: tablas del Sprint 3 (FR-022; data-model.md).
-- Motor InnoDB, codificación utf8mb4. Ejecutar con:
--   node database/scripts/ejecutar-migraciones.js
-- Las tablas de los Sprints 1 y 2 (usuarios, clientes, tipos_membresia,
-- membresias, pagos, rostros, accesos, auditoria) NO se modifican ni se
-- duplican; solo se consultan (FR-029).

-- ---------------------------------------------------------------------------
-- ENTRENADORES: personal de coaching; uno por cuenta de usuario (RN-15).
-- La baja es lógica (estado 'inactivo') y cierra sus asignaciones activas
-- desde el servicio (FR-001); nunca se elimina la fila.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entrenadores (
  id_entrenador INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario INT UNSIGNED NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  telefono VARCHAR(30) NULL,
  correo_contacto VARCHAR(120) NULL,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_entrenador),
  -- RN-15: una sola ficha de entrenador por cuenta de usuario.
  UNIQUE KEY uq_entrenadores_usuario (id_usuario),
  CONSTRAINT fk_entrenadores_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- ASIGNACIONES_ENTRENADOR: vínculo cliente ↔ entrenador en un periodo de
-- seguimiento; UNA SOLA activa por cliente (RN-16), garantizada en el
-- servicio con transacción (investigación §2). El histórico nunca se
-- elimina (RN-17).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignaciones_entrenador (
  id_asignacion INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED NOT NULL,
  id_entrenador INT UNSIGNED NOT NULL,
  fecha_asignacion DATE NOT NULL,
  -- Obligatoria al cerrar la asignación (reasignación o baja del entrenador).
  fecha_fin DATE NULL,
  estado ENUM('activa', 'cerrada') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (id_asignacion),
  KEY ix_asignaciones_cliente_estado (id_cliente, estado),
  KEY ix_asignaciones_entrenador (id_entrenador),
  CONSTRAINT fk_asignaciones_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE RESTRICT,
  CONSTRAINT fk_asignaciones_entrenador FOREIGN KEY (id_entrenador)
    REFERENCES entrenadores (id_entrenador) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- RUTINAS: plan de entrenamiento de un cliente; UNA SOLA activa por cliente
-- (FR-009), garantizada en el servicio. El histórico nunca se elimina.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rutinas (
  id_rutina INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED NOT NULL,
  id_entrenador INT UNSIGNED NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(255) NULL,
  estado ENUM('activa', 'finalizada') NOT NULL DEFAULT 'activa',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NULL,
  PRIMARY KEY (id_rutina),
  KEY ix_rutinas_cliente_estado (id_cliente, estado),
  KEY ix_rutinas_entrenador (id_entrenador),
  CONSTRAINT fk_rutinas_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE RESTRICT,
  CONSTRAINT fk_rutinas_entrenador FOREIGN KEY (id_entrenador)
    REFERENCES entrenadores (id_entrenador) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- EJERCICIOS_RUTINA: detalle de una rutina (FR-008, RN-18). La lista se
-- reemplaza en su conjunto desde el frontend (PUT de ejercicios), por lo que
-- el detalle depende de la rutina con ON DELETE CASCADE.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ejercicios_rutina (
  id_ejercicio_rutina INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_rutina INT UNSIGNED NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  series SMALLINT UNSIGNED NULL,
  repeticiones VARCHAR(30) NULL,
  carga VARCHAR(40) NULL,
  instrucciones VARCHAR(255) NULL,
  orden SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_ejercicio_rutina),
  KEY ix_ejercicios_rutina (id_rutina),
  CONSTRAINT fk_ejercicios_rutina FOREIGN KEY (id_rutina)
    REFERENCES rutinas (id_rutina) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- OBJETIVOS_ENTRENAMIENTO: metas fijadas para un cliente (RN-21); el
-- histórico se conserva (RN-17). 'cumplido' o 'cancelado' exigen
-- fecha_cierre (FR-010), validada en el servicio.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS objetivos_entrenamiento (
  id_objetivo INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED NOT NULL,
  id_entrenador INT UNSIGNED NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  fecha_objetivo DATE NULL,
  estado ENUM('pendiente', 'en_curso', 'cumplido', 'cancelado') NOT NULL DEFAULT 'pendiente',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATE NULL,
  PRIMARY KEY (id_objetivo),
  KEY ix_objetivos_cliente_estado (id_cliente, estado),
  KEY ix_objetivos_entrenador (id_entrenador),
  CONSTRAINT fk_objetivos_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE RESTRICT,
  CONSTRAINT fk_objetivos_entrenador FOREIGN KEY (id_entrenador)
    REFERENCES entrenadores (id_entrenador) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- PROGRESOS_CLIENTES: histórico INMUTABLE de evolución (FR-011, RN-17).
-- No existen endpoints de modificación ni eliminación; peso y medidas son
-- opcionales (clarificación 2026-10-19), basta fecha y comentario.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progresos_clientes (
  id_progreso INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente INT UNSIGNED NOT NULL,
  id_entrenador INT UNSIGNED NOT NULL,
  -- Opcional; si viene debe pertenecer al mismo cliente (FR-011).
  id_objetivo INT UNSIGNED NULL,
  fecha DATE NOT NULL,
  comentario VARCHAR(500) NOT NULL,
  peso DECIMAL(5,2) NULL,
  pecho DECIMAL(5,1) NULL,
  cintura DECIMAL(5,1) NULL,
  cadera DECIMAL(5,1) NULL,
  muslos DECIMAL(5,1) NULL,
  PRIMARY KEY (id_progreso),
  KEY ix_progresos_cliente_fecha (id_cliente, fecha),
  KEY ix_progresos_entrenador (id_entrenador),
  CONSTRAINT fk_progresos_cliente FOREIGN KEY (id_cliente)
    REFERENCES clientes (id_cliente) ON DELETE RESTRICT,
  CONSTRAINT fk_progresos_entrenador FOREIGN KEY (id_entrenador)
    REFERENCES entrenadores (id_entrenador) ON DELETE RESTRICT,
  CONSTRAINT fk_progresos_objetivo FOREIGN KEY (id_objetivo)
    REFERENCES objetivos_entrenamiento (id_objetivo) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
