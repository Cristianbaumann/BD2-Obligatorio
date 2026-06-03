from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login():
    # TODO: authenticate user, return JWT
    pass


@router.post("/register")
def register():
    # TODO: register new user
    pass
