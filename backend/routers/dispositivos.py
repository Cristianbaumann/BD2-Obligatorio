from fastapi import APIRouter

router = APIRouter(prefix="/dispositivos", tags=["dispositivos"])


@router.get("/")
def list_dispositivos():
    # TODO: list all dispositivos
    pass


@router.post("/")
def create_dispositivo():
    # TODO: register dispositivo
    pass


@router.delete("/{id}")
def delete_dispositivo(id: int):
    # TODO: delete dispositivo
    pass
