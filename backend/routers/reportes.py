from fastapi import APIRouter, Depends
from database import get_db

router = APIRouter(prefix="/reportes", tags=["reportes"])


@router.get("/ventas")
def reporte_ventas(db=Depends(get_db)):
    db.execute("""
        SELECT
            COUNT(*)                        AS total_vendidas,
            COALESCE(SUM(costo), 0)         AS total_recaudado,
            COALESCE(SUM(costo) * 0.10, 0)  AS comision_total,
            (SELECT COUNT(*) FROM Evento)   AS eventos_activos
        FROM Entrada
    """)
    totals = db.fetchone()

    db.execute("""
        SELECT CONCAT(el.nombre, ' vs ', ev2.nombre) AS evento,
               COUNT(e.id)                            AS vendidas
        FROM Entrada e
        JOIN Evento  ev  ON ev.id  = e.evento_id
        JOIN Equipo  el  ON el.id  = ev.equipo_local_id
        JOIN Equipo  ev2 ON ev2.id = ev.equipo_visitante_id
        GROUP BY e.evento_id, el.nombre, ev2.nombre
        ORDER BY vendidas DESC
        LIMIT 10
    """)
    por_evento = db.fetchall()

    return {
        "total_vendidas":   int(totals["total_vendidas"]),
        "total_recaudado":  float(totals["total_recaudado"]),
        "comision_total":   float(totals["comision_total"]),
        "eventos_activos":  int(totals["eventos_activos"]),
        "por_evento": [
            {"evento": r["evento"], "vendidas": int(r["vendidas"])}
            for r in por_evento
        ],
    }


@router.get("/ocupacion")
def reporte_ocupacion(db=Depends(get_db)):
    db.execute("""
        SELECT s.nombre    AS sector,
               COUNT(e.id) AS ocupadas,
               s.capacidad AS total
        FROM Sector s
        LEFT JOIN Entrada e ON e.sector_id = s.id
        GROUP BY s.id, s.nombre, s.capacidad
        ORDER BY ocupadas DESC
        LIMIT 20
    """)
    rows = db.fetchall()
    return [
        {"sector": r["sector"], "ocupadas": int(r["ocupadas"]), "total": int(r["total"])}
        for r in rows
    ]


@router.get("/eventos")
def reporte_eventos(db=Depends(get_db)):
    db.execute("""
        SELECT CONCAT(el.nombre, ' vs ', ev2.nombre) AS partido,
               ev.fecha,
               COUNT(e.id)                            AS vendidas,
               (SELECT SUM(s.capacidad)
                FROM EventoSector es2
                JOIN Sector s ON s.id = es2.sector_id
                WHERE es2.evento_id = ev.id)           AS capacidad
        FROM Evento ev
        JOIN Equipo  el  ON el.id  = ev.equipo_local_id
        JOIN Equipo  ev2 ON ev2.id = ev.equipo_visitante_id
        LEFT JOIN Entrada e ON e.evento_id = ev.id
        GROUP BY ev.id, el.nombre, ev2.nombre, ev.fecha
        ORDER BY ev.fecha
    """)
    rows = db.fetchall()
    return [
        {
            "partido":   r["partido"],
            "fecha":     r["fecha"].isoformat() if r["fecha"] else None,
            "vendidas":  int(r["vendidas"]),
            "capacidad": int(r["capacidad"]) if r["capacidad"] else 0,
        }
        for r in rows
    ]
