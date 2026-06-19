-- =============================================================
-- LIMPIEZA PREVIA (permite re-ejecutar el script desde 0)
-- =============================================================

DROP VIEW  IF EXISTS vw_cobertura_funcionarios;
DROP VIEW  IF EXISTS vw_eventos_mas_vendidos;
DROP VIEW  IF EXISTS vw_mayores_compradores;
DROP VIEW  IF EXISTS vw_disponibilidad;

DROP TABLE IF EXISTS FuncionarioSectorEvento;
DROP TABLE IF EXISTS Validacion;
DROP TABLE IF EXISTS Dispositivo;
DROP TABLE IF EXISTS Qr;
DROP TABLE IF EXISTS Transferencia;
DROP TABLE IF EXISTS Entrada;
DROP TABLE IF EXISTS EventoSector;
DROP TABLE IF EXISTS Venta;
DROP TABLE IF EXISTS Evento;
DROP TABLE IF EXISTS ComisionHistorica;
DROP TABLE IF EXISTS Estado;
DROP TABLE IF EXISTS Equipo;
DROP TABLE IF EXISTS Sector;
DROP TABLE IF EXISTS Estadio;
DROP TABLE IF EXISTS UsuarioFinal;
DROP TABLE IF EXISTS Admin;
DROP TABLE IF EXISTS Funcionario;
DROP TABLE IF EXISTS UsuarioTelefono;
DROP TABLE IF EXISTS Usuario;


-- =============================================================
-- MÓDULO 1: USUARIOS Y PERFILES
-- Generalización (t,e): Usuario → { Admin, Funcionario, UsuarioFinal }
-- =============================================================

CREATE TABLE Usuario (
    mail                VARCHAR(255) NOT NULL,
    auth0_id            VARCHAR(100),
    nombre              VARCHAR(100),
    apellido            VARCHAR(100),
    rol                 ENUM('ADMIN','FUNCIONARIO','USUARIO_FINAL') NOT NULL,

    doc_pais            VARCHAR(100) NOT NULL,
    doc_tipo            VARCHAR(50)  NOT NULL,
    doc_numero          VARCHAR(50)  NOT NULL,

    dir_pais            VARCHAR(100) NOT NULL,
    dir_localidad       VARCHAR(150) NOT NULL,
    dir_calle           VARCHAR(200) NOT NULL,
    dir_numero          VARCHAR(20)  NOT NULL,
    dir_codigo_postal   VARCHAR(20),

    PRIMARY KEY (mail),
    UNIQUE KEY uq_auth0 (auth0_id),
    UNIQUE KEY uq_documento (doc_pais, doc_tipo, doc_numero)
) ENGINE=InnoDB;

CREATE TABLE UsuarioTelefono (
    usuario_mail    VARCHAR(255) NOT NULL,
    telefono        VARCHAR(30)  NOT NULL,
    PRIMARY KEY (usuario_mail, telefono),
    CONSTRAINT fk_tel_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Atributo pais_sede: jurisdicción geográfica del admin ("Administrador por País Sede")
CREATE TABLE Admin (
    usuario_mail             VARCHAR(255) NOT NULL,
    pais_sede                VARCHAR(100) NOT NULL,
    fecha_asignacion_cargo   DATE         NOT NULL,
    PRIMARY KEY (usuario_mail),
    CONSTRAINT fk_admin_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Funcionario (
    usuario_mail    VARCHAR(255) NOT NULL,
    numero_legajo   VARCHAR(50)  NOT NULL,
    PRIMARY KEY (usuario_mail),
    UNIQUE KEY uq_legajo (numero_legajo),
    CONSTRAINT fk_func_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE UsuarioFinal (
    usuario_mail         VARCHAR(255)   NOT NULL,
    fecha_registro       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_verificacion  ENUM('PENDIENTE','VERIFICADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    saldo                DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    PRIMARY KEY (usuario_mail),
    CONSTRAINT fk_ufinal_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =============================================================
-- MÓDULO 2: INFRAESTRUCTURA
-- =============================================================

CREATE TABLE Estadio (
    dir_pais        VARCHAR(100) NOT NULL,
    dir_localidad   VARCHAR(150) NOT NULL,
    dir_calle       VARCHAR(200) NOT NULL,
    dir_numero      VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    aforo           INT          NOT NULL CHECK (aforo > 0),
    PRIMARY KEY (dir_pais, dir_localidad, dir_calle, dir_numero)
) ENGINE=InnoDB;

-- Sector: entidad con id propio — costo NO está aquí, varía por evento (ver EventoSector)
CREATE TABLE Sector (
    id                  INT           NOT NULL AUTO_INCREMENT,
    estadio_pais        VARCHAR(100)  NOT NULL,
    estadio_localidad   VARCHAR(150)  NOT NULL,
    estadio_calle       VARCHAR(200)  NOT NULL,
    estadio_numero      VARCHAR(20)   NOT NULL,
    nombre              VARCHAR(100)  NOT NULL,
    capacidad           INT           NOT NULL CHECK (capacidad > 0),
    PRIMARY KEY (id),
    CONSTRAINT fk_sector_estadio FOREIGN KEY
        (estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
        REFERENCES Estadio(dir_pais, dir_localidad, dir_calle, dir_numero)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =============================================================
-- MÓDULO 3: EQUIPOS Y EVENTOS
-- =============================================================

CREATE TABLE Equipo (
    id      CHAR(36)     NOT NULL DEFAULT (UUID()),
    nombre  VARCHAR(150) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_equipo_nombre (nombre)
) ENGINE=InnoDB;

-- Relación "Ocurre" (N:1) Evento → Estadio: necesaria para UNIQUE(estadio, fecha)
-- que impide a nivel DB dos eventos en el mismo recinto a la misma hora
CREATE TABLE Evento (
    id                   CHAR(36)     NOT NULL DEFAULT (UUID()),
    fecha                DATETIME     NOT NULL,
    equipo_local_id      CHAR(36)     NOT NULL,
    equipo_visitante_id  CHAR(36)     NOT NULL,
    estadio_pais         VARCHAR(100) NOT NULL,
    estadio_localidad    VARCHAR(150) NOT NULL,
    estadio_calle        VARCHAR(200) NOT NULL,
    estadio_numero       VARCHAR(20)  NOT NULL,
    cancelado            BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT chk_equipos_distintos CHECK (equipo_local_id <> equipo_visitante_id),
    CONSTRAINT fk_evento_local     FOREIGN KEY (equipo_local_id)
        REFERENCES Equipo(id),
    CONSTRAINT fk_evento_visitante FOREIGN KEY (equipo_visitante_id)
        REFERENCES Equipo(id),
    CONSTRAINT fk_evento_estadio   FOREIGN KEY
        (estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
        REFERENCES Estadio(dir_pais, dir_localidad, dir_calle, dir_numero)
        ON UPDATE CASCADE,
    UNIQUE KEY uq_estadio_fecha
        (estadio_pais, estadio_localidad, estadio_calle, estadio_numero, fecha)
) ENGINE=InnoDB;

-- Costo vive aquí: precio varía por evento/fase (grupos ≠ semifinal ≠ final)
CREATE TABLE EventoSector (
    evento_id   CHAR(36)      NOT NULL,
    sector_id   INT           NOT NULL,
    costo       DECIMAL(10,2) NOT NULL CHECK (costo >= 0),
    PRIMARY KEY (evento_id, sector_id),
    CONSTRAINT fk_es_evento FOREIGN KEY (evento_id)
        REFERENCES Evento(id) ON DELETE CASCADE,
    CONSTRAINT fk_es_sector FOREIGN KEY (sector_id)
        REFERENCES Sector(id)
) ENGINE=InnoDB;


-- =============================================================
-- MÓDULO 4: VENTAS Y ENTRADAS
-- =============================================================

CREATE TABLE Estado (
    id          INT         NOT NULL AUTO_INCREMENT,
    descripcion VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_estado_desc (descripcion)
) ENGINE=InnoDB;

INSERT INTO Estado (descripcion) VALUES
    ('PENDIENTE'),
    ('CONFIRMADA'),
    ('PAGA');

-- Historial de tasa de comisión — la letra dice "puede variar a lo largo del tiempo"
-- tasa_comision en Venta guarda el snapshot usado en esa venta
CREATE TABLE ComisionHistorica (
    id          INT          NOT NULL AUTO_INCREMENT,
    tasa        DECIMAL(5,4) NOT NULL,
    fecha_desde DATE         NOT NULL,
    fecha_hasta DATE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tasa_vigente (fecha_hasta)
) ENGINE=InnoDB;

INSERT INTO ComisionHistorica (tasa, fecha_desde, fecha_hasta)
VALUES (0.0500, '2026-01-01', NULL);

CREATE TABLE Venta (
    id              CHAR(36)      NOT NULL DEFAULT (UUID()),
    usuario_mail    VARCHAR(255)  NOT NULL,
    fecha           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_id       INT           NOT NULL,
    precio          DECIMAL(10,2) NOT NULL,
    tasa_comision   DECIMAL(5,4)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_venta_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail),
    CONSTRAINT fk_venta_estado  FOREIGN KEY (estado_id)
        REFERENCES Estado(id)
) ENGINE=InnoDB;

-- Entrada débil de la agregación EventoSector
-- costo: fijado al momento de compra desde EventoSector.costo
-- titular_mail: se actualiza al aceptar transferencia
CREATE TABLE Entrada (
    id           CHAR(36)      NOT NULL DEFAULT (UUID()),
    venta_id     CHAR(36)      NOT NULL,
    titular_mail VARCHAR(255)  NOT NULL,
    costo        DECIMAL(10,2) NOT NULL,
    evento_id    CHAR(36)      NOT NULL,
    sector_id    INT           NOT NULL,
    consumido    BOOLEAN       NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT fk_entrada_venta   FOREIGN KEY (venta_id)
        REFERENCES Venta(id),
    CONSTRAINT fk_entrada_titular FOREIGN KEY (titular_mail)
        REFERENCES Usuario(mail),
    CONSTRAINT fk_entrada_es      FOREIGN KEY (evento_id, sector_id)
        REFERENCES EventoSector(evento_id, sector_id)
) ENGINE=InnoDB;


-- =============================================================
-- MÓDULO 5: TRANSFERENCIAS
-- La tabla Transferencia ES el log histórico de cadena de custodia
-- Cada fila = un eslabón: quién transfirió, a quién, cuándo, estado
-- nro en cadena es computable: ROW_NUMBER() OVER (PARTITION BY entrada_id ORDER BY fecha)
-- =============================================================

CREATE TABLE Transferencia (
    id              CHAR(36)     NOT NULL DEFAULT (UUID()),
    entrada_id      CHAR(36)     NOT NULL,
    origen_mail     VARCHAR(255) NOT NULL,
    destino_mail    VARCHAR(255) NOT NULL,
    fecha           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado          ENUM('PENDIENTE','ACEPTADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    PRIMARY KEY (id),
    CONSTRAINT chk_transf_distintos CHECK (origen_mail <> destino_mail),
    CONSTRAINT fk_transf_entrada FOREIGN KEY (entrada_id)
        REFERENCES Entrada(id),
    CONSTRAINT fk_transf_origen  FOREIGN KEY (origen_mail)
        REFERENCES Usuario(mail),
    CONSTRAINT fk_transf_destino FOREIGN KEY (destino_mail)
        REFERENCES Usuario(mail)
) ENGINE=InnoDB;


-- =============================================================
-- MÓDULO 6: QR Y VALIDACIÓN
-- =============================================================

CREATE TABLE Qr (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    entrada_id  CHAR(36)     NOT NULL,
    codigo_hash VARCHAR(512) NOT NULL,
    creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT fk_qr_entrada FOREIGN KEY (entrada_id)
        REFERENCES Entrada(id) ON DELETE CASCADE,
    INDEX idx_qr_hash           (codigo_hash),
    INDEX idx_qr_entrada_activo (entrada_id, activo)
) ENGINE=InnoDB;

CREATE TABLE Dispositivo (
    id               CHAR(36)     NOT NULL DEFAULT (UUID()),
    funcionario_mail VARCHAR(255) NOT NULL,
    activo           BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT fk_disp_funcionario FOREIGN KEY (funcionario_mail)
        REFERENCES Funcionario(usuario_mail)
) ENGINE=InnoDB;

CREATE TABLE Validacion (
    id               CHAR(36)     NOT NULL DEFAULT (UUID()),
    entrada_id       CHAR(36)     NOT NULL,
    qr_id            CHAR(36)     NOT NULL,
    dispositivo_id   CHAR(36)     NOT NULL,
    funcionario_mail VARCHAR(255) NOT NULL,
    timestamp_val    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_validacion_entrada (entrada_id),
    CONSTRAINT fk_val_entrada     FOREIGN KEY (entrada_id)
        REFERENCES Entrada(id),
    CONSTRAINT fk_val_qr          FOREIGN KEY (qr_id)
        REFERENCES Qr(id),
    CONSTRAINT fk_val_dispositivo FOREIGN KEY (dispositivo_id)
        REFERENCES Dispositivo(id),
    CONSTRAINT fk_val_funcionario FOREIGN KEY (funcionario_mail)
        REFERENCES Funcionario(usuario_mail)
) ENGINE=InnoDB;

CREATE TABLE FuncionarioSectorEvento (
    id                INT          NOT NULL AUTO_INCREMENT,
    funcionario_mail  VARCHAR(255) NOT NULL,
    evento_id         CHAR(36)     NOT NULL,
    sector_id         INT          NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_fse (funcionario_mail, evento_id, sector_id),
    CONSTRAINT fk_fse_funcionario FOREIGN KEY (funcionario_mail)
        REFERENCES Funcionario(usuario_mail),
    CONSTRAINT fk_fse_es FOREIGN KEY (evento_id, sector_id)
        REFERENCES EventoSector(evento_id, sector_id)
) ENGINE=InnoDB;


-- =============================================================
-- VISTAS
-- =============================================================

CREATE VIEW vw_disponibilidad AS
SELECT
    es.evento_id,
    es.sector_id,
    s.nombre                        AS sector_nombre,
    s.estadio_pais,
    s.estadio_localidad,
    s.capacidad                     AS capacidad_maxima,
    COUNT(e.id)                     AS entradas_emitidas,
    s.capacidad - COUNT(e.id)       AS disponibles
FROM EventoSector es
JOIN Sector s ON s.id = es.sector_id
LEFT JOIN Entrada e ON (e.evento_id = es.evento_id AND e.sector_id = es.sector_id)
GROUP BY
    es.evento_id, es.sector_id, s.nombre,
    s.estadio_pais, s.estadio_localidad, s.capacidad;

CREATE VIEW vw_mayores_compradores AS
SELECT
    u.mail,
    COUNT(e.id)         AS total_entradas_compradas,
    SUM(v.precio)       AS total_gastado
FROM Usuario u
JOIN Venta v   ON v.usuario_mail = u.mail
JOIN Entrada e ON e.venta_id     = v.id
GROUP BY u.mail
ORDER BY total_entradas_compradas DESC;

CREATE VIEW vw_eventos_mas_vendidos AS
SELECT
    ev.id               AS evento_id,
    ev.fecha,
    eq_l.nombre         AS equipo_local,
    eq_v.nombre         AS equipo_visitante,
    ev.estadio_pais,
    ev.estadio_localidad,
    COUNT(e.id)         AS total_entradas_vendidas
FROM Evento ev
JOIN Equipo eq_l ON eq_l.id = ev.equipo_local_id
JOIN Equipo eq_v ON eq_v.id = ev.equipo_visitante_id
LEFT JOIN EventoSector es ON es.evento_id = ev.id
LEFT JOIN Entrada e ON (e.evento_id = es.evento_id AND e.sector_id = es.sector_id)
GROUP BY ev.id, ev.fecha, eq_l.nombre, eq_v.nombre,
         ev.estadio_pais, ev.estadio_localidad
ORDER BY total_entradas_vendidas DESC;

CREATE VIEW vw_cobertura_funcionarios AS
SELECT
    fse.funcionario_mail,
    fse.evento_id,
    fse.sector_id,
    s.nombre AS sector_nombre,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM Validacion val
            JOIN Entrada en2 ON en2.id = val.entrada_id
            WHERE val.funcionario_mail = fse.funcionario_mail
              AND en2.evento_id        = fse.evento_id
              AND en2.sector_id        = fse.sector_id
        ) THEN TRUE
        ELSE FALSE
    END AS sector_cubierto
FROM FuncionarioSectorEvento fse
JOIN Sector s ON s.id = fse.sector_id;
