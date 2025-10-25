from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session
from typing import List
from .. import models, database,schemas
router=APIRouter(prefix="/pedidosF",tags=["pedidosF"])
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
def descontar_insumos_pedido(pedido_id: int, db: Session):
    try:
        # 1. Obtener detalles del pedido
        detalles = db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id == pedido_id
        ).all()
        
        # 2. Calcular insumos necesarios (ACUMULANDO correctamente)
        insumos_necesarios = {}
        for detalle in detalles:
            recetas = db.query(models.Recetas).filter(
                models.Recetas.producto_id == detalle.producto_id
            ).all()
            for receta in recetas:
                cantidad = receta.cantidad_requerida * detalle.cantidad
                # ✅ Acumular, no sobrescribir
                if receta.ingredientes_id in insumos_necesarios:
                    insumos_necesarios[receta.ingredientes_id] += cantidad
                else:
                    insumos_necesarios[receta.ingredientes_id] = cantidad
        
        # 3. Verificar y descontar de forma ATÓMICA
        for insumo_id, cantidad in insumos_necesarios.items():
            # ✅ Usar row locking para evitar race conditions
            insumo = db.query(models.Ingredientes).filter(
                models.Ingredientes.id == insumo_id
            ).with_for_update().first()
            
            if not insumo:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ingrediente {insumo_id} no encontrado"
                )
            
            if insumo.cantidad_actual < cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente de {insumo.nombre}"
                )
            
            # ✅ Descontar correctamente
            insumo.cantidad_actual -= cantidad
        
        # ✅ Commit para guardar cambios
        db.commit()
        
    except HTTPException:
        db.rollback()  # ✅ Rollback en caso de error
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/platillos", response_model=None)
def listar_productos(db: Session = Depends(get_db)):
    productos=db.query(models.Platillo).all()
    mostrar_menu=[]
    for producto in productos:
        mostrar_menu.append({
            "id": producto.id,
            "nombre": producto.nombre,
            "precio":producto.precio
        })
    return mostrar_menu
@router.get("/mesas")
def Mostrar_mesas(db:Session=Depends(get_db)):
    mesas=db.query(models.Mesas).order_by(models.Mesas.id.asc()).all()
    mostrar_mesas = []
    for mesa in mesas:
        mostrar_mesas.append({
            "id":mesa.id,
            "numero": mesa.numero
        })
    return mostrar_mesas
@router.get("/pedidosM", response_model=List[schemas.MostrarPedido])
def Mostrar_Pedidos(db: Session = Depends(get_db)):
    pedidos = db.query(models.Pedidos).all()
    
    mostrar_pedidos = []
    
    for pedido in pedidos:
        mesa_numero = f"Mesa {pedido.mesas.numero}" if pedido.mesas else "Sin mesa"
        hora = pedido.fecha_creacion.strftime("%H:%M")
        
        items = [
            {
                "nombre": detalle.platillos.nombre,
                "cantidad": detalle.cantidad,
                "precio_unitario": float(detalle.precio_unitario)
            }
            for detalle in pedido.Dpedido
        ]
        
        mostrar_pedidos.append({
            "id": pedido.id,
            "mesa": mesa_numero,
            "estado": pedido.estado,
            "hora": hora,
            "monto_total": float(pedido.monto_total),
            "items": items
        })
    
    return mostrar_pedidos
@router.put("/eliminarPM/{id}")
def cancelar_Pedidos(id: int, db: Session = Depends(get_db)):
    # Buscar el pedido
    pedido = db.query(models.Pedidos).filter(models.Pedidos.id == id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    pedido.estado='Cancelado'
    db.commit()
    db.refresh(pedido)
    return {"mensaje": "Pedido cancelado correctamente"}
@router.delete("/eliminarDetalles/{id}")
def eliminar_detalles_pedidos(id:int,db:Session=Depends(get_db)):
    detalles_pedidos=db.query(models.Detalles_Pedido).filter(models.Detalles_Pedido.pedido_id==id)
    registros_a_eliminar = detalles_pedidos.count()
    if registros_a_eliminar>0:
        detalles_pedidos.delete(synchronize_session="fetch")
        db.commit()
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron detalles para el pedido con ID {id}."
        )
    return
##Cambiar estado de una mesa a otra
@router.put("/{id}/estado")
def cambiar_Estado(id: int, db: Session = Depends(get_db)):
    try:
        # Buscar el pedido
        pedido = db.query(models.Pedidos).filter(models.Pedidos.id == id).first()
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido #{id} no encontrado"
            )
        # Determinar nuevo estado
        estado_map = {
            'Pendiente': 'En preparacion',
            'En preparacion': 'Listo',
            'Listo': 'Servido'
        }
        nuevo_estado = estado_map.get(pedido.estado)
        if not nuevo_estado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado '{pedido.estado}' no válido"
            )
        estado_anterior = pedido.estado
        
        # Actualizar el pedido
        pedido.estado = nuevo_estado
        
        # Actualizar todos los detalles en una sola query (MÁS EFICIENTE)
        detalles_actualizados = db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id == id
        ).update({"estado": nuevo_estado}, synchronize_session=False)
        
        db.commit()
        db.refresh(pedido)
        
        return {
            "mensaje": "Estado actualizado correctamente",
            "pedido_id": id,
            "estado_anterior": estado_anterior,
            "estado_nuevo": nuevo_estado,
            "detalles_actualizados": detalles_actualizados
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )
