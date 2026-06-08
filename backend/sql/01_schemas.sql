CREATE DATABASE IF NOT EXISTS ticketing_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ticketing_db;

-- =============================================================
-- MÓDULO 1: USUARIOS Y PERFILES
-- Generalización (t,e): Usuario → { Admin, Funcionario, UsuarioFinal }
-- =============================================================

-- -------------------------------------------------------------
-- 1.1 USUARIO  (PK = mail, según MER)
-- -------------------------------------------------------------
CREATE TABLE Usuario (
    mail                VARCHAR(255) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    rol                 ENUM('ADMIN','FUNCIONARIO','USUARIO_FINAL') NOT NULL,

    -- Atributo compuesto: Documento (Pais + Tipo + Numero — único globalmente)
    doc_pais            VARCHAR(100) NOT NULL,
    doc_tipo            VARCHAR(50)  NOT NULL,  -- CI, DNI, PASAPORTE, etc.
    doc_numero          VARCHAR(50)  NOT NULL,

    -- Atributo compuesto: Direccion (Pais + Localidad + Calle + Numero + CodPostal)
    dir_pais            VARCHAR(100) NOT NULL,
    dir_localidad       VARCHAR(150) NOT NULL,
    dir_calle           VARCHAR(200) NOT NULL,
    dir_numero          VARCHAR(20)  NOT NULL,
    dir_codigo_postal   VARCHAR(20),

    PRIMARY KEY (mail),
    UNIQUE KEY uq_documento (doc_pais, doc_tipo, doc_numero)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 1.2 USUARIO_TELEFONO  (atributo multivalorado Telefono*)
-- -------------------------------------------------------------
CREATE TABLE UsuarioTelefono (
    usuario_mail    VARCHAR(255) NOT NULL,
    telefono        VARCHAR(30)  NOT NULL,
    PRIMARY KEY (usuario_mail, telefono),
    CONSTRAINT fk_tel_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 1.3 ADMIN  (especialización — atributo: FechaAsignacionCargo)
-- -------------------------------------------------------------
CREATE TABLE Admin (
    usuario_mail             VARCHAR(255) NOT NULL,
    pais_sede                VARCHAR(100) NOT NULL,
    fecha_asignacion_cargo   DATE         NOT NULL,
    PRIMARY KEY (usuario_mail),
    CONSTRAINT fk_admin_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 1.4 FUNCIONARIO  (especialización — atributo: NumeroDeLegajo)
-- -------------------------------------------------------------
CREATE TABLE Funcionario (
    usuario_mail    VARCHAR(255) NOT NULL,
    numero_legajo   VARCHAR(50)  NOT NULL,
    PRIMARY KEY (usuario_mail),
    UNIQUE KEY uq_legajo (numero_legajo),
    CONSTRAINT fk_func_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 1.5 USUARIO_FINAL  (especialización — FechaRegistro, EstadoVerificacion)
-- -------------------------------------------------------------
CREATE TABLE UsuarioFinal (
    usuario_mail         VARCHAR(255) NOT NULL,
    fecha_registro       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_verificacion  ENUM('PENDIENTE','VERIFICADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    PRIMARY KEY (usuario_mail),
    CONSTRAINT fk_ufinal_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- MÓDULO 2: INFRAESTRUCTURA
-- =============================================================

-- -------------------------------------------------------------
-- 2.1 ESTADIO  (PK = dirección compuesta, según MER)
-- -------------------------------------------------------------
CREATE TABLE Estadio (
    dir_pais        VARCHAR(100) NOT NULL,
    dir_localidad   VARCHAR(150) NOT NULL,
    dir_calle       VARCHAR(200) NOT NULL,
    dir_numero      VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    aforo           INT          NOT NULL CHECK (aforo > 0),
    PRIMARY KEY (dir_pais, dir_localidad, dir_calle, dir_numero)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 2.2 SECTOR  (entidad débil de Estadio — relación "Tiene" 1:N)
--     Atributos: TipoSector (clave parcial), Capacidad, Costo
-- -------------------------------------------------------------
CREATE TABLE Sector (
    tipo_sector         VARCHAR(10)   NOT NULL,
    estadio_pais        VARCHAR(100)  NOT NULL,
    estadio_localidad   VARCHAR(150)  NOT NULL,
    estadio_calle       VARCHAR(200)  NOT NULL,
    estadio_numero      VARCHAR(20)   NOT NULL,
    capacidad           INT           NOT NULL CHECK (capacidad > 0),
    costo               DECIMAL(10,2) NOT NULL CHECK (costo >= 0),
    PRIMARY KEY (tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero),
    CONSTRAINT fk_sector_estadio FOREIGN KEY
        (estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
        REFERENCES Estadio(dir_pais, dir_localidad, dir_calle, dir_numero)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- MÓDULO 3: EQUIPOS Y EVENTOS
-- =============================================================

-- -------------------------------------------------------------
-- 3.1 EQUIPO  (atributos: Id, Nombre)
-- -------------------------------------------------------------
CREATE TABLE Equipo (
    id      CHAR(36)     NOT NULL DEFAULT (UUID()),
    nombre  VARCHAR(150) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_equipo_nombre (nombre)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 3.2 EVENTO  (clave parcial: fecha, según MER)
--     Relaciones Local y Visitante hacia Equipo
-- -------------------------------------------------------------
CREATE TABLE Evento (
    id                   CHAR(36)     NOT NULL DEFAULT (UUID()),
    fecha                DATETIME     NOT NULL,
    equipo_local_id      CHAR(36)     NOT NULL,
    equipo_visitante_id  CHAR(36)     NOT NULL,
    estadio_pais         VARCHAR(100) NOT NULL,
    estadio_localidad    VARCHAR(150) NOT NULL,
    estadio_calle        VARCHAR(200) NOT NULL,
    estadio_numero       VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_equipos_distintos CHECK (equipo_local_id <> equipo_visitante_id),
    CONSTRAINT fk_evento_local     FOREIGN KEY (equipo_local_id)
        REFERENCES Equipo(id),
    CONSTRAINT fk_evento_visitante FOREIGN KEY (equipo_visitante_id)
        REFERENCES Equipo(id),
    CONSTRAINT fk_evento_estadio   FOREIGN KEY
        (estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
        REFERENCES Estadio(dir_pais, dir_localidad, dir_calle, dir_numero),
    -- No superposición: un estadio no puede tener dos eventos a la misma hora
    UNIQUE KEY uq_estadio_fecha
        (estadio_pais, estadio_localidad, estadio_calle, estadio_numero, fecha)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 3.3 EVENTO_SECTOR  (relación "Esta habilitado" N:N — Evento ↔ Sector)
--     Agregación a la que Entrada es débil
-- -------------------------------------------------------------
CREATE TABLE EventoSector (
    evento_id           CHAR(36)     NOT NULL,
    tipo_sector         VARCHAR(10)  NOT NULL,
    estadio_pais        VARCHAR(100) NOT NULL,
    estadio_localidad   VARCHAR(150) NOT NULL,
    estadio_calle       VARCHAR(200) NOT NULL,
    estadio_numero      VARCHAR(20)  NOT NULL,
    PRIMARY KEY (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero),
    CONSTRAINT fk_es_evento FOREIGN KEY (evento_id)
        REFERENCES Evento(id) ON DELETE CASCADE,
    CONSTRAINT fk_es_sector FOREIGN KEY
        (tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
        REFERENCES Sector(tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
) ENGINE=InnoDB;

-- =============================================================
-- MÓDULO 4: VENTAS Y ENTRADAS
-- =============================================================

-- -------------------------------------------------------------
-- 4.1 ESTADO  (tabla de lookup — aparece en MER con ID y Descripcion)
-- -------------------------------------------------------------
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

-- -------------------------------------------------------------
-- 4.2 COMISION_HISTORICA  (tasa variable en el tiempo)
-- -------------------------------------------------------------
CREATE TABLE ComisionHistorica (
    id          INT          NOT NULL AUTO_INCREMENT,
    tasa        DECIMAL(5,4) NOT NULL,
    fecha_desde DATE         NOT NULL,
    fecha_hasta DATE,                   -- NULL = vigente actualmente
    PRIMARY KEY (id),
    UNIQUE KEY uq_tasa_vigente (fecha_hasta)
) ENGINE=InnoDB;

INSERT INTO ComisionHistorica (tasa, fecha_desde, fecha_hasta)
VALUES (0.0500, '2026-01-01', NULL);

-- -------------------------------------------------------------
-- 4.3 VENTA  (relación "asociado" UsuarioFinal → Venta)
--     PK: id UUID
--     FK a Usuario: usuario_mail (propagación del cambio de PK)
-- -------------------------------------------------------------
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

-- -------------------------------------------------------------
-- 4.4 ENTRADA  (entidad débil de la agregación EventoSector)
--     FK a Usuario: titular_mail (propagación del cambio de PK)
-- -------------------------------------------------------------
CREATE TABLE Entrada (
    id                   CHAR(36)      NOT NULL DEFAULT (UUID()),
    venta_id             CHAR(36)      NOT NULL,
    titular_mail         VARCHAR(255)  NOT NULL,
    costo                DECIMAL(10,2) NOT NULL,
    evento_id            CHAR(36)      NOT NULL,
    tipo_sector          VARCHAR(10)   NOT NULL,
    estadio_pais         VARCHAR(100)  NOT NULL,
    estadio_localidad    VARCHAR(150)  NOT NULL,
    estadio_calle        VARCHAR(200)  NOT NULL,
    estadio_numero       VARCHAR(20)   NOT NULL,
    consumido            BOOLEAN       NOT NULL DEFAULT FALSE,
    contador_transferencias TINYINT    NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT chk_max_transferencias CHECK (contador_transferencias <= 3),
    CONSTRAINT fk_entrada_venta   FOREIGN KEY (venta_id)
        REFERENCES Venta(id),
    CONSTRAINT fk_entrada_titular FOREIGN KEY (titular_mail)
        REFERENCES Usuario(mail),
    CONSTRAINT fk_entrada_es      FOREIGN KEY
        (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
        REFERENCES EventoSector(evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
) ENGINE=InnoDB;

-- =============================================================
-- MÓDULO 5: TRANSFERENCIAS
-- =============================================================

-- -------------------------------------------------------------
-- 5.1 TRANSFERENCIA  (relación "transfiere entrada" UsuarioFinal ↔ UsuarioFinal)
--     FKs a Usuario: origen_mail y destino_mail
-- -------------------------------------------------------------
CREATE TABLE Transferencia (
    id              CHAR(36)     NOT NULL DEFAULT (UUID()),
    entrada_id      CHAR(36)     NOT NULL,
    origen_mail     VARCHAR(255) NOT NULL,
    destino_mail    VARCHAR(255) NOT NULL,
    fecha           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado          ENUM('PENDIENTE','ACEPTADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    nro_en_cadena   TINYINT      NOT NULL,
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

-- -------------------------------------------------------------
-- 6.1 QR  (entidad débil de Entrada — relación "Genera" 1:N)
-- -------------------------------------------------------------
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

-- -------------------------------------------------------------
-- 6.2 DISPOSITIVO  (relación "Asociado" 1:N Funcionario → Dispositivo)
--     FK a Funcionario: funcionario_mail
-- -------------------------------------------------------------
CREATE TABLE Dispositivo (
    id               CHAR(36)     NOT NULL DEFAULT (UUID()),
    funcionario_mail VARCHAR(255) NOT NULL,
    descripcion      VARCHAR(200),
    activo           BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT fk_disp_funcionario FOREIGN KEY (funcionario_mail)
        REFERENCES Funcionario(usuario_mail)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 6.3 VALIDACION  (relación "Validación" Entrada ↔ Dispositivo)
--     Elevada a entidad para auditoría — registra QR, funcionario, timestamp
--     El atributo "Consumido" del MER vive en Entrada.consumido
-- -------------------------------------------------------------
CREATE TABLE Validacion (
    id               CHAR(36)     NOT NULL DEFAULT (UUID()),
    entrada_id       CHAR(36)     NOT NULL,
    qr_id            CHAR(36)     NOT NULL,
    dispositivo_id   CHAR(36)     NOT NULL,
    funcionario_mail VARCHAR(255) NOT NULL,
    timestamp_val    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- Una entrada no puede validarse dos veces (garantía a nivel DB)
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

-- -------------------------------------------------------------
-- 6.4 FUNCIONARIO_SECTOR_EVENTO  (relación "Asignado" N:N del MER)
--     Extendida con evento_id: la asignación es por evento
--     FK a Funcionario: funcionario_mail
-- -------------------------------------------------------------
CREATE TABLE FuncionarioSectorEvento (
    id                INT          NOT NULL AUTO_INCREMENT,
    funcionario_mail  VARCHAR(255) NOT NULL,
    evento_id         CHAR(36)     NOT NULL,
    tipo_sector       VARCHAR(10)  NOT NULL,
    estadio_pais      VARCHAR(100) NOT NULL,
    estadio_localidad VARCHAR(150) NOT NULL,
    estadio_calle     VARCHAR(200) NOT NULL,
    estadio_numero    VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    -- Clave natural como UNIQUE con prefijos para respetar límite InnoDB de 3072 bytes
    -- (composite natural PK = 3084 bytes en utf8mb4, excede el máximo)
    UNIQUE KEY uq_fse (funcionario_mail(50), evento_id, tipo_sector, estadio_pais(50), estadio_localidad(50), estadio_calle(50), estadio_numero),
    CONSTRAINT fk_fse_funcionario FOREIGN KEY (funcionario_mail)
        REFERENCES Funcionario(usuario_mail),
    CONSTRAINT fk_fse_es FOREIGN KEY
        (evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
        REFERENCES EventoSector(evento_id, tipo_sector, estadio_pais, estadio_localidad, estadio_calle, estadio_numero)
) ENGINE=InnoDB;

-- =============================================================
-- ÍNDICES DE PERFORMANCE
-- =============================================================

CREATE INDEX idx_entrada_titular   ON Entrada(titular_mail);
CREATE INDEX idx_entrada_venta     ON Entrada(venta_id);
CREATE INDEX idx_entrada_evento    ON Entrada(evento_id);
CREATE INDEX idx_venta_usuario     ON Venta(usuario_mail);
CREATE INDEX idx_venta_estado      ON Venta(estado_id);
CREATE INDEX idx_transf_entrada    ON Transferencia(entrada_id);
CREATE INDEX idx_transf_origen     ON Transferencia(origen_mail);
CREATE INDEX idx_transf_destino    ON Transferencia(destino_mail);
CREATE INDEX idx_evento_estadio    ON Evento(estadio_pais, estadio_localidad, estadio_calle, estadio_numero, fecha);

-- =============================================================
-- VISTAS
-- =============================================================

-- Disponibilidad en tiempo real por sector y evento
CREATE VIEW vw_disponibilidad AS
SELECT
    es.evento_id,
    es.tipo_sector,
    es.estadio_pais,
    es.estadio_localidad,
    es.estadio_calle,
    es.estadio_numero,
    s.capacidad                     AS capacidad_maxima,
    COUNT(e.id)                     AS entradas_emitidas,
    s.capacidad - COUNT(e.id)       AS disponibles
FROM EventoSector es
JOIN Sector s ON (
    s.tipo_sector       = es.tipo_sector       AND
    s.estadio_pais      = es.estadio_pais      AND
    s.estadio_localidad = es.estadio_localidad AND
    s.estadio_calle     = es.estadio_calle     AND
    s.estadio_numero    = es.estadio_numero
)
LEFT JOIN Entrada e ON (
    e.evento_id         = es.evento_id         AND
    e.tipo_sector       = es.tipo_sector       AND
    e.estadio_pais      = es.estadio_pais      AND
    e.estadio_localidad = es.estadio_localidad AND
    e.estadio_calle     = es.estadio_calle     AND
    e.estadio_numero    = es.estadio_numero
)
GROUP BY
    es.evento_id, es.tipo_sector,
    es.estadio_pais, es.estadio_localidad, es.estadio_calle, es.estadio_numero,
    s.capacidad;

-- Ranking de mayores compradores
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

-- Ranking de eventos por entradas vendidas
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
LEFT JOIN Entrada e ON (
    e.evento_id         = es.evento_id         AND
    e.tipo_sector       = es.tipo_sector       AND
    e.estadio_pais      = es.estadio_pais      AND
    e.estadio_localidad = es.estadio_localidad AND
    e.estadio_calle     = es.estadio_calle     AND
    e.estadio_numero    = es.estadio_numero
)
GROUP BY ev.id, ev.fecha, eq_l.nombre, eq_v.nombre,
         ev.estadio_pais, ev.estadio_localidad
ORDER BY total_entradas_vendidas DESC;

-- Cobertura de funcionarios por evento (auditoría)
CREATE VIEW vw_cobertura_funcionarios AS
SELECT
    fse.funcionario_mail,
    fse.evento_id,
    fse.tipo_sector,
    fse.estadio_pais,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM Validacion val
            JOIN Entrada en2 ON en2.id = val.entrada_id
            WHERE val.funcionario_mail    = fse.funcionario_mail
              AND en2.evento_id           = fse.evento_id
              AND en2.tipo_sector         = fse.tipo_sector
              AND en2.estadio_pais        = fse.estadio_pais
              AND en2.estadio_localidad   = fse.estadio_localidad
              AND en2.estadio_calle       = fse.estadio_calle
              AND en2.estadio_numero      = fse.estadio_numero
        ) THEN TRUE
        ELSE FALSE
    END AS sector_cubierto
FROM FuncionarioSectorEvento fse;