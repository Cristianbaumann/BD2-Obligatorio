from fastapi import APIRouter

router = APIRouter(prefix="/reportes", tags=["reportes"])


@router.get("/ventas")
def reporte_ventas():
    # TODO: sales report
    pass


@router.get("/eventos")
def reporte_eventos():
    # TODO: events report
    pass
