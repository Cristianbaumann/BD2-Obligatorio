from fastapi import APIRouter

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
