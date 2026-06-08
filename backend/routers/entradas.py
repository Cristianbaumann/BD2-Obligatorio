from fastapi import APIRouter, HTTPException

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
def obtener_qr_entrada_activo(id: int):
    cursor = None
    try:
        cursor = db.cursor(dictionary=True)
        
        query = """
        SELECT *
        FROM Entrada e
        INNER JOIN Qr q ON e.id = q.entrada_id
        WHERE e.id = %s
        """
        
        cursor.execute(query, (id,))
        qr = cursor.fetchone() 
        
        if qr is None:
            raise HTTPException(status_code=404, detail="QR o Entrada no encontrada")
        
        return {"qr_activo": qr}
        
    finally:
        if cursor:
            cursor.close()
            
@router.get("/{id}/historial")
def cadena_custodia_entrada_id(id: int):
    cursor = None
    try:
        cursor = db.cursor(dictionary=True)
        
        query = """
        SELECT 
            t.origen_mail AS entrada_id,
            t.destino_mail AS destino_id,
            t.fecha AS fecha_transferencia,
        FROM Transferencia t
        INNER JOIN Entradas e ON e.id = t.entrada_id
        WHERE e.id = %s AND t.estado = 'ACEPTADA'
        ORDER BY t.fecha DESC
        """
        
        cursor.execute(query, (id,))
        historial_qr = cursor.fetchall() 
        
        if not historial_qr:
            raise HTTPException(status_code=404, detail="No se encontraron QR para esta Entrada")
        
        return {"historial_qr": historial_qr}
        
    finally:
        if cursor:
            cursor.close()