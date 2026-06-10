from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mysql.connector import IntegrityError, DatabaseError

from routers import (
    auth, usuarios, estadios, equipos, eventos,
    ventas, entradas, transferencias, qr,
    validaciones, dispositivos, reportes,
)

app = FastAPI(title="Ticketing API")


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(status_code=409, content={"detail": exc.msg})


@app.exception_handler(DatabaseError)
async def database_error_handler(request: Request, exc: DatabaseError):
    return JSONResponse(status_code=500, content={"detail": "Error de base de datos"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(estadios.router)
app.include_router(equipos.router)
app.include_router(eventos.router)
app.include_router(ventas.router)
app.include_router(entradas.router)
app.include_router(transferencias.router)
app.include_router(qr.router)
app.include_router(validaciones.router)
app.include_router(dispositivos.router)
app.include_router(reportes.router)
