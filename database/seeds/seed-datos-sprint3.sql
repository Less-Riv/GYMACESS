-- Semilla: datos de ejemplo del Sprint 3 para desarrollo y pruebas.
-- Idempotente mediante WHERE NOT EXISTS / correo único (Sprint 1).
-- La semilla del administrador vive en seed-administrador.sql; los tipos de
-- membresía de ejemplo en seed-datos-sprint2.sql.

-- ---------------------------------------------------------------------------
-- 1) Cuenta con rol entrenador (password: Entrena1234!, hash bcrypt cost 10).
-- ---------------------------------------------------------------------------
INSERT INTO usuarios (nombre, correo, password, rol)
SELECT 'Entrenador Demo', 'entrenador@gimnasio.test',
       '$2b$10$/6.e7UnfGXFgklyygh2am.uYznpjAR0GQgBFr7Blj9f2c2Af9fIYi',
       'entrenador'
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE correo = 'entrenador@gimnasio.test'
);

-- ---------------------------------------------------------------------------
-- 2) Ficha del entrenador asociada a esa cuenta (RN-15: una por usuario).
-- ---------------------------------------------------------------------------
INSERT INTO entrenadores (id_usuario, nombre, telefono, correo_contacto)
SELECT u.id_usuario, 'Entrenador Demo', '5511112222', 'entrenador@gimnasio.test'
FROM usuarios u
WHERE u.correo = 'entrenador@gimnasio.test'
  AND NOT EXISTS (
    SELECT 1 FROM entrenadores e WHERE e.id_usuario = u.id_usuario
  );

-- ---------------------------------------------------------------------------
-- 3) Dos clientes de ejemplo (correo único: el WHERE NOT EXISTS los hace
-- idempotentes y evita duplicar datos de los Sprints 1 y 2).
-- ---------------------------------------------------------------------------
INSERT INTO clientes (nombre, apellido, correo, telefono)
SELECT nuevos.nombre, nuevos.apellido, nuevos.correo, nuevos.telefono
FROM (
  SELECT 'Cliente' AS nombre, 'Demo Uno' AS apellido,
         'cliente-demo1@gimnasio.test' AS correo, '5533334444' AS telefono
  UNION ALL
  SELECT 'Cliente', 'Demo Dos', 'cliente-demo2@gimnasio.test', '5555556666'
) AS nuevos
WHERE NOT EXISTS (
  SELECT 1 FROM clientes c WHERE c.correo = nuevos.correo
);
