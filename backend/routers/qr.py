from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from urllib.parse import quote as encodeURIComponent
from dependencies.auth import require_any_role


router = APIRouter(prefix="/qr", tags=["qr"])


@router.get("/{entrada_id}", status_code=201)
def get_qr(entrada_id: str, user=Depends(require_any_role), db=Depends(get_db)):

    # Revisa si existe la entrada y si el usuario es el titular
    db.execute("SELECT titular_mail FROM Entrada WHERE id = %s", (entrada_id,))
    entrada = db.fetchone()
    
    if entrada is None:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    if entrada["titular_mail"] != user["mail"]:
        raise HTTPException(status_code=403, detail="No eres el titular de esta entrada")

    # Obtiene el QR activo
    db.execute("SELECT codigo_hash FROM Qr WHERE entrada_id = %s AND activo = TRUE", (entrada_id,))
    qr = db.fetchone()
    if qr is None:
        raise HTTPException(status_code=404, detail="QR no encontrado o inactivo")
    resultado = db.fetchone()

    if resultado is None:
        raise HTTPException(status_code=404, detail="Entrada no encontrada o QR inactivo")

    codigo_hash = resultado["codigo_hash"]
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={encodeURIComponent(codigo_hash)}"

    return {"qr_url": qr_url}
