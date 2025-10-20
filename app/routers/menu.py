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
@router.get("/", response_model=List[schemas.ProductoConIngredientes])
def listar_productos_con_ingredientes(db: Session = Depends(get_db)):
    productos=db.query(models.Platillo).all()
    mostrar_menu=[]
    for producto in productos:
        ingredientes = db.query(models.Ingredientes.nombre)\
        .join(models.Recetas, models.Recetas.ingredientes_id == models.Ingredientes.id)\
        .filter(models.Recetas.producto_id == producto.id)\
        .all()
        mostrar_menu.append({
            "id": producto.id,
            "nombre": producto.nombre,
            "descripcion": producto.descripcion,
            "precio": producto.precio,
            "categoria": producto.categoria.nombre,  # Asumiendo relación
            "producto_activo":producto.producto_activo,
            "ingredientes": [{"nombre": ing[0]} for ing in ingredientes]
        })
    return mostrar_menu
@router.put("/deshabilitar/{id}",response_model=None)
def HabilitarPlatillo(id:int,db:Session=Depends(get_db)):
    platillo=db.query(models.Platillo).filter(models.Platillo.id==id).first()
    platillo.producto_activo = not platillo.producto_activo
    db.commit()
    db.refresh(platillo)
    if platillo.producto_activo:
        return{"mensaje":"Estado activado correctamente"}
    else:
        return{"mensaje":"Estado desactivado correctamente"}