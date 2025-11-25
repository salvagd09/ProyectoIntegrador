from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
import database
import schemas
import models
router=APIRouter(prefix="/mesas",tags=["mesas"])
#Acciones del router=
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/")
def Mostrar_mesas(db:Session=Depends(get_db)):
    mesas=db.query(models.Mesas).order_by(models.Mesas.id.asc()).all()
    mostrar_mesas = []
    for mesa in mesas:
        mostrar_mesas.append({
            "id": mesa.id,
            "numero": mesa.numero,
            "capacidad": mesa.capacidad,
            "estado": mesa.estado
        })
    return mostrar_mesas

@router.post("/agregarM")
def agregar_mesas(data:schemas.AMesas,db: Session=Depends(get_db)):
    nueva_mesa=models.Mesas(
        numero=data.numero,
        capacidad=data.capacidad,
        estado=data.estado
    )
    db.add(nueva_mesa)
    db.commit()
    db.refresh(nueva_mesa)
    return{
        "id": nueva_mesa.id,
        "numero": nueva_mesa.numero,
        "capacidad": nueva_mesa.capacidad,
        "estado": nueva_mesa.estado
    }

@router.put("/{mesa_id}/estado")
def cambiar_estado_mesa(mesa_id: int, db: Session = Depends(get_db)):
    mesa = db.query(models.Mesas).filter(models.Mesas.id == mesa_id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    if mesa.estado == "ocupada": # type: ignore
        mesa.estado = "libre" # type: ignore
    db.commit()
    db.refresh(mesa)
    return {"id": mesa.id, "numero": mesa.numero, "estado": mesa.estado}

@router.put("/{mesa_id}/editar")
def actualizar_mesa(mesa_id: int, mesa_actualizada: schemas.MesaUpdate, db: Session = Depends(get_db)):
    mesa = db.query(models.Mesas).filter(models.Mesas.id == mesa_id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")
    
    update_data = mesa_actualizada.dict(exclude_unset=True)
    # Validación de capacidad de mesa
    if 'capacidad' in update_data and not (1 <= update_data['capacidad'] <= 20):
        raise HTTPException(status_code=400, detail="La capacidad debe estar entre 1 y 20")
    # Validación de número de mesa
    if 'numero' in update_data:
        mesa_existente = db.query(models.Mesas).filter(
            models.Mesas.numero == update_data['numero'],
            models.Mesas.id != mesa_id
        ).first()
        if mesa_existente:
            raise HTTPException(status_code=400, detail="Ya existe una mesa con ese número")

    # Actualizar los campos de la mesa
    for key, value in update_data.items():
        setattr(mesa, key, value)
    
    try:
        db.commit()
        db.refresh(mesa)
        return {
            "id": mesa.id,
            "numero": mesa.numero,
            "capacidad": mesa.capacidad,
            "estado": mesa.estado
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar la mesa: {str(e)}")