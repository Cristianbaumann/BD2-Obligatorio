from fastapi import APIRouter

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("/")
def list_usuarios():
    # TODO: list all users
    pass


@router.get("/{id}")
def get_usuario(id: int):
    # TODO: get user by id
    pass


@router.put("/{id}")
def update_usuario(id: int):
    # TODO: update user
    pass


@router.delete("/{id}")
def delete_usuario(id: int):
    # TODO: delete user
    pass
