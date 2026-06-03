from fastapi import APIRouter

router = APIRouter(prefix="/eventos", tags=["eventos"])


@router.get("/")
def list_eventos():
    # TODO: list all eventos
    pass


@router.post("/")
def create_evento():
    # TODO: create evento
    pass


@router.get("/{id}")
def get_evento(id: int):
    # TODO: get evento by id
    pass


@router.put("/{id}")
def update_evento(id: int):
    # TODO: update evento
    pass


@router.delete("/{id}")
def delete_evento(id: int):
    # TODO: delete evento
    pass
