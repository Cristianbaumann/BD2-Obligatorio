from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from urllib.parse import quote as encodeURIComponent
from dependencies.auth import require_any_role
import secrets

router = APIRouter(prefix="/qr", tags=["qr"])


@router.get("/{entrada_id}", status_code=200)
def get_qr(entrada_id: str, user=Depends(require_any_role), db=Depends(get_db)):

    # Verifica que existe la entrada y el usuario es titular
    db.execute("SELECT titular_mail, consumido FROM Entrada WHERE id = %s", (entrada_id,))
    entrada = db.fetchone()

    if entrada is None:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    if entrada["titular_mail"] != user["mail"]:
        raise HTTPException(status_code=403, detail="No eres el titular de esta entrada")
    if entrada["consumido"]:
        raise HTTPException(status_code=409, detail="La entrada ya fue consumida")

    # Busca si ya tiene un QR activo
    db.execute(
        """
        SELECT codigo_hash FROM Qr
        WHERE entrada_id = %s
        AND activo = TRUE
        AND creado_en > DATE_SUB(NOW(), INTERVAL 30 SECOND)""",
        (entrada_id,))
    qr = db.fetchone()

    # Si no tiene QR activo, crea uno
    if qr is None:
        # Desactivar QRs anteriores por si quedó alguno
        db.execute("UPDATE Qr SET activo = FALSE WHERE entrada_id = %s", (entrada_id,))
        
        codigo_hash = secrets.token_hex(32)
        db.execute(
            "INSERT INTO Qr (id, entrada_id, codigo_hash, activo) VALUES (UUID(), %s, %s, TRUE)",
            (entrada_id, codigo_hash)
        )
    else:
        codigo_hash = qr["codigo_hash"]

    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={encodeURIComponent(codigo_hash)}"

    return {"qr_url": qr_url}

