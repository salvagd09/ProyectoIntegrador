from fastapi import APIRouter,Depends
from .. import models, database,schemas
from typing import List
from sqlalchemy.orm import Session
router=APIRouter(prefix="/menu",tags=["menu"])
#Acciones del router=
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/productos", response_model=List[schemas.ProductoConIngredientes])
def listar_productos_con_ingredientes(db: Session = Depends(get_db)):
    return db.query(models.Productos).all()