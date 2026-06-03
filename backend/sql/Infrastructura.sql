CREATE TABLE Estadio (
    dir_pais        VARCHAR(100) NOT NULL,
    dir_localidad   VARCHAR(150) NOT NULL,
    dir_calle       VARCHAR(200) NOT NULL,
    dir_numero      VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    aforo           INT          NOT NULL CHECK (aforo > 0),
    PRIMARY KEY (dir_pais, dir_localidad, dir_calle, dir_numero)
) ENGINE=InnoDB;

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