from fastapi import APIRouter

router = APIRouter(prefix="/qr", tags=["qr"])


@router.get("/{entrada_id}")
def generate_qr(entrada_id: int):
    # TODO: generate QR code for entrada
    pass
