from fastapi import APIRouter
router=APIRouter(prefix="/menu",tags=["menu"])
@router.get("/")
def mostrar_platillos():
   return "A"