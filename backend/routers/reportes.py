from fastapi import APIRouter, Depends, HTTPException
from dependencies.auth import require_admin, require_any_role
from schemas.reporte import CoberturFuncionarioOut, DisponibilidadOut, EventoMasVendidoOut, MayorCompradorOut
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


@router.get("/mas-vendidos", response_model=list[EventoMasVendidoOut])
def eventos_mas_vendidos(user=Depends(require_admin), db=Depends(get_db)):
    db.execute("""
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
        LEFT JOIN Entrada e ON e.evento_id = ev.id AND e.sector_id = es.sector_id
        GROUP BY ev.id, ev.fecha, eq_l.nombre, eq_v.nombre, ev.estadio_pais, ev.estadio_localidad
        ORDER BY total_entradas_vendidas DESC
        LIMIT 10
    """)
    return db.fetchall()


@router.get("/funcionario/{usuario_mail}/cobertura", response_model=list[CoberturFuncionarioOut])
def cobertura_funcionario(usuario_mail: str, user=Depends(require_admin), db=Depends(get_db)):
    db.execute("SELECT usuario_mail FROM Funcionario WHERE usuario_mail = %s", (usuario_mail,))
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")

    db.execute("""
        SELECT
            fse.funcionario_mail,
            fse.evento_id,
            fse.sector_id,
            s.nombre AS sector_nombre,
            EXISTS (
                SELECT 1 FROM Validacion val
                JOIN Entrada en2 ON en2.id = val.entrada_id
                WHERE en2.evento_id = fse.evento_id
                  AND en2.sector_id = fse.sector_id
                  AND val.funcionario_mail = fse.funcionario_mail
            ) AS sector_cubierto
        FROM FuncionarioSectorEvento fse
        JOIN Sector s ON s.id = fse.sector_id
        WHERE fse.funcionario_mail = %s
    """, (usuario_mail,))
    return db.fetchall()


@router.get("/disponibilidad_evento/{id}", response_model=list[DisponibilidadOut])
def disponibilidad_evento(id: str, user=Depends(require_any_role), db=Depends(get_db)):
    db.execute("""
        SELECT
            es.evento_id,
            es.sector_id,
            s.nombre                  AS sector_nombre,
            s.estadio_pais,
            s.estadio_localidad,
            s.capacidad               AS capacidad_maxima,
            COUNT(e.id)               AS entradas_emitidas,
            s.capacidad - COUNT(e.id) AS disponibles
        FROM EventoSector es
        JOIN Sector s ON s.id = es.sector_id
        LEFT JOIN Entrada e ON e.evento_id = es.evento_id AND e.sector_id = es.sector_id
        WHERE es.evento_id = %s
        GROUP BY es.evento_id, es.sector_id, s.nombre, s.estadio_pais, s.estadio_localidad, s.capacidad
    """, (id,))
    rows = db.fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="Evento no encontrado o sin sectores habilitados")
    return rows


@router.get("/mayores-compradores", response_model=list[MayorCompradorOut])
def mayores_compradores(user=Depends(require_admin), db=Depends(get_db)):
    db.execute("""
        SELECT
            u.mail,
            COUNT(e.id)    AS total_entradas_compradas,
            SUM(v.precio)  AS total_gastado
        FROM Usuario u
        JOIN Venta v   ON v.usuario_mail = u.mail
        JOIN Entrada e ON e.venta_id     = v.id
        GROUP BY u.mail
        ORDER BY total_entradas_compradas DESC
        LIMIT 10
    """)
    return db.fetchall()
