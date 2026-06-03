from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth, usuarios, estadios, equipos, eventos,
    ventas, entradas, transferencias, qr,
    validaciones, dispositivos, reportes,
)

app = FastAPI(title="Ticketing API")

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
