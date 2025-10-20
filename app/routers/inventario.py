from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from .. import models, database,schemas
router=APIRouter(prefix="/inventario",tags=["/inventario"])
#Acciones del router=
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/")
def Mostrar_inventario(db:Session=Depends(get_db)):
    ingredientes=db.query(models.Ingredientes).order_by(models.Ingredientes.id.asc()).all()
    mostrar_ingredientes=[]
    for ingrediente in ingredientes:
        mostrar_ingredientes.append({
            "id": ingrediente.id,
            "nombre":ingrediente.nombre,
            "cantidad":ingrediente.cantidad_actual,
            "minimo":ingrediente.stock_minimo,
            "categoria":ingrediente.descripcion,
            "precio":ingrediente.precio,
            "unidad_medida":ingrediente.unidad_de_medida,
            "perecible":ingrediente.es_perecible
        })
    return mostrar_ingredientes