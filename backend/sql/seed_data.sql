-- ============================================================
-- SEED DATA — Mundial 2026
-- Contraseña de todos los usuarios: Test1234!
-- ============================================================

-- ============================================================
-- USUARIOS
-- ============================================================

INSERT INTO Usuario (mail, password_hash, rol, doc_pais, doc_tipo, doc_numero, dir_pais, dir_localidad, dir_calle, dir_numero, dir_codigo_postal) VALUES
('admin@mundial2026.com',    '$2b$12$q6esTwUOdUaPbnTi4icSrOXzQ5AAaU9Ql3fcFY.yPRq3PJeQ0jMFO', 'ADMIN',        'Uruguay',   'CI',   '12345678',         'Uruguay',   'Montevideo',       'Av. 8 de Octubre',  '2738', '11600'),
('func1@mundial2026.com',    '$2b$12$q6esTwUOdUaPbnTi4icSrOXzQ5AAaU9Ql3fcFY.yPRq3PJeQ0jMFO', 'FUNCIONARIO',  'Uruguay',   'CI',   '23456789',         'Uruguay',   'Montevideo',       'Av. Brasil',        '2737', '11300'),
('func2@mundial2026.com',    '$2b$12$q6esTwUOdUaPbnTi4icSrOXzQ5AAaU9Ql3fcFY.yPRq3PJeQ0jMFO', 'FUNCIONARIO',  'México',    'CURP', 'GARJ900101HMCL09', 'México',    'Ciudad de México', 'Reforma',           '2000', '06600'),
('juan.perez@gmail.com',     '$2b$12$q6esTwUOdUaPbnTi4icSrOXzQ5AAaU9Ql3fcFY.yPRq3PJeQ0jMFO', 'USUARIO_FINAL','Uruguay',   'CI',   '34567890',         'Uruguay',   'Montevideo',       'Bulevar Artigas',   '1500', '11200'),
('maria.garcia@gmail.com',   '$2b$12$q6esTwUOdUaPbnTi4icSrOXzQ5AAaU9Ql3fcFY.yPRq3PJeQ0jMFO', 'USUARIO_FINAL','Argentina', 'DNI',  '30123456',         'Argentina', 'Buenos Aires',     'Corrientes',        '1234', 'C1043'),
('carlos.rodriguez@gmail.com','$2b$12$q6esTwUOdUaPbnTi4icSrOXzQ5AAaU9Ql3fcFY.yPRq3PJeQ0jMFO','USUARIO_FINAL','Brasil',    'CPF',  '12345678909',      'Brasil',    'São Paulo',        'Av. Paulista',      '900',  '01310100'),
('sofia.diaz@gmail.com',     '$2b$12$q6esTwUOdUaPbnTi4icSrOXzQ5AAaU9Ql3fcFY.yPRq3PJeQ0jMFO', 'USUARIO_FINAL','España',    'DNI',  '12345678Z',        'España',    'Madrid',           'Gran Vía',          '28',   '28013');

INSERT INTO UsuarioTelefono (usuario_mail, telefono) VALUES
('admin@mundial2026.com',     '+598 99 123 456'),
('juan.perez@gmail.com',      '+598 91 234 567'),
('juan.perez@gmail.com',      '+598 92 345 678'),
('maria.garcia@gmail.com',    '+54 11 2345 6789'),
('carlos.rodriguez@gmail.com','+55 11 91234 5678'),
('sofia.diaz@gmail.com',      '+34 91 123 4567');

INSERT INTO Admin (usuario_mail, pais_sede, fecha_asignacion_cargo) VALUES
('admin@mundial2026.com', 'Uruguay', '2025-01-15');

INSERT INTO Funcionario (usuario_mail, numero_legajo) VALUES
('func1@mundial2026.com', 'LEG-001'),
('func2@mundial2026.com', 'LEG-002');

INSERT INTO UsuarioFinal (usuario_mail, fecha_registro, estado_verificacion) VALUES
('juan.perez@gmail.com',      '2025-11-01 10:00:00', 'VERIFICADO'),
('maria.garcia@gmail.com',    '2025-11-15 14:30:00', 'VERIFICADO'),
('carlos.rodriguez@gmail.com','2025-12-01 09:00:00', 'VERIFICADO'),
('sofia.diaz@gmail.com',      '2026-01-10 16:00:00', 'PENDIENTE');

-- ============================================================
-- ESTADIOS
-- ============================================================

INSERT INTO Estadio (dir_pais, dir_localidad, dir_calle, dir_numero, nombre, aforo) VALUES
('México',  'Ciudad de México', 'Calzada de Tlalpan',   '3465', 'Estadio Azteca',     72766),
('USA',     'East Rutherford',  'MetLife Stadium Drive', '1',    'MetLife Stadium',    78576),
('USA',     'Miami Gardens',    'Don Shula Drive',       '347',  'Hard Rock Stadium',  64091),
('USA',     'Arlington',        'Randol Mill Road',      '900',  'AT&T Stadium',       80000),
('Canadá',  'Toronto',          'Princes Boulevard',     '170',  'BMO Field',          44315),
('Canadá',  'Vancouver',        'Pacific Boulevard',     '777',  'BC Place',           54500);

-- ============================================================
-- SECTORES (A=VIP, B=Tribuna, C=Platea, D=Popular)
-- ============================================================

-- Estadio Azteca
INSERT INTO Sector (tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, capacidad, costo) VALUES
('A', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465',  5000, 600.00),
('B', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465', 18000, 300.00),
('C', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465', 25000, 150.00),
('D', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465', 24766,  80.00);

-- MetLife Stadium
INSERT INTO Sector (tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, capacidad, costo) VALUES
('A', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1',  6000, 700.00),
('B', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1', 20000, 350.00),
('C', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1', 27000, 200.00),
('D', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1', 25576, 100.00);

-- Hard Rock Stadium
INSERT INTO Sector (tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, capacidad, costo) VALUES
('A', 'USA', 'Miami Gardens', 'Don Shula Drive', '347',  5000, 650.00),
('B', 'USA', 'Miami Gardens', 'Don Shula Drive', '347', 15000, 320.00),
('C', 'USA', 'Miami Gardens', 'Don Shula Drive', '347', 22000, 180.00),
('D', 'USA', 'Miami Gardens', 'Don Shula Drive', '347', 22091,  90.00);

-- AT&T Stadium
INSERT INTO Sector (tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, capacidad, costo) VALUES
('A', 'USA', 'Arlington', 'Randol Mill Road', '900',  7000, 750.00),
('B', 'USA', 'Arlington', 'Randol Mill Road', '900', 20000, 380.00),
('C', 'USA', 'Arlington', 'Randol Mill Road', '900', 27000, 200.00),
('D', 'USA', 'Arlington', 'Randol Mill Road', '900', 26000, 100.00);

-- BMO Field
INSERT INTO Sector (tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, capacidad, costo) VALUES
('A', 'Canadá', 'Toronto', 'Princes Boulevard', '170',  4000, 500.00),
('B', 'Canadá', 'Toronto', 'Princes Boulevard', '170', 11000, 280.00),
('C', 'Canadá', 'Toronto', 'Princes Boulevard', '170', 15000, 160.00),
('D', 'Canadá', 'Toronto', 'Princes Boulevard', '170', 14315,  70.00);

-- BC Place
INSERT INTO Sector (tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, capacidad, costo) VALUES
('A', 'Canadá', 'Vancouver', 'Pacific Boulevard', '777',  5000, 550.00),
('B', 'Canadá', 'Vancouver', 'Pacific Boulevard', '777', 13500, 290.00),
('C', 'Canadá', 'Vancouver', 'Pacific Boulevard', '777', 18000, 170.00),
('D', 'Canadá', 'Vancouver', 'Pacific Boulevard', '777', 18000,  85.00);

-- ============================================================
-- EQUIPOS
-- ============================================================

INSERT INTO Equipo (id, nombre) VALUES
('e0000001-0000-0000-0000-000000000001', 'México'),
('e0000002-0000-0000-0000-000000000002', 'Sudáfrica'),
('e0000003-0000-0000-0000-000000000003', 'Brasil'),
('e0000004-0000-0000-0000-000000000004', 'Marruecos'),
('e0000005-0000-0000-0000-000000000005', 'Estados Unidos'),
('e0000006-0000-0000-0000-000000000006', 'Paraguay'),
('e0000007-0000-0000-0000-000000000007', 'Países Bajos'),
('e0000008-0000-0000-0000-000000000008', 'Japón'),
('e0000009-0000-0000-0000-000000000009', 'Canadá'),
('e0000010-0000-0000-0000-000000000010', 'Bosnia y Herzegovina'),
('e0000011-0000-0000-0000-000000000011', 'Argentina'),
('e0000012-0000-0000-0000-000000000012', 'Ecuador'),
('e0000013-0000-0000-0000-000000000013', 'Corea del Sur'),
('e0000014-0000-0000-0000-000000000014', 'República Checa'),
('e0000015-0000-0000-0000-000000000015', 'Alemania'),
('e0000016-0000-0000-0000-000000000016', 'Francia'),
('e0000017-0000-0000-0000-000000000017', 'España'),
('e0000018-0000-0000-0000-000000000018', 'Inglaterra'),
('e0000019-0000-0000-0000-000000000019', 'Portugal'),
('e0000020-0000-0000-0000-000000000020', 'Croacia'),
('e0000021-0000-0000-0000-000000000021', 'Uruguay'),
('e0000022-0000-0000-0000-000000000022', 'Colombia'),
('e0000023-0000-0000-0000-000000000023', 'Suiza'),
('e0000024-0000-0000-0000-000000000024', 'Senegal'),
('e0000025-0000-0000-0000-000000000025', 'Australia'),
('e0000026-0000-0000-0000-000000000026', 'Bélgica'),
('e0000027-0000-0000-0000-000000000027', 'Italia'),
('e0000028-0000-0000-0000-000000000028', 'Costa Rica'),
('e0000029-0000-0000-0000-000000000029', 'Serbia'),
('e0000030-0000-0000-0000-000000000030', 'Túnez');

-- ============================================================
-- EVENTOS (fase de grupos — horarios UTC)
-- ============================================================

INSERT INTO Evento (id, fecha, equipo_local_id, equipo_visitante_id, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('ev000001-0000-0000-0000-000000000001', '2026-06-11 13:00:00', 'e0000001-0000-0000-0000-000000000001', 'e0000002-0000-0000-0000-000000000002', 'México',  'Ciudad de México', 'Calzada de Tlalpan',   '3465'),
('ev000002-0000-0000-0000-000000000002', '2026-06-11 21:00:00', 'e0000013-0000-0000-0000-000000000013', 'e0000014-0000-0000-0000-000000000014', 'México',  'Ciudad de México', 'Calzada de Tlalpan',   '3465'),
('ev000003-0000-0000-0000-000000000003', '2026-06-13 20:00:00', 'e0000003-0000-0000-0000-000000000003', 'e0000004-0000-0000-0000-000000000004', 'USA',     'East Rutherford',  'MetLife Stadium Drive', '1'),
('ev000004-0000-0000-0000-000000000004', '2026-06-12 18:00:00', 'e0000005-0000-0000-0000-000000000005', 'e0000006-0000-0000-0000-000000000006', 'USA',     'Miami Gardens',    'Don Shula Drive',       '347'),
('ev000005-0000-0000-0000-000000000005', '2026-06-14 15:00:00', 'e0000007-0000-0000-0000-000000000007', 'e0000008-0000-0000-0000-000000000008', 'USA',     'Arlington',        'Randol Mill Road',      '900'),
('ev000006-0000-0000-0000-000000000006', '2026-06-12 15:00:00', 'e0000009-0000-0000-0000-000000000009', 'e0000010-0000-0000-0000-000000000010', 'Canadá',  'Toronto',          'Princes Boulevard',     '170'),
('ev000007-0000-0000-0000-000000000007', '2026-06-15 20:00:00', 'e0000011-0000-0000-0000-000000000011', 'e0000012-0000-0000-0000-000000000012', 'Canadá',  'Vancouver',        'Pacific Boulevard',     '777'),
('ev000008-0000-0000-0000-000000000008', '2026-06-16 20:00:00', 'e0000016-0000-0000-0000-000000000016', 'e0000015-0000-0000-0000-000000000015', 'USA',     'East Rutherford',  'MetLife Stadium Drive', '1');

-- ============================================================
-- EVENTO_SECTOR (habilita todos los sectores para cada evento)
-- ============================================================

-- ev01: México vs Sudáfrica @ Azteca
INSERT INTO EventoSector (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('ev000001-0000-0000-0000-000000000001', 'A', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465'),
('ev000001-0000-0000-0000-000000000001', 'B', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465'),
('ev000001-0000-0000-0000-000000000001', 'C', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465'),
('ev000001-0000-0000-0000-000000000001', 'D', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465');

-- ev02: Corea del Sur vs República Checa @ Azteca
INSERT INTO EventoSector (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('ev000002-0000-0000-0000-000000000002', 'A', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465'),
('ev000002-0000-0000-0000-000000000002', 'B', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465'),
('ev000002-0000-0000-0000-000000000002', 'C', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465'),
('ev000002-0000-0000-0000-000000000002', 'D', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465');

-- ev03: Brasil vs Marruecos @ MetLife
INSERT INTO EventoSector (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('ev000003-0000-0000-0000-000000000003', 'A', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1'),
('ev000003-0000-0000-0000-000000000003', 'B', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1'),
('ev000003-0000-0000-0000-000000000003', 'C', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1'),
('ev000003-0000-0000-0000-000000000003', 'D', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1');

-- ev04: USA vs Paraguay @ Hard Rock
INSERT INTO EventoSector (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('ev000004-0000-0000-0000-000000000004', 'A', 'USA', 'Miami Gardens', 'Don Shula Drive', '347'),
('ev000004-0000-0000-0000-000000000004', 'B', 'USA', 'Miami Gardens', 'Don Shula Drive', '347'),
('ev000004-0000-0000-0000-000000000004', 'C', 'USA', 'Miami Gardens', 'Don Shula Drive', '347'),
('ev000004-0000-0000-0000-000000000004', 'D', 'USA', 'Miami Gardens', 'Don Shula Drive', '347');

-- ev05: Países Bajos vs Japón @ AT&T
INSERT INTO EventoSector (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('ev000005-0000-0000-0000-000000000005', 'A', 'USA', 'Arlington', 'Randol Mill Road', '900'),
('ev000005-0000-0000-0000-000000000005', 'B', 'USA', 'Arlington', 'Randol Mill Road', '900'),
('ev000005-0000-0000-0000-000000000005', 'C', 'USA', 'Arlington', 'Randol Mill Road', '900'),
('ev000005-0000-0000-0000-000000000005', 'D', 'USA', 'Arlington', 'Randol Mill Road', '900');

-- ev06: Canadá vs Bosnia @ BMO Field
INSERT INTO EventoSector (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('ev000006-0000-0000-0000-000000000006', 'A', 'Canadá', 'Toronto', 'Princes Boulevard', '170'),
('ev000006-0000-0000-0000-000000000006', 'B', 'Canadá', 'Toronto', 'Princes Boulevard', '170'),
('ev000006-0000-0000-0000-000000000006', 'C', 'Canadá', 'Toronto', 'Princes Boulevard', '170'),
('ev000006-0000-0000-0000-000000000006', 'D', 'Canadá', 'Toronto', 'Princes Boulevard', '170');

-- ev07: Argentina vs Ecuador @ BC Place
INSERT INTO EventoSector (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('ev000007-0000-0000-0000-000000000007', 'A', 'Canadá', 'Vancouver', 'Pacific Boulevard', '777'),
('ev000007-0000-0000-0000-000000000007', 'B', 'Canadá', 'Vancouver', 'Pacific Boulevard', '777'),
('ev000007-0000-0000-0000-000000000007', 'C', 'Canadá', 'Vancouver', 'Pacific Boulevard', '777'),
('ev000007-0000-0000-0000-000000000007', 'D', 'Canadá', 'Vancouver', 'Pacific Boulevard', '777');

-- ev08: Francia vs Alemania @ MetLife
INSERT INTO EventoSector (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('ev000008-0000-0000-0000-000000000008', 'A', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1'),
('ev000008-0000-0000-0000-000000000008', 'B', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1'),
('ev000008-0000-0000-0000-000000000008', 'C', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1'),
('ev000008-0000-0000-0000-000000000008', 'D', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1');

-- ============================================================
-- VENTAS
-- estado_id: 1=PENDIENTE, 2=CONFIRMADA, 3=PAGA
-- precio = costo_entradas * 1.05 (comisión 5%)
-- ============================================================

INSERT INTO Venta (id, usuario_mail, fecha, estado_id, precio, tasa_comision) VALUES
-- juan.perez compra 2 entradas sector B Azteca ($300 c/u): 600 * 1.05 = $630
('vt000001-0000-0000-0000-000000000001', 'juan.perez@gmail.com',      '2026-03-10 10:00:00', 3, 630.00, 0.0500),
-- maria.garcia compra 3 entradas sector B MetLife ($350 c/u): 1050 * 1.05 = $1102.50
('vt000002-0000-0000-0000-000000000002', 'maria.garcia@gmail.com',    '2026-03-15 14:00:00', 3, 1102.50, 0.0500),
-- carlos.rodriguez compra 1 entrada sector A Azteca ($600): 600 * 1.05 = $630
('vt000003-0000-0000-0000-000000000003', 'carlos.rodriguez@gmail.com','2026-03-20 09:00:00', 3, 630.00, 0.0500),
-- sofia.diaz compra 2 entradas sector C AT&T ($200 c/u): 400 * 1.05 = $420
('vt000004-0000-0000-0000-000000000004', 'sofia.diaz@gmail.com',      '2026-04-01 11:00:00', 2, 420.00, 0.0500);

-- ============================================================
-- ENTRADAS
-- ============================================================

-- Venta 1: juan.perez — 2 entradas sector B @ Azteca, ev01
INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, consumido, contador_transferencias) VALUES
('en000001-0000-0000-0000-000000000001', 'vt000001-0000-0000-0000-000000000001', 'juan.perez@gmail.com', 300.00, 'ev000001-0000-0000-0000-000000000001', 'B', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465', FALSE, 0),
-- Entrada 2 fue transferida a sofia.diaz (titular actualizado, contador=1)
('en000002-0000-0000-0000-000000000002', 'vt000001-0000-0000-0000-000000000001', 'sofia.diaz@gmail.com', 300.00, 'ev000001-0000-0000-0000-000000000001', 'B', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465', FALSE, 1);

-- Venta 2: maria.garcia — 3 entradas sector B @ MetLife, ev03
INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, consumido, contador_transferencias) VALUES
('en000003-0000-0000-0000-000000000003', 'vt000002-0000-0000-0000-000000000002', 'maria.garcia@gmail.com', 350.00, 'ev000003-0000-0000-0000-000000000003', 'B', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1', FALSE, 0),
('en000004-0000-0000-0000-000000000004', 'vt000002-0000-0000-0000-000000000002', 'maria.garcia@gmail.com', 350.00, 'ev000003-0000-0000-0000-000000000003', 'B', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1', FALSE, 0),
('en000005-0000-0000-0000-000000000005', 'vt000002-0000-0000-0000-000000000002', 'maria.garcia@gmail.com', 350.00, 'ev000003-0000-0000-0000-000000000003', 'B', 'USA', 'East Rutherford', 'MetLife Stadium Drive', '1', FALSE, 0);

-- Venta 3: carlos.rodriguez — 1 entrada sector A @ Azteca, ev01 (consumida)
INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, consumido, contador_transferencias) VALUES
('en000006-0000-0000-0000-000000000006', 'vt000003-0000-0000-0000-000000000003', 'carlos.rodriguez@gmail.com', 600.00, 'ev000001-0000-0000-0000-000000000001', 'A', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465', TRUE, 0);

-- Venta 4: sofia.diaz — 2 entradas sector C @ AT&T, ev05
INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, consumido, contador_transferencias) VALUES
('en000007-0000-0000-0000-000000000007', 'vt000004-0000-0000-0000-000000000004', 'sofia.diaz@gmail.com', 200.00, 'ev000005-0000-0000-0000-000000000005', 'C', 'USA', 'Arlington', 'Randol Mill Road', '900', FALSE, 0),
('en000008-0000-0000-0000-000000000008', 'vt000004-0000-0000-0000-000000000004', 'sofia.diaz@gmail.com', 200.00, 'ev000005-0000-0000-0000-000000000005', 'C', 'USA', 'Arlington', 'Randol Mill Road', '900', FALSE, 0);

-- ============================================================
-- TRANSFERENCIAS
-- ============================================================

-- juan.perez transfiere en000002 a sofia.diaz (ACEPTADA)
INSERT INTO Transferencia (id, entrada_id, origen_mail, destino_mail, fecha, estado, nro_en_cadena) VALUES
('tr000001-0000-0000-0000-000000000001', 'en000002-0000-0000-0000-000000000002', 'juan.perez@gmail.com', 'sofia.diaz@gmail.com', '2026-04-05 16:00:00', 'ACEPTADA', 1);

-- maria.garcia intenta transferir en000003 a carlos.rodriguez (PENDIENTE)
INSERT INTO Transferencia (id, entrada_id, origen_mail, destino_mail, fecha, estado, nro_en_cadena) VALUES
('tr000002-0000-0000-0000-000000000002', 'en000003-0000-0000-0000-000000000003', 'maria.garcia@gmail.com', 'carlos.rodriguez@gmail.com', '2026-05-01 10:00:00', 'PENDIENTE', 1);

-- ============================================================
-- DISPOSITIVOS
-- ============================================================

INSERT INTO Dispositivo (id, funcionario_mail, descripcion, activo) VALUES
('dp000001-0000-0000-0000-000000000001', 'func1@mundial2026.com', 'Scanner Azteca - Entrada Norte', TRUE),
('dp000002-0000-0000-0000-000000000002', 'func2@mundial2026.com', 'Scanner Azteca - Entrada Sur',   TRUE);

-- ============================================================
-- FUNCIONARIO_SECTOR_EVENTO
-- func1 asignado a sectores A y B del Azteca para ev01
-- func2 asignado a sectores C y D del Azteca para ev01
-- ============================================================

INSERT INTO FuncionarioSectorEvento (funcionario_mail, evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero) VALUES
('func1@mundial2026.com', 'ev000001-0000-0000-0000-000000000001', 'A', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465'),
('func1@mundial2026.com', 'ev000001-0000-0000-0000-000000000001', 'B', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465'),
('func2@mundial2026.com', 'ev000001-0000-0000-0000-000000000001', 'C', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465'),
('func2@mundial2026.com', 'ev000001-0000-0000-0000-000000000001', 'D', 'México', 'Ciudad de México', 'Calzada de Tlalpan', '3465');

-- ============================================================
-- QR
-- ============================================================

-- QR activo para en000001 (juan.perez, sin consumir)
INSERT INTO Qr (id, entrada_id, codigo_hash, creado_en, activo) VALUES
('qr000001-0000-0000-0000-000000000001', 'en000001-0000-0000-0000-000000000001', 'a3f8c2d1e4b7f09a3c5e7d9f1b3e5c7a9d2f4b6e8c0a2d4f6b8e0c2a4d6f8b0', '2026-06-11 12:50:00', TRUE);

-- QR consumido de en000006 (carlos.rodriguez, ya validada)
INSERT INTO Qr (id, entrada_id, codigo_hash, creado_en, activo) VALUES
('qr000002-0000-0000-0000-000000000002', 'en000006-0000-0000-0000-000000000006', 'b4e9d3a2f5c8e1b4d6f8a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2', '2026-06-11 12:55:00', FALSE);

-- ============================================================
-- VALIDACIONES
-- ============================================================

-- en000006 validada por func1 con dp000001
INSERT INTO Validacion (id, entrada_id, qr_id, dispositivo_id, funcionario_mail, timestamp_val) VALUES
('vl000001-0000-0000-0000-000000000001', 'en000006-0000-0000-0000-000000000006', 'qr000002-0000-0000-0000-000000000002', 'dp000001-0000-0000-0000-000000000001', 'func1@mundial2026.com', '2026-06-11 13:15:00');

SET FOREIGN_KEY_CHECKS = 1;
