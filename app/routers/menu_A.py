from fastapi import APIRouter,Depends, HTTPException
from .. import models, database,schemas
from typing import List
from app.database import get_db
from sqlalchemy.orm import Session
router=APIRouter(prefix="/menu_A",tags=["menu_A"])
#Acciones del router=

@router.get("/", response_model=List[schemas.ProductoConIngredientes])
def listar_productos_con_ingredientes(db: Session = Depends(get_db)):
    productos=db.query(models.Platillo).all()
    mostrar_menu=[]
    for producto in productos:
        ingredientes = db.query(models.Ingrediente.nombre)\
        .join(models.Recetas, models.Recetas.ingrediente_id == models.Ingrediente.id)\
        .filter(models.Recetas.producto_id == producto.id)\
        .all()
        mostrar_menu.append({
            "id": producto.id,
            "nombre": producto.nombre,
            "descripcion": producto.descripcion,
            "precio": producto.precio,
            "categoria": producto.categoria.nombre if producto.categoria else "",  # Asumiendo relación
            "producto_activo":producto.producto_activo,
            "ingredientes": [{"nombre": ing[0]} for ing in ingredientes]
        })
    return mostrar_menu

@router.put("/deshabilitar/{id}",response_model=None)
def HabilitarPlatillo(id:int,db:Session=Depends(get_db)):
    platillo=db.query(models.Platillo).filter(models.Platillo.id==id).first()
    
    if platillo is None:
        raise HTTPException(status_code=404, detail="Platillo no encontrado")

    valor_actual = getattr(platillo, "producto_activo")
    setattr(platillo, "producto_activo", not bool(valor_actual))

    db.commit()
    db.refresh(platillo)

    if getattr(platillo, "producto_activo"):
        return {"mensaje": "Estado activado correctamente"}
    else:
        return {"mensaje": "Estado desactivado correctamente"}
