-- schema goes here
CREATE TABLE Usuario (
    mail                VARCHAR(255)    NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    rol                 ENUM('ADMIN','FUNCIONARIO','USUARIO_FINAL') NOT NULL,
 
    -- Documento (compuesto: país + tipo + número — único)
    doc_pais            VARCHAR(100)    NOT NULL,
    doc_tipo            VARCHAR(50)     NOT NULL,   -- DNI, PASAPORTE, CI, etc.
    doc_numero          VARCHAR(50)     NOT NULL,
 
    -- Dirección (compuesta)
    dir_pais            VARCHAR(100)    NOT NULL,
    dir_localidad       VARCHAR(150)    NOT NULL,
    dir_calle           VARCHAR(200)    NOT NULL,
    dir_numero          VARCHAR(20)     NOT NULL,
    dir_codigo_postal   VARCHAR(20),
 
    PRIMARY KEY (mail),
    UNIQUE KEY uq_documento     (doc_pais, doc_tipo, doc_numero)
) ENGINE=InnoDB;
 
-- Teléfonos de contacto (multivalorado)
CREATE TABLE UsuarioTelefono (
    usuario_mail  VARCHAR(255)    NOT NULL,
    telefono    VARCHAR(30)     NOT NULL,
    PRIMARY KEY (usuario_mail, telefono),
    CONSTRAINT fk_tel_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;

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
    usuario_mail         VARCHAR(255) NOT NULL,
    fecha_registro       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_verificacion  ENUM('PENDIENTE','VERIFICADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    PRIMARY KEY (usuario_mail),
    CONSTRAINT fk_ufinal_usuario FOREIGN KEY (usuario_mail)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;