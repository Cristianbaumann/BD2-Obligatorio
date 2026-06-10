from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from core.security import require_any_role


router = APIRouter(prefix="/entradas", tags=["entradas"])


@router.get("/")
def list_entradas():
    # TODO: list all entradas
    pass


@router.post("/")
def create_entrada():
    # TODO: create entrada
    pass


@router.get("/{id}")
def get_entrada(id: int):
    # TODO: get entrada by id
    pass

@router.get("/{id}/qr")
def obtener_qr_entrada_activo(id: int, user=Depends(require_any_role), db=Depends(get_db)):
    query = """
    SELECT q.*
    FROM Qr q
    INNER JOIN Entrada e ON e.id = q.entrada_id
    WHERE e.id = %s
    """

    db.execute(query, (id,))
    qr = db.fetchone()

    if qr is None:
        raise HTTPException(status_code=404, detail="QR o Entrada no encontrada")

    return {"qr_activo": qr}


@router.get("/{id}/historial")
def cadena_custodia_entrada_id(id: int, user=Depends(require_any_role), db=Depends(get_db)):
    query = """
    SELECT 
        t.origen_mail AS origen_mail,
        t.destino_mail AS destino_mail,
        t.fecha AS fecha_transferencia
    FROM Transferencia t
    WHERE t.entrada_id = %s AND t.estado = 'ACEPTADA'
    ORDER BY t.fecha DESC
    """

    db.execute(query, (id,))
    historial_qr = db.fetchall()

    if not historial_qr:
        raise HTTPException(status_code=404, detail="No se encontraron QR para esta Entrada")

    return {"historial_qr": historial_qr}
