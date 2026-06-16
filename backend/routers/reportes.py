from fastapi import APIRouter, Depends, HTTPException
from dependencies.auth import require_admin, require_any_role
from schemas.reporte import CoberturFuncionarioOut, DisponibilidadOut, EventoMasVendidoOut, MayorCompradorOut
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

@router.get("/mas-vendidos", response_model=list[EventoMasVendidoOut])
def eventos_mas_vendidos(user=Depends(require_admin), db=Depends(get_db)):
    db.execute("SELECT * FROM vw_eventos_mas_vendidos LIMIT 10")
    eventos = db.fetchall()

    if not eventos:
        raise HTTPException(status_code=404, detail="No se encontraron eventos")

    return eventos


@router.get("/funcionario/{usuario_mail}/cobertura", response_model=list[CoberturFuncionarioOut])
def cobertura_funcionario(usuario_mail: str, user=Depends(require_admin), db=Depends(get_db)):
    # Verificar que el funcionario existe
    db.execute(
        "SELECT usuario_mail FROM Funcionario WHERE usuario_mail = %s",
        (usuario_mail,)
    )
    if not db.fetchone():
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")

    db.execute(
        "SELECT * FROM vw_cobertura_funcionarios WHERE funcionario_mail = %s",
        (usuario_mail,)
    )
    return db.fetchall()
    

@router.get("/disponibilidad_evento/{id}", response_model=list[DisponibilidadOut])
def disponibilidad_evento(id: str, user=Depends(require_any_role), db=Depends(get_db)):
    db.execute(
        "SELECT * FROM vw_disponibilidad WHERE evento_id = %s",
        (id,)
    )
    disponibilidad = db.fetchall()

    if not disponibilidad:
        raise HTTPException(status_code=404, detail="Evento no encontrado o sin sectores habilitados")

    return disponibilidad


@router.get("/mayores-compradores", response_model=list[MayorCompradorOut])
def mayores_compradores(user=Depends(require_admin), db=Depends(get_db)):
    db.execute("SELECT * FROM vw_mayores_compradores LIMIT 10")
    compradores = db.fetchall()

    if not compradores:
        raise HTTPException(status_code=404, detail="No se encontraron compradores")

    return compradores