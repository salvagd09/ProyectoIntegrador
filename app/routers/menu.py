from fastapi import APIRouter
router=APIRouter(prefix="/menu",tags=["menu"])
@router.get("/")
def mostrar_platillos():
    return [{"id":1,"nombre":"Tiradito de Lenguado","descripcion":"Es un plato muy rico","precio":35.6,"producto_activo":True}]