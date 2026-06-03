from fastapi import APIRouter

router = APIRouter(prefix="/validaciones", tags=["validaciones"])


@router.post("/")
def validate_entrada():
    # TODO: validate entrada via QR scan
    pass


@router.get("/")
def list_validaciones():
    # TODO: list all validaciones
    pass
