-- Semilla: tipos de membresía de ejemplo para desarrollo y pruebas (Sprint 2).
-- Idempotente mediante WHERE NOT EXISTS (la tabla no tiene UNIQUE sobre
-- nombre, así que no se usa ON DUPLICATE KEY).
-- La semilla del administrador vive en seed-administrador.sql.

INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado)
SELECT * FROM (
  SELECT 'Mensual' AS nombre, 'Acceso durante 30 dias al gimnasio' AS descripcion,
         30 AS duracion, 500.00 AS precio, 'activo' AS estado
  UNION ALL
  SELECT 'Trimestral', 'Acceso durante 90 dias al gimnasio', 90, 1350.00, 'activo'
) AS nuevos
WHERE NOT EXISTS (
  SELECT 1 FROM tipos_membresia t
  WHERE t.nombre = nuevos.nombre
);
