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
('México',  'Ciudad de México', 'Calzada de Tlalpan',    '3465', 'Estadio Azteca',    72766),
('USA',     'East Rutherford',  'MetLife Stadium Drive', '1',    'MetLife Stadium',   78576),
('USA',     'Miami Gardens',    'Don Shula Drive',       '347',  'Hard Rock Stadium', 64091),
('USA',     'Arlington',        'Randol Mill Road',      '900',  'AT&T Stadium',      80000),
('Canadá',  'Toronto',          'Princes Boulevard',     '170',  'BMO Field',         44315),
('Canadá',  'Vancouver',        'Pacific Boulevard',     '777',  'BC Place',          54500);

-- ============================================================
-- SECTORES
-- IDs asignados explícitamente para referenciarlos en el seed
-- Azteca:     VIP=1, Tribuna=2, Platea=3, Popular=4
-- MetLife:    VIP=5, Tribuna=6, Platea=7, Popular=8
-- Hard Rock:  VIP=9, Tribuna=10, Platea=11, Popular=12
-- AT&T:       VIP=13, Tribuna=14, Platea=15, Popular=16
-- BMO Field:  VIP=17, Tribuna=18, Platea=19, Popular=20
-- BC Place:   VIP=21, Tribuna=22, Platea=23, Popular=24
-- ============================================================

INSERT INTO Sector (id, estadio_pais, estadio_localidad, estadio_calle, estadio_numero, nombre, capacidad) VALUES
-- Estadio Azteca
( 1, 'México', 'Ciudad de México', 'Calzada de Tlalpan',    '3465', 'VIP',     5000),
( 2, 'México', 'Ciudad de México', 'Calzada de Tlalpan',    '3465', 'Tribuna', 18000),
( 3, 'México', 'Ciudad de México', 'Calzada de Tlalpan',    '3465', 'Platea',  25000),
( 4, 'México', 'Ciudad de México', 'Calzada de Tlalpan',    '3465', 'Popular', 24766),
-- MetLife Stadium
( 5, 'USA', 'East Rutherford',  'MetLife Stadium Drive', '1',    'VIP',     6000),
( 6, 'USA', 'East Rutherford',  'MetLife Stadium Drive', '1',    'Tribuna', 20000),
( 7, 'USA', 'East Rutherford',  'MetLife Stadium Drive', '1',    'Platea',  27000),
( 8, 'USA', 'East Rutherford',  'MetLife Stadium Drive', '1',    'Popular', 25576),
-- Hard Rock Stadium
( 9, 'USA', 'Miami Gardens',    'Don Shula Drive',       '347',  'VIP',     5000),
(10, 'USA', 'Miami Gardens',    'Don Shula Drive',       '347',  'Tribuna', 15000),
(11, 'USA', 'Miami Gardens',    'Don Shula Drive',       '347',  'Platea',  22000),
(12, 'USA', 'Miami Gardens',    'Don Shula Drive',       '347',  'Popular', 22091),
-- AT&T Stadium
(13, 'USA', 'Arlington',        'Randol Mill Road',      '900',  'VIP',     7000),
(14, 'USA', 'Arlington',        'Randol Mill Road',      '900',  'Tribuna', 20000),
(15, 'USA', 'Arlington',        'Randol Mill Road',      '900',  'Platea',  27000),
(16, 'USA', 'Arlington',        'Randol Mill Road',      '900',  'Popular', 26000),
-- BMO Field
(17, 'Canadá', 'Toronto',       'Princes Boulevard',     '170',  'VIP',     4000),
(18, 'Canadá', 'Toronto',       'Princes Boulevard',     '170',  'Tribuna', 11000),
(19, 'Canadá', 'Toronto',       'Princes Boulevard',     '170',  'Platea',  15000),
(20, 'Canadá', 'Toronto',       'Princes Boulevard',     '170',  'Popular', 14315),
-- BC Place
(21, 'Canadá', 'Vancouver',     'Pacific Boulevard',     '777',  'VIP',     5000),
(22, 'Canadá', 'Vancouver',     'Pacific Boulevard',     '777',  'Tribuna', 13500),
(23, 'Canadá', 'Vancouver',     'Pacific Boulevard',     '777',  'Platea',  18000),
(24, 'Canadá', 'Vancouver',     'Pacific Boulevard',     '777',  'Popular', 18000);

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
('ev000001-0000-0000-0000-000000000001', '2026-06-11 13:00:00', 'e0000001-0000-0000-0000-000000000001', 'e0000002-0000-0000-0000-000000000002', 'México',  'Ciudad de México', 'Calzada de Tlalpan',    '3465'),
('ev000002-0000-0000-0000-000000000002', '2026-06-11 21:00:00', 'e0000013-0000-0000-0000-000000000013', 'e0000014-0000-0000-0000-000000000014', 'México',  'Ciudad de México', 'Calzada de Tlalpan',    '3465'),
('ev000003-0000-0000-0000-000000000003', '2026-06-13 20:00:00', 'e0000003-0000-0000-0000-000000000003', 'e0000004-0000-0000-0000-000000000004', 'USA',     'East Rutherford',  'MetLife Stadium Drive', '1'),
('ev000004-0000-0000-0000-000000000004', '2026-06-12 18:00:00', 'e0000005-0000-0000-0000-000000000005', 'e0000006-0000-0000-0000-000000000006', 'USA',     'Miami Gardens',    'Don Shula Drive',       '347'),
('ev000005-0000-0000-0000-000000000005', '2026-06-14 15:00:00', 'e0000007-0000-0000-0000-000000000007', 'e0000008-0000-0000-0000-000000000008', 'USA',     'Arlington',        'Randol Mill Road',      '900'),
('ev000006-0000-0000-0000-000000000006', '2026-06-12 15:00:00', 'e0000009-0000-0000-0000-000000000009', 'e0000010-0000-0000-0000-000000000010', 'Canadá',  'Toronto',          'Princes Boulevard',     '170'),
('ev000007-0000-0000-0000-000000000007', '2026-06-15 20:00:00', 'e0000011-0000-0000-0000-000000000011', 'e0000012-0000-0000-0000-000000000012', 'Canadá',  'Vancouver',        'Pacific Boulevard',     '777'),
('ev000008-0000-0000-0000-000000000008', '2026-06-16 20:00:00', 'e0000016-0000-0000-0000-000000000016', 'e0000015-0000-0000-0000-000000000015', 'USA',     'East Rutherford',  'MetLife Stadium Drive', '1');

-- ============================================================
-- EVENTO_SECTOR — costo por sector por evento (fase de grupos)
-- Costos variarán en fases posteriores (octavos, semis, final)
-- ============================================================

-- ev01: México vs Sudáfrica @ Azteca (sectores 1-4)
INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES
('ev000001-0000-0000-0000-000000000001', 1, 600.00),
('ev000001-0000-0000-0000-000000000001', 2, 300.00),
('ev000001-0000-0000-0000-000000000001', 3, 150.00),
('ev000001-0000-0000-0000-000000000001', 4,  80.00);

-- ev02: Corea del Sur vs República Checa @ Azteca (sectores 1-4)
INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES
('ev000002-0000-0000-0000-000000000002', 1, 600.00),
('ev000002-0000-0000-0000-000000000002', 2, 300.00),
('ev000002-0000-0000-0000-000000000002', 3, 150.00),
('ev000002-0000-0000-0000-000000000002', 4,  80.00);

-- ev03: Brasil vs Marruecos @ MetLife (sectores 5-8)
INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES
('ev000003-0000-0000-0000-000000000003', 5, 700.00),
('ev000003-0000-0000-0000-000000000003', 6, 350.00),
('ev000003-0000-0000-0000-000000000003', 7, 200.00),
('ev000003-0000-0000-0000-000000000003', 8, 100.00);

-- ev04: USA vs Paraguay @ Hard Rock (sectores 9-12)
INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES
('ev000004-0000-0000-0000-000000000004',  9, 650.00),
('ev000004-0000-0000-0000-000000000004', 10, 320.00),
('ev000004-0000-0000-0000-000000000004', 11, 180.00),
('ev000004-0000-0000-0000-000000000004', 12,  90.00);

-- ev05: Países Bajos vs Japón @ AT&T (sectores 13-16)
INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES
('ev000005-0000-0000-0000-000000000005', 13, 750.00),
('ev000005-0000-0000-0000-000000000005', 14, 380.00),
('ev000005-0000-0000-0000-000000000005', 15, 200.00),
('ev000005-0000-0000-0000-000000000005', 16, 100.00);

-- ev06: Canadá vs Bosnia @ BMO Field (sectores 17-20)
INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES
('ev000006-0000-0000-0000-000000000006', 17, 500.00),
('ev000006-0000-0000-0000-000000000006', 18, 280.00),
('ev000006-0000-0000-0000-000000000006', 19, 160.00),
('ev000006-0000-0000-0000-000000000006', 20,  70.00);

-- ev07: Argentina vs Ecuador @ BC Place (sectores 21-24)
INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES
('ev000007-0000-0000-0000-000000000007', 21, 550.00),
('ev000007-0000-0000-0000-000000000007', 22, 290.00),
('ev000007-0000-0000-0000-000000000007', 23, 170.00),
('ev000007-0000-0000-0000-000000000007', 24,  85.00);

-- ev08: Francia vs Alemania @ MetLife (sectores 5-8)
INSERT INTO EventoSector (evento_id, sector_id, costo) VALUES
('ev000008-0000-0000-0000-000000000008', 5, 700.00),
('ev000008-0000-0000-0000-000000000008', 6, 350.00),
('ev000008-0000-0000-0000-000000000008', 7, 200.00),
('ev000008-0000-0000-0000-000000000008', 8, 100.00);

-- ============================================================
-- VENTAS
-- estado_id: 1=PENDIENTE, 2=CONFIRMADA, 3=PAGA
-- precio = costo_entradas * 1.05 (comisión 5%)
-- ============================================================

INSERT INTO Venta (id, usuario_mail, fecha, estado_id, precio, tasa_comision) VALUES
-- juan.perez: 2 entradas sector Tribuna Azteca ($300 c/u): 600 * 1.05 = $630
('vt000001-0000-0000-0000-000000000001', 'juan.perez@gmail.com',      '2026-03-10 10:00:00', 3, 630.00, 0.0500),
-- maria.garcia: 3 entradas sector Tribuna MetLife ($350 c/u): 1050 * 1.05 = $1102.50
('vt000002-0000-0000-0000-000000000002', 'maria.garcia@gmail.com',    '2026-03-15 14:00:00', 3, 1102.50, 0.0500),
-- carlos.rodriguez: 1 entrada sector VIP Azteca ($600): 600 * 1.05 = $630
('vt000003-0000-0000-0000-000000000003', 'carlos.rodriguez@gmail.com','2026-03-20 09:00:00', 3, 630.00, 0.0500),
-- sofia.diaz: 2 entradas sector Platea AT&T ($200 c/u): 400 * 1.05 = $420
('vt000004-0000-0000-0000-000000000004', 'sofia.diaz@gmail.com',      '2026-04-01 11:00:00', 2, 420.00, 0.0500);

-- ============================================================
-- ENTRADAS
-- ============================================================

-- Venta 1: juan.perez — 2 entradas Tribuna (sector_id=2) @ Azteca, ev01
INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, sector_id, consumido) VALUES
('en000001-0000-0000-0000-000000000001', 'vt000001-0000-0000-0000-000000000001', 'juan.perez@gmail.com',  300.00, 'ev000001-0000-0000-0000-000000000001', 2, FALSE),
-- entrada 2 fue transferida a sofia.diaz (titular actualizado)
('en000002-0000-0000-0000-000000000002', 'vt000001-0000-0000-0000-000000000001', 'sofia.diaz@gmail.com',  300.00, 'ev000001-0000-0000-0000-000000000001', 2, FALSE);

-- Venta 2: maria.garcia — 3 entradas Tribuna (sector_id=6) @ MetLife, ev03
INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, sector_id, consumido) VALUES
('en000003-0000-0000-0000-000000000003', 'vt000002-0000-0000-0000-000000000002', 'maria.garcia@gmail.com', 350.00, 'ev000003-0000-0000-0000-000000000003', 6, FALSE),
('en000004-0000-0000-0000-000000000004', 'vt000002-0000-0000-0000-000000000002', 'maria.garcia@gmail.com', 350.00, 'ev000003-0000-0000-0000-000000000003', 6, FALSE),
('en000005-0000-0000-0000-000000000005', 'vt000002-0000-0000-0000-000000000002', 'maria.garcia@gmail.com', 350.00, 'ev000003-0000-0000-0000-000000000003', 6, FALSE);

-- Venta 3: carlos.rodriguez — 1 entrada VIP (sector_id=1) @ Azteca, ev01 (consumida)
INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, sector_id, consumido) VALUES
('en000006-0000-0000-0000-000000000006', 'vt000003-0000-0000-0000-000000000003', 'carlos.rodriguez@gmail.com', 600.00, 'ev000001-0000-0000-0000-000000000001', 1, TRUE);

-- Venta 4: sofia.diaz — 2 entradas Platea (sector_id=15) @ AT&T, ev05
INSERT INTO Entrada (id, venta_id, titular_mail, costo, evento_id, sector_id, consumido) VALUES
('en000007-0000-0000-0000-000000000007', 'vt000004-0000-0000-0000-000000000004', 'sofia.diaz@gmail.com', 200.00, 'ev000005-0000-0000-0000-000000000005', 15, FALSE),
('en000008-0000-0000-0000-000000000008', 'vt000004-0000-0000-0000-000000000004', 'sofia.diaz@gmail.com', 200.00, 'ev000005-0000-0000-0000-000000000005', 15, FALSE);

-- ============================================================
-- TRANSFERENCIAS
-- Cada fila = un eslabón del log histórico de la entrada
-- ============================================================

-- juan.perez transfiere en000002 a sofia.diaz (ACEPTADA)
INSERT INTO Transferencia (id, entrada_id, origen_mail, destino_mail, fecha, estado) VALUES
('tr000001-0000-0000-0000-000000000001', 'en000002-0000-0000-0000-000000000002', 'juan.perez@gmail.com', 'sofia.diaz@gmail.com', '2026-04-05 16:00:00', 'ACEPTADA');

-- maria.garcia intenta transferir en000003 a carlos.rodriguez (PENDIENTE)
INSERT INTO Transferencia (id, entrada_id, origen_mail, destino_mail, fecha, estado) VALUES
('tr000002-0000-0000-0000-000000000002', 'en000003-0000-0000-0000-000000000003', 'maria.garcia@gmail.com', 'carlos.rodriguez@gmail.com', '2026-05-01 10:00:00', 'PENDIENTE');

-- ============================================================
-- DISPOSITIVOS
-- ============================================================

INSERT INTO Dispositivo (id, funcionario_mail, activo) VALUES
('dp000001-0000-0000-0000-000000000001', 'func1@mundial2026.com', TRUE),
('dp000002-0000-0000-0000-000000000002', 'func2@mundial2026.com', TRUE);

-- ============================================================
-- FUNCIONARIO_SECTOR_EVENTO
-- func1 asignado a VIP y Tribuna del Azteca para ev01 (sectores 1 y 2)
-- func2 asignado a Platea y Popular del Azteca para ev01 (sectores 3 y 4)
-- ============================================================

INSERT INTO FuncionarioSectorEvento (funcionario_mail, evento_id, sector_id) VALUES
('func1@mundial2026.com', 'ev000001-0000-0000-0000-000000000001', 1),
('func1@mundial2026.com', 'ev000001-0000-0000-0000-000000000001', 2),
('func2@mundial2026.com', 'ev000001-0000-0000-0000-000000000001', 3),
('func2@mundial2026.com', 'ev000001-0000-0000-0000-000000000001', 4);

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
