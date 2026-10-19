-- Semilla: usuario administrador inicial (Supuesto del spec, research.md D9).
-- La contraseña está almacenada como hash bcrypt; las credenciales de
-- desarrollo están documentadas en database/README.md.
-- La migración es idempotente gracias a la restricción UNIQUE sobre correo.

INSERT INTO usuarios (nombre, correo, password, rol, estado)
VALUES (
  'Administrador',
  'admin@gimnasio.test',
  '$2b$10$Oo/UW./GPJ2oySrWci.a2e5v5QyIPDTd5XIMcICVJhzI9aA5CpDHu',
  'administrador',
  'activo'
)
   ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password = VALUES(password);
