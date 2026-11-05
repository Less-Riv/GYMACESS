-- Semilla: datos de ejemplo del Sprint 4 para desarrollo y pruebas.
-- Da a los reportes del administrador un conjunto de datos representativo:
-- clientes en distintos estados y fechas de registro, membresías en los cuatro
-- estados del ENUM (incluida una activa que vence dentro de los 7 días
-- siguientes), pagos completados en varios periodos, accesos autorizados y
-- rechazados con su motivo, y un cliente con varias membresías para el cálculo
-- de adeudos (FR-011).
-- Idempotente mediante WHERE NOT EXISTS con la clave natural de cada fila.
-- La semilla del administrador vive en seed-administrador.sql; los tipos de
-- membresía de ejemplo en seed-datos-sprint2.sql; el entrenador de ejemplo en
-- seed-datos-sprint3.sql.

-- ---------------------------------------------------------------------------
-- 1) Clientes de ejemplo: dos activos con fechas de registro distintas, un
--    inactivo y un cuarto activo para el reporte de clientes (FR-006).
-- ---------------------------------------------------------------------------
INSERT INTO clientes (nombre, apellido, correo, telefono, fecha_registro, estado)
SELECT nuevos.nombre, nuevos.apellido, nuevos.correo, nuevos.telefono,
       nuevos.fecha_registro, nuevos.estado
FROM (
  SELECT 'Reporte' AS nombre, 'Cliente Uno' AS apellido,
         'reporte-cliente1@gimnasio.test' AS correo, '5577000001' AS telefono,
         DATE_SUB(CURDATE(), INTERVAL 40 DAY) AS fecha_registro, 'activo' AS estado
  UNION ALL
  SELECT 'Reporte', 'Cliente Dos', 'reporte-cliente2@gimnasio.test', '5577000002',
         DATE_SUB(CURDATE(), INTERVAL 200 DAY), 'inactivo'
  UNION ALL
  SELECT 'Reporte', 'Cliente Tres', 'reporte-cliente3@gimnasio.test', '5577000003',
         DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'activo'
  UNION ALL
  SELECT 'Reporte', 'Cliente Cuatro', 'reporte-cliente4@gimnasio.test', '5577000004',
         DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'activo'
) AS nuevos
WHERE NOT EXISTS (
  SELECT 1 FROM clientes c WHERE c.correo = nuevos.correo
);

-- ---------------------------------------------------------------------------
-- 2) Membresías de ejemplo. Un mismo cliente (Cliente Tres) tiene una
--    membresía en cada uno de los cuatro grupos de FR-007:
--      - Cliente Uno: activa que vence dentro de los 7 días (próxima a vencer).
--      - Cliente Tres: activa, próxima a vencer, vencida y cancelada.
--      - Cliente Cuatro: activa que vence dentro de 40 días.
-- ---------------------------------------------------------------------------
INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado)
SELECT c.id_cliente, t.id_tipo_membresia, nuevos.fecha_inicio, nuevos.fecha_fin, nuevos.estado
FROM (
  SELECT 'reporte-cliente1@gimnasio.test' AS correo, 'Mensual' AS tipo,
         DATE_SUB(CURDATE(), INTERVAL 20 DAY) AS fecha_inicio,
         DATE_ADD(CURDATE(), INTERVAL 5 DAY) AS fecha_fin, 'activo' AS estado
  UNION ALL
  SELECT 'reporte-cliente3@gimnasio.test', 'Mensual',
         DATE_SUB(CURDATE(), INTERVAL 20 DAY),
         DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'activo'
  UNION ALL
  SELECT 'reporte-cliente3@gimnasio.test', 'Trimestral',
         DATE_SUB(CURDATE(), INTERVAL 5 DAY),
         DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'activo'
  UNION ALL
  SELECT 'reporte-cliente3@gimnasio.test', 'Mensual',
         DATE_SUB(CURDATE(), INTERVAL 100 DAY),
         DATE_SUB(CURDATE(), INTERVAL 70 DAY), 'cancelada'
  UNION ALL
  SELECT 'reporte-cliente3@gimnasio.test', 'Mensual',
         DATE_SUB(CURDATE(), INTERVAL 60 DAY),
         DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'vencida'
  UNION ALL
  SELECT 'reporte-cliente4@gimnasio.test', 'Mensual',
         DATE_SUB(CURDATE(), INTERVAL 20 DAY),
         DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'activo'
) AS nuevos
INNER JOIN clientes c ON c.correo = nuevos.correo
INNER JOIN tipos_membresia t ON t.nombre = nuevos.tipo
WHERE NOT EXISTS (
  SELECT 1 FROM membresias m
  WHERE m.id_cliente = c.id_cliente
    AND m.id_tipo_membresia = t.id_tipo_membresia
    AND m.fecha_inicio = nuevos.fecha_inicio
);

-- ---------------------------------------------------------------------------
-- 3) Pagos completados repartidos en varios periodos. Solo el estado
--    'completado' se contabiliza como ingreso y descuenta del adeudo
--    (FR-008, FR-011). Cliente Tres paga parcialmente su última membresía
--    registrada (Trimestral) y queda con adeudo; Cliente Cuatro paga la suya
--    completa; Cliente Uno no paga nada.
-- ---------------------------------------------------------------------------
INSERT INTO pagos (id_cliente, id_membresia, monto, fecha_pago, metodo_pago, estado)
SELECT c.id_cliente, m.id_membresia, nuevos.monto, nuevos.fecha_pago,
       nuevos.metodo_pago, 'completado'
FROM (
  SELECT 'reporte-cliente3@gimnasio.test' AS correo, 'Trimestral' AS tipo,
         200.00 AS monto, DATE_SUB(CURDATE(), INTERVAL 2 DAY) AS fecha_pago,
         'Tarjeta' AS metodo_pago
  UNION ALL
  SELECT 'reporte-cliente3@gimnasio.test', 'Trimestral',
         200.00, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'Efectivo'
  UNION ALL
  SELECT 'reporte-cliente4@gimnasio.test', 'Mensual',
         500.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Tarjeta'
  UNION ALL
  SELECT 'reporte-cliente4@gimnasio.test', 'Mensual',
         500.00, DATE_SUB(CURDATE(), INTERVAL 45 DAY), 'Efectivo'
) AS nuevos
INNER JOIN clientes c ON c.correo = nuevos.correo
INNER JOIN tipos_membresia t ON t.nombre = nuevos.tipo
INNER JOIN membresias m ON m.id_cliente = c.id_cliente
  AND m.id_tipo_membresia = t.id_tipo_membresia
WHERE NOT EXISTS (
  SELECT 1 FROM pagos p
  WHERE p.id_cliente = c.id_cliente
    AND p.monto = nuevos.monto
    AND DATE(p.fecha_pago) = DATE(nuevos.fecha_pago)
);

-- ---------------------------------------------------------------------------
-- 4) Accesos autorizados y rechazados con su motivo, en varios periodos
--    (FR-010). El motivo es obligatorio cuando el acceso fue rechazado (RN-11).
-- ---------------------------------------------------------------------------
INSERT INTO accesos (id_cliente, fecha, hora, resultado, motivo)
SELECT c.id_cliente, nuevos.fecha, nuevos.hora, nuevos.resultado, nuevos.motivo
FROM (
  SELECT 'reporte-cliente2@gimnasio.test' AS correo,
         DATE_SUB(CURDATE(), INTERVAL 1 DAY) AS fecha, '07:10:00' AS hora,
         'autorizado' AS resultado, NULL AS motivo
  UNION ALL
  SELECT 'reporte-cliente3@gimnasio.test',
         DATE_SUB(CURDATE(), INTERVAL 3 DAY), '18:45:00', 'rechazado', 'Membresía vencida'
  UNION ALL
  SELECT 'reporte-cliente4@gimnasio.test',
         DATE_SUB(CURDATE(), INTERVAL 10 DAY), '07:05:00', 'autorizado', NULL
  UNION ALL
  SELECT 'reporte-cliente4@gimnasio.test',
         DATE_SUB(CURDATE(), INTERVAL 12 DAY), '19:20:00', 'rechazado', 'Rostro no reconocido'
) AS nuevos
INNER JOIN clientes c ON c.correo = nuevos.correo
WHERE NOT EXISTS (
  SELECT 1 FROM accesos a
  WHERE a.id_cliente = c.id_cliente
    AND a.fecha = nuevos.fecha
    AND a.hora = nuevos.hora
);
