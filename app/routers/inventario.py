from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, database, schemas

router = APIRouter(prefix="/api/inventario", tags=["inventario"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET /api/inventario/ - Obtener todo el inventario
@router.get("/")
def Mostrar_inventario(db: Session = Depends(get_db)):
    ingredientes = db.query(models.Ingredientes).order_by(models.Ingredientes.id.asc()).all()
    mostrar_ingredientes = []
    for ingrediente in ingredientes:
        mostrar_ingredientes.append({
            "id": ingrediente.id,
            "nombre": ingrediente.nombre,
            "cantidad_actual": float(ingrediente.cantidad_actual),
            "minimo": float(ingrediente.stock_minimo),
            "categoria": ingrediente.descripcion,  # descripcion como categoria
            "precio": float(ingrediente.precio),
            "unidad_medida": ingrediente.unidad_de_medida,
            "perecible": ingrediente.es_perecible
        })
    return mostrar_ingredientes

# POST /api/inventario/ - Crear nuevo insumo
@router.post("/")
def crear_insumo(insumo: schemas.AInsumo, db: Session = Depends(get_db)):
    try:
        # Verificar si ya existe
        insumo_existente = db.query(models.Ingredientes).filter(
            models.Ingredientes.nombre == insumo.nombre
        ).first()
        
        if insumo_existente:
            raise HTTPException(status_code=400, detail="Ya existe un insumo con este nombre")
        
        # Crear nuevo ingrediente
        db_ingrediente = models.Ingredientes(
            nombre=insumo.nombre,
            descripcion=insumo.categoria,  # categoria -> descripcion
            cantidad_actual=insumo.cantidad,
            precio=insumo.precio,
            unidad_de_medida=insumo.unidad,
            stock_minimo=insumo.minimo,
            es_perecible=insumo.perecible
        )
        
        db.add(db_ingrediente)
        db.commit()
        db.refresh(db_ingrediente)
        
        return {
            "id": db_ingrediente.id,
            "nombre": db_ingrediente.nombre,
            "cantidad_actual": float(db_ingrediente.cantidad_actual),
            "minimo": float(db_ingrediente.stock_minimo),
            "categoria": db_ingrediente.descripcion,
            "precio": float(db_ingrediente.precio),
            "unidad_medida": db_ingrediente.unidad_de_medida,
            "perecible": db_ingrediente.es_perecible
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creando insumo: {str(e)}")

# PUT /api/inventario/{insumo_id} - Actualizar insumo
@router.put("/{insumo_id}")
def actualizar_insumo(insumo_id: int, insumo: schemas.AInsumo, db: Session = Depends(get_db)):
    try:
        # Buscar el ingrediente
        db_ingrediente = db.query(models.Ingredientes).filter(models.Ingredientes.id == insumo_id).first()
        
        if not db_ingrediente:
            raise HTTPException(status_code=404, detail="Insumo no encontrado")
        
        # Verificar nombre duplicado
        if insumo.nombre != db_ingrediente.nombre:
            insumo_existente = db.query(models.Ingredientes).filter(
                models.Ingredientes.nombre == insumo.nombre,
                models.Ingredientes.id != insumo_id
            ).first()
            if insumo_existente:
                raise HTTPException(status_code=400, detail="Ya existe otro insumo con este nombre")
        
        # Actualizar campos
        db_ingrediente.nombre = insumo.nombre
        db_ingrediente.descripcion = insumo.categoria
        db_ingrediente.cantidad_actual = insumo.cantidad
        db_ingrediente.precio = insumo.precio
        db_ingrediente.unidad_de_medida = insumo.unidad
        db_ingrediente.stock_minimo = insumo.minimo
        db_ingrediente.es_perecible = insumo.perecible
        
        db.commit()
        db.refresh(db_ingrediente)
        
        return {
            "id": db_ingrediente.id,
            "nombre": db_ingrediente.nombre,
            "cantidad_actual": float(db_ingrediente.cantidad_actual),
            "minimo": float(db_ingrediente.stock_minimo),
            "categoria": db_ingrediente.descripcion,
            "precio": float(db_ingrediente.precio),
            "unidad_medida": db_ingrediente.unidad_de_medida,
            "perecible": db_ingrediente.es_perecible
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error actualizando insumo: {str(e)}")

# DELETE /api/inventario/{insumo_id} - Eliminar insumo
@router.delete("/{insumo_id}")
def eliminar_insumo(insumo_id: int, db: Session = Depends(get_db)):
    try:
        db_ingrediente = db.query(models.Ingredientes).filter(models.Ingredientes.id == insumo_id).first()
        
        if not db_ingrediente:
            raise HTTPException(status_code=404, detail="Insumo no encontrado")
        
        db.delete(db_ingrediente)
        db.commit()
        
        return {"message": "Insumo eliminado correctamente"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error eliminando insumo: {str(e)}")

# POST /api/inventario/movimiento - Registrar movimiento
@router.post("/movimiento")
def registrar_movimiento(movimiento_data: dict, db: Session = Depends(get_db)):
    try:
        print("Datos recibidos:", movimiento_data)
        
        # Validar datos del movimiento
        insumo_id = movimiento_data.get("insumo_id")
        tipo_movimiento = movimiento_data.get("tipo_movimiento")
        cantidad = movimiento_data.get("cantidad")
        motivo = movimiento_data.get("motivo", "")
        empleado_id = movimiento_data.get("empleado_id", 1)
        
        if not all([insumo_id, tipo_movimiento, cantidad]):
            raise HTTPException(status_code=400, detail="Datos incompletos")
        
        # Buscar el insumo
        ingrediente = db.query(models.Ingredientes).filter(models.Ingredientes.id == insumo_id).first()
        if not ingrediente:
            raise HTTPException(status_code=404, detail="Insumo no encontrado")
        
        print(f"Stock actual: {ingrediente.cantidad_actual}, Cantidad a mover: {cantidad}")
        
        # Convertir cantidad a float
        cantidad_float = float(cantidad)
        
        # Validar stock para consumo/merma
        if tipo_movimiento in ["Consumo", "Merma"]:
            if ingrediente.cantidad_actual < cantidad_float:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuficiente. Disponible: {ingrediente.cantidad_actual} {ingrediente.unidad_de_medida}"
                )
            # Restar del stock
            ingrediente.cantidad_actual -= cantidad_float
        
        elif tipo_movimiento == "Ajuste":
            # Sumar o restar según el ajuste
            ingrediente.cantidad_actual += cantidad_float
        
        print(f"Nuevo stock: {ingrediente.cantidad_actual}")
        
        db.commit()
        
        return {
            "message": "Movimiento registrado correctamente",
            "nuevo_stock": float(ingrediente.cantidad_actual)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error completo: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error registrando movimiento: {str(e)}")