from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import join, select
from .. import models, database,schemas
router=APIRouter(prefix="/pedidosF",tags=["pedidosF"])
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/platillos", response_model=None)
def listar_productos(db: Session = Depends(get_db)):
    productos=db.query(models.Platillo).all()
    mostrar_menu=[]
    for producto in productos:
        mostrar_menu.append({
            "id": producto.id,
            "nombre": producto.nombre,
        })
    return mostrar_menu