from fastapi import APIRouter, Depends, HTTPException
from core.security import require_funcionario
from database import get_db
from datetime import datetime

router = APIRouter(prefix="/validaciones", tags=["validaciones"])


@router.post("/")
def validate_entrada(codigo_hash: str, dispositivo_id: str, user=Depends(require_funcionario), db=Depends(get_db)):
    """
    Validaciones:
    1. Dispositivo autorizado y pertenece al funcionario
    2. Hash es QR activo
    3. Funcionario cubre el sector del evento
    4. Entrada no consumida

    Si OK: marca entrada CONSUMIDA e inserta registro de validación
    """

    # Verificar dispositivo y si le pertenece al funcionario
    query_dispositivo = """
    SELECT d.id, d.funcionario_mail
    FROM Dispositivo d
    WHERE d.id = %s AND d.funcionario_mail = %s AND d.activo = TRUE
    """
    db.execute(query_dispositivo, (dispositivo_id, user["mail"]))
    dispositivo = db.fetchone()

    if dispositivo is None:
        raise HTTPException(status_code=403, detail="Dispositivo no autorizado para este funcionario")

    # Verificar QR y si está activo
    query_qr = """
    SELECT q.id, q.entrada_id
    FROM Qr q
    WHERE q.codigo_hash = %s AND q.activo = TRUE
    """
    db.execute(query_qr, (codigo_hash,))
    qr = db.fetchone()

    if qr is None:
        raise HTTPException(status_code=404, detail="QR no encontrado o inactivo")

    entrada_id = qr["entrada_id"]

    # Verificar que la entrada no esté consumida
    query_entrada = """
    SELECT e.id, e.consumido, e.evento_id, e.sector_id
    FROM Entrada e
    WHERE e.id = %s
    """
    db.execute(query_entrada, (entrada_id,))
    entrada = db.fetchone()

    if entrada is None:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")

    if entrada["consumido"]:
        raise HTTPException(status_code=409, detail="Entrada ya fue consumida")

    # (4) Verificar que el funcionario esta asignado al sector del evento
    query_cobertura = """
    SELECT 1 FROM FuncionarioSectorEvento
    WHERE funcionario_mail = %s AND evento_id = %s AND sector_id = %s
    """
    db.execute(query_cobertura, (user["mail"], entrada["evento_id"], entrada["sector_id"]))
    if db.fetchone() is None:
        raise HTTPException(status_code=403, detail="Funcionario no asignado a este sector")

    # Marcar entrada como consumida
    query_update = """
    UPDATE Entrada
    SET consumido = TRUE
    WHERE id = %s
    """
    db.execute(query_update, (entrada_id,))

    # Registrar validación
    query_insert = """
    INSERT INTO Validacion (id, entrada_id, qr_id, dispositivo_id, funcionario_mail, timestamp_val)
    VALUES (UUID(), %s, %s, %s, %s, %s)
    """
    db.execute(query_insert, (entrada_id, qr["id"], dispositivo_id, user["mail"], datetime.now()))

    db.commit()

    return {
        "validacion": {
            "entrada_id": entrada_id,
            "evento_id": entrada["evento_id"],
            "sector_id": entrada["sector_id"],
            "timestamp": datetime.now().isoformat()
        }
    }

@router.get("/")
def list_validaciones():
    # TODO: list all validaciones
    pass

