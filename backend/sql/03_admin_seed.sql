-- =============================================================
-- BOOTSTRAP: usuario admin inicial
-- Ejecutar UNA SOLA VEZ después de 01_schemas.sql
-- Credenciales en Auth0: admin@ticketing.com / Admin1234!
-- Después de correr este SQL, crear el usuario en Auth0 y
-- hacer UPDATE Usuario SET auth0_id='auth0|xxx' WHERE mail='admin@ticketing.com'
-- =============================================================

INSERT INTO Usuario (mail, nombre, apellido, rol,
                     doc_pais, doc_tipo, doc_numero,
                     dir_pais, dir_localidad, dir_calle, dir_numero)
VALUES (
    'admin@ticketing.com',
    'Admin', 'Sistema',
    'ADMIN',
    'Uruguay', 'CI', '00000001',
    'Uruguay', 'Montevideo', 'Admin', '1'
);

INSERT INTO Admin (usuario_mail, pais_sede, fecha_asignacion_cargo)
VALUES ('admin@ticketing.com', 'Uruguay', '2026-01-01');



INSERT INTO Usuario (mail, nombre, apellido, rol,
                     doc_pais, doc_tipo, doc_numero,
                     dir_pais, dir_localidad, dir_calle, dir_numero)
VALUES (
    'admin.usa@ticketing.com',
    'Admin', 'Sistema',
    'ADMIN',
    'USA', 'CI', '00000001',
    'USA', 'New York', 'Admin', '1'
);

INSERT INTO Admin (usuario_mail, pais_sede, fecha_asignacion_cargo)
VALUES ('admin.usa@ticketing.com', 'USA', '2026-01-01');

INSERT INTO Usuario (mail, nombre, apellido, rol,
                     doc_pais, doc_tipo, doc_numero,
                     dir_pais, dir_localidad, dir_calle, dir_numero)
VALUES (
    'admin.mexico@ticketing.com',
    'Admin', 'Sistema',
    'ADMIN',
    'México', 'CI', '00000001',
    'México', 'Ciudad de México', 'Admin', '1'
);

INSERT INTO Admin (usuario_mail, pais_sede, fecha_asignacion_cargo)
VALUES ('admin.mexico@ticketing.com', 'México', '2026-01-01');


INSERT INTO Usuario (mail, nombre, apellido, rol,
                     doc_pais, doc_tipo, doc_numero,
                     dir_pais, dir_localidad, dir_calle, dir_numero)
VALUES (
    'admin.canada@ticketing.com',
    'Admin', 'Sistema',
    'ADMIN',
    'Canadá', 'CI', '00000001',
    'Canadá', 'Ottawa', 'Admin', '1'
);

INSERT INTO Admin (usuario_mail, pais_sede, fecha_asignacion_cargo)
VALUES ('admin.canada@ticketing.com', 'Canadá', '2026-01-01');

-- Después de crear el usuario en Auth0, actualizar el auth0_id:
-- UPDATE Usuario SET auth0_id = 'auth0|xxxx' WHERE mail = 'admin@ticketing.com';
