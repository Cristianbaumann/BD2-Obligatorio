from fastapi import APIRouter, Depends, HTTPException
from core.security import require_admin, require_funcionario, require_any_role
from database import get_db

router = APIRouter(prefix="/reportes", tags=["reportes"])


@router.get("/ventas")
def reporte_ventas():
    # TODO: sales report
    pass


@router.get("/eventos")
def reporte_eventos():
    # TODO: events report
    pass

@router.get("/mas-vendidos")
def eventos_mas_vendidos(user=Depends(require_admin), db=Depends(get_db)):
    query = """
    SELECT 
        e.id AS evento_id,
        e.fecha AS fecha,
        el.nombre AS equipo_local,
        ev.nombre AS equipo_visitante,
        e.estadio_pais,
        e.estadio_localidad,
        COUNT(en.id) AS total_entradas_vendidas
    FROM Evento e
    LEFT JOIN Entrada en ON e.id = en.evento_id
    LEFT JOIN Equipo el ON e.equipo_local_id = el.id
    LEFT JOIN Equipo ev ON e.equipo_visitante_id = ev.id
    GROUP BY e.id, e.fecha, el.nombre, ev.nombre, e.estadio_pais, e.estadio_localidad
    ORDER BY total_entradas_vendidas DESC
    LIMIT 10
    """

    db.execute(query)
    eventos = db.fetchall()
    
    if not eventos:
        raise HTTPException(status_code=404, detail="No se encontraron eventos")
    
    return {"top_eventos": eventos}



@router.get("/funcionario/{usuario_mail}/cobertura")
# Para un funcionario dado, cuántas ventas hizo y a cuántos clientes distintos vendió.
def cobertura_funcionario(usuario_mail: str, user=Depends(require_admin), db=Depends(get_db)):
        query = """
        SELECT 
            f.usuario_mail AS funcionario_mail,
            f.numero_legajo,
            COUNT(v.id) AS total_ventas,
            COUNT(DISTINCT e.titular_mail) AS total_clientes
        FROM Funcionario f
        LEFT JOIN Venta v ON f.usuario_mail = v.usuario_mail
        LEFT JOIN Entrada e ON v.id = e.venta_id
        WHERE f.usuario_mail = %s
        GROUP BY f.usuario_mail, f.numero_legajo
        """

        db.execute(query, (usuario_mail,))
        cobertura = db.fetchone()

        if cobertura is None:
            raise HTTPException(status_code=404, detail="Funcionario no encontrado")

        return {"cobertura_funcionario": cobertura}
    

@router.get("/disponibilidad_evento/{id}")
# Para cada sector habilitado del evento: capacidad - entradas_emitidas = disponibles.
def disponibilidad_evento(id: int, user=Depends(require_any_role), db=Depends(get_db)):
    query = """
    SELECT 
        s.id AS sector_id, s.nombre AS sector_nombre,
        s.capacidad,
        COUNT(e.id) AS entradas_emitidas,
        (s.capacidad - COUNT(e.id)) AS disponibles
    FROM Sector s
    LEFT JOIN Entrada e ON s.id = e.sector_id
    WHERE s.evento_id = %s
    GROUP BY s.id, s.nombre, s.capacidad
    """

    db.execute(query, (id,))
    disponibilidad = db.fetchall()

    if not disponibilidad:
        raise HTTPException(status_code=404, detail="Evento no encontrado o sin sectores habilitados")

    return {"disponibilidad_evento": disponibilidad}



@router.get("/mayores-compradores")
# Agrupa ventas por usuario, suma entradas. Devuelve top N compradores.
def mayores_compradores(user=Depends(require_admin), db=Depends(get_db)):
    query = """
    SELECT 
        u.mail AS usuario_mail,
        COUNT(e.id) AS total_entradas
    FROM Usuario u
    LEFT JOIN Venta v ON u.mail = v.usuario_mail
    LEFT JOIN Entrada e ON v.id = e.venta_id
    GROUP BY u.mail
    ORDER BY total_entradas DESC
    LIMIT 10
    """

    db.execute(query)
    compradores = db.fetchall()
    
    if not compradores:
        raise HTTPException(status_code=404, detail="No se encontraron compradores")
    
    return {"mayores_compradores": compradores}


