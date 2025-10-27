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
def descontar_insumos_merma(merma_id: int, db: Session):
    # 1. Obtener detalles de la merma
    merma = db.query(models.Mermas).filter(
        models.Mermas.id == merma_id
    ).first()  # ✅ .first() en lugar de .all()
    if not merma:
        raise HTTPException(
            status_code=404,
            detail=f"Merma {merma_id} no encontrada"
        )
    # 2. Obtener recetas y calcular insumos necesarios
    recetas = db.query(models.Recetas).filter(
        models.Recetas.producto_id == merma.platillo_id
    ).all()
    
    insumos_necesarios = {}
    for receta in recetas:
        cantidad = receta.cantidad_requerida * merma.cantidad
        if receta.ingredientes_id in insumos_necesarios:
            insumos_necesarios[receta.ingredientes_id] += cantidad
        else:
            insumos_necesarios[receta.ingredientes_id] = cantidad
    
    # 3. Verificar y descontar con row locking
    for insumo_id, cantidad in insumos_necesarios.items():
        insumo = db.query(models.Ingrediente).filter(
            models.Ingrediente.id == insumo_id
        ).with_for_update().first()
        
        if not insumo:
            raise HTTPException(
                status_code=404,
                detail=f"Ingrediente {insumo_id} no encontrado"
            )
        
        if insumo.cantidad_actual < cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente de {insumo.nombre}. "
                       f"Disponible: {insumo.cantidad_actual}, Necesario: {cantidad}"
            )
        
        insumo.cantidad_actual -= cantidad
# GET /api/inventario/ - Obtener todo el inventario
@router.get("/")
def Mostrar_inventario(db: Session = Depends(get_db)):
    ingredientes = db.query(models.Ingrediente).order_by(models.Ingrediente.id.asc()).all()
    mostrar_ingredientes = []
    for ingrediente in ingredientes:
        mostrar_ingredientes.append({
            "id": ingrediente.id,
            "nombre": ingrediente.nombre,
            "cantidad_actual": float(ingrediente.cantidad_actual),
            "minimo": float(ingrediente.stock_minimo),
            "categoria": ingrediente.descripcion,  # descripcion como categoria
            "precio": float(ingrediente.precio_unitario),
            "unidad_medida": ingrediente.unidad_de_medida,
            "perecible": ingrediente.es_perecible
        })
    return mostrar_ingredientes

# POST /api/inventario/ - Crear nuevo insumo
@router.post("/")
def crear_insumo(insumo: schemas.AInsumo, db: Session = Depends(get_db)):
    try:
        # Verificar si ya existe
        insumo_existente = db.query(models.Ingrediente).filter(
            models.Ingrediente.nombre == insumo.nombre
        ).first()
        
        if insumo_existente:
            raise HTTPException(status_code=400, detail="Ya existe un insumo con este nombre")
        
        # Crear nuevo ingrediente
        db_ingrediente = models.Ingrediente(
            nombre=insumo.nombre,
            descripcion=insumo.categoria,  # categoria -> descripcion
            cantidad_actual=insumo.cantidad,
            precio=insumo.precio_unitario,
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
            "precio": float(db_ingrediente.precio_unitario),
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
        db_ingrediente = db.query(models.Ingrediente).filter(models.Ingrediente.id == insumo_id).first()
        
        if not db_ingrediente:
            raise HTTPException(status_code=404, detail="Insumo no encontrado")
        
        # Verificar nombre duplicado
        if insumo.nombre != db_ingrediente.nombre:
            insumo_existente = db.query(models.Ingrediente).filter(
                models.Ingrediente.nombre == insumo.nombre,
                models.Ingrediente.id != insumo_id
            ).first()
            if insumo_existente:
                raise HTTPException(status_code=400, detail="Ya existe otro insumo con este nombre")
        
        # Actualizar campos
        db_ingrediente.nombre = insumo.nombre
        db_ingrediente.descripcion = insumo.categoria
        db_ingrediente.cantidad_actual = insumo.cantidad
        db_ingrediente.precio = insumo.precio_unitario
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
            "precio": float(db_ingrediente.precio_unitario),
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
        db_ingrediente = db.query(models.Ingrediente).filter(models.Ingrediente.id == insumo_id).first()
        
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
        ingrediente = db.query(models.Ingrediente).filter(models.Ingrediente.id == insumo_id).first()
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
@router.post("/rMerma")
def registrar_merma(data: schemas.RegistarMerma, db: Session = Depends(get_db)):
    try:
        # ✅ Verificar que el platillo existe
        platillo = db.query(models.Platillo).filter(
            models.Platillo.id == data.platillo_id
        ).first()
        
        if not platillo:
            raise HTTPException(
                status_code=404,
                detail=f"El platillo con ID {data.platillo_id} no existe"
            )
        
        print(f"✅ Platillo encontrado: {platillo.nombre}")
        
        # ✅ Verificar que el platillo tiene recetas
        recetas = db.query(models.Recetas).filter(
            models.Recetas.producto_id == data.platillo_id
        ).all()
        
        if not recetas:
            raise HTTPException(
                status_code=400,
                detail=f"El platillo '{platillo.nombre}' no tiene recetas configuradas"
            )
        
        print(f"✅ Recetas encontradas: {len(recetas)}")
        
        # Crear merma
        nueva_merma = models.Mermas(
            platillo_id=data.platillo_id,
            cantidad=data.cantidad,
            motivo=data.motivo
        )
        db.add(nueva_merma)
        db.flush()
        
        # Descontar insumos
        descontar_insumos_merma(nueva_merma.id, db)
        
        # Commit
        db.commit()
        db.refresh(nueva_merma)
        
        return {
            "mensaje": f"Merma registrada correctamente para {platillo.nombre}",
            "merma_id": nueva_merma.id
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))