from fastapi import APIRouter

router = APIRouter(prefix="/transferencias", tags=["transferencias"])


@router.get("/")
def list_transferencias():
    # TODO: list all transferencias
    pass


@router.post("/")
def create_transferencia():
    # TODO: create transferencia
    pass


@router.get("/{id}")
def get_transferencia(id: int):
    # TODO: get transferencia by id
    pass
