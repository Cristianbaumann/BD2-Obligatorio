from fastapi import Request


async def auth_middleware(request: Request, call_next):
    # TODO: validate JWT from Authorization header
    response = await call_next(request)
    return response
