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
    usuario_id  VARCHAR(255)    NOT NULL,
    telefono    VARCHAR(30)     NOT NULL,
    PRIMARY KEY (usuario_id, telefono),
    CONSTRAINT fk_tel_usuario FOREIGN KEY (usuario_id)
        REFERENCES Usuario(mail) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Admin(
    
) ENGINE=InnoDB;