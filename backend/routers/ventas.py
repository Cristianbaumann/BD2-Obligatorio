from fastapi import APIRouter

router = APIRouter(prefix="/ventas", tags=["ventas"])


@router.get("/")
def list_ventas():
    # TODO: list all ventas
    pass


@router.post("/")
def create_venta():
    # TODO: create venta
    pass


@router.get("/{id}")
def get_venta(id: int):
    # TODO: get venta by id
    pass
