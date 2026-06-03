from fastapi import APIRouter

router = APIRouter(prefix="/estadios", tags=["estadios"])


@router.get("/")
def list_estadios():
    # TODO: list all estadios
    pass


@router.post("/")
def create_estadio():
    # TODO: create estadio
    pass


@router.get("/{id}")
def get_estadio(id: int):
    # TODO: get estadio by id
    pass


@router.put("/{id}")
def update_estadio(id: int):
    # TODO: update estadio
    pass


@router.delete("/{id}")
def delete_estadio(id: int):
    # TODO: delete estadio
    pass
