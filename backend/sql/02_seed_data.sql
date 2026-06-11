-- ============================================================
-- SEED DATA — Mundial 2026
-- Contraseñas gestionadas por Auth0 (no se guardan en DB)
-- ============================================================

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

