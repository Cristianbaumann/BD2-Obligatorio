from fastapi import APIRouter, Depends
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
    cursor = None
    try:
        cursor = db.cursor(dictionary=True)
        
        query = """
        SELECT e.id, e.nombre, COUNT(v.id) as cantidad_vendidas
        FROM Evento e
        LEFT JOIN Venta v ON e.id = v.evento_id
        GROUP BY e.id, e.nombre
        ORDER BY cantidad_vendidas DESC
        LIMIT 10
        """
        
        cursor.execute(query)
        eventos = cursor.fetchall() 
        cursor.close()
        
        return {"top_eventos": eventos}

    except Exception as e:
        db.rollback() # Revierte en caso de error
        return {"error": str(e)}
        
    finally:
        if cursor:
            cursor.close()
            
@router.get("/funcionario/{id}/cobertura")
# Para un funcionario dado, cuántas ventas hizo y a cuántos clientes distintos vendió.
def cobertura_funcionario(id: int, user=Depends(require_admin), db=Depends(get_db)):
    cursor = None
    try:
        cursor = db.cursor(dictionary=True)
        
        query = """
        SELECT 
            f.id, f.nombre,
            COUNT(DISTINCT v.id) AS total_ventas,
            COUNT(DISTINCT c.id) AS total_clientes
        FROM Funcionario f
        LEFT JOIN Venta v ON f.id = v.funcionario_id
        LEFT JOIN Cliente c ON v.cliente_id = c.id
        WHERE f.id = %s
        GROUP BY f.id, f.nombre
        """
        
        cursor.execute(query, (id,))
        cobertura = cursor.fetchone() 
        cursor.close()
        
        if cobertura is None:
            return {"error": "Funcionario no encontrado"}
        
        return {"cobertura_funcionario": cobertura}

    except Exception as e:
        db.rollback() # Revierte en caso de error
        return {"error": str(e)}
        
    finally:
        if cursor:
            cursor.close()
            

@router.get("/disponibilidad_evento/{id}")
# Para cada sector habilitado del evento: capacidad_max - entradas_emitidas = disponibles.
def disponibilidad_evento(id: int, user=Depends(require_any_role), db=Depends(get_db)):
    cursor = None
    try:
        cursor = db.cursor(dictionary=True)
        
        query = """
        SELECT 
            s.id AS sector_id, s.nombre AS sector_nombre,
            s.capacidad_max,
            COUNT(e.id) AS entradas_emitidas,
            (s.capacidad_max - COUNT(e.id)) AS disponibles
        FROM Sector s
        LEFT JOIN Entrada e ON s.id = e.sector_id
        WHERE s.evento_id = %s
        GROUP BY s.id, s.nombre, s.capacidad_max
        """
        
        cursor.execute(query, (id,))
        disponibilidad = cursor.fetchall() 
        cursor.close()
        
        if not disponibilidad:
            return {"error": "Evento no encontrado o sin sectores habilitados"}
        
        return {"disponibilidad_evento": disponibilidad}

    except Exception as e:
        db.rollback() # Revierte en caso de error
        return {"error": str(e)}
        
    finally:
        if cursor:
            cursor.close()
            
@router.get("/mayores-compradores")
# Agrupa ventas por usuario, suma entradas. Devuelve top N compradores.
def mayores_compradores(user=Depends(require_admin), db=Depends(get_db)):
    cursor = None
    try:
        cursor = db.cursor(dictionary=True)
        
        query = """
        SELECT 
            u.id AS usuario_id, u.nombre AS usuario_nombre,
            COUNT(e.id) AS total_entradas
        FROM Usuario u
        LEFT JOIN Venta v ON u.id = v.usuario_id
        LEFT JOIN Entrada e ON v.id = e.venta_id
        GROUP BY u.id, u.nombre
        ORDER BY total_entradas DESC
        LIMIT 10
        """
        
        cursor.execute(query)
        compradores = cursor.fetchall() 
        cursor.close()
        
        return {"mayores_compradores": compradores}

    except Exception as e:
        db.rollback() # Revierte en caso de error
        return {"error": str(e)}
        
    finally:
        if cursor:
            cursor.close()