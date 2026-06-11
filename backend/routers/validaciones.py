from fastapi import APIRouter, Depends, HTTPException
from dependencies.auth import require_funcionario
from database import get_db
from datetime import datetime
from schemas.validacion import ValidacionCreate, ValidacionOut

router = APIRouter(prefix="/validaciones", tags=["validaciones"])


@router.post("/", response_model=ValidacionOut, status_code=201)
def validate_entrada(
    body: ValidacionCreate,                 
    user=Depends(require_funcionario),
    db=Depends(get_db)
):
    # 1. Verificar dispositivo
    db.execute(
        """
        SELECT id, funcionario_mail
        FROM Dispositivo
        WHERE id = %s AND funcionario_mail = %s AND activo = TRUE
        """,
        (body.dispositivo_id, user["mail"])
    )
    if db.fetchone() is None:
        raise HTTPException(status_code=403, detail="Dispositivo no autorizado para este funcionario")

    # 2. Verificar QR activo
    db.execute(
        """
        SELECT id, entrada_id
        FROM Qr
        WHERE codigo_hash = %s AND activo = TRUE
        """,
        (body.codigo_hash,)
    )
    qr = db.fetchone()
    if qr is None:
        raise HTTPException(status_code=404, detail="QR no encontrado o inactivo")

    entrada_id = qr["entrada_id"]

    # 3. Verificar entrada no consumida
    db.execute(
        """
        SELECT id, consumido, evento_id, sector_id
        FROM Entrada
        WHERE id = %s
        FOR UPDATE
        """,
        (entrada_id,)
    )
    entrada = db.fetchone()
    if entrada is None:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    if entrada["consumido"]:
        raise HTTPException(status_code=409, detail="Entrada ya fue consumida")

    # 4. Verificar cobertura del funcionario
    db.execute(
        """
        SELECT 1 FROM FuncionarioSectorEvento
        WHERE funcionario_mail = %s AND evento_id = %s AND sector_id = %s
        """,
        (user["mail"], entrada["evento_id"], entrada["sector_id"])
    )
    if db.fetchone() is None:
        raise HTTPException(status_code=403, detail="Funcionario no asignado a este sector")

    # Calcular timestamp una sola vez
    ahora = datetime.now()                   # ← una sola vez

    # Marcar entrada como consumida
    db.execute(
        "UPDATE Entrada SET consumido = TRUE WHERE id = %s",
        (entrada_id,)
    )

    # Insertar validación
    db.execute(
        """
        INSERT INTO Validacion (id, entrada_id, qr_id, dispositivo_id, funcionario_mail, timestamp_val)
        VALUES (UUID(), %s, %s, %s, %s, %s)
        """,
        (entrada_id, qr["id"], body.dispositivo_id, user["mail"], ahora)
    )

    db.commit()

    # Traer el registro insertado para retornarlo con response_model
    db.execute(
        """
        SELECT id, entrada_id, qr_id, dispositivo_id, funcionario_mail, timestamp_val
        FROM Validacion
        WHERE entrada_id = %s AND funcionario_mail = %s
        ORDER BY timestamp_val DESC
        LIMIT 1
        """,
        (entrada_id, user["mail"])
    )
    return db.fetchone()                     # ← coincide con ValidacionOut


@router.get("/", response_model=list[ValidacionOut])
def list_validaciones(db=Depends(get_db)):
    db.execute(
        """
        SELECT id, entrada_id, qr_id, dispositivo_id, funcionario_mail, timestamp_val
        FROM Validacion
        ORDER BY timestamp_val DESC
        """
    )
    return db.fetchall()