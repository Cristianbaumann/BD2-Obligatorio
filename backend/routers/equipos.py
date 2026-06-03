from fastapi import APIRouter

router = APIRouter(prefix="/equipos", tags=["equipos"])


@router.get("/")
def list_equipos():
    # TODO: list all equipos
    pass


@router.post("/")
def create_equipo():
    # TODO: create equipo
    pass


@router.get("/{id}")
def get_equipo(id: int):
    # TODO: get equipo by id
    pass


@router.put("/{id}")
def update_equipo(id: int):
    # TODO: update equipo
    pass


@router.delete("/{id}")
def delete_equipo(id: int):
    # TODO: delete equipo
    pass
