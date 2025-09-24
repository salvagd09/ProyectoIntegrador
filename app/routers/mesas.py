from fastapi import APIRouter
router=APIRouter(prefix="/mesas",tags=["mesas"])
@router.get("/")
def Mostrar_mesa():
    return "La mesa va a ser mostrada"