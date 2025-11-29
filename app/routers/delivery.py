from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, date
import database, schemas, models
from logging_config import setup_loggers
import logging
setup_loggers()
app_logger = logging.getLogger("app_logger")
error_logger = logging.getLogger("error_logger")
router = APIRouter(prefix="/delivery", tags=["delivery"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/pedidos/", response_model=List[schemas.PedidoDeliveryCompletoResponse])
def listar_pedidos_delivery(db: Session = Depends(get_db)):
    try:
        pedidos = db.query(models.Pedidos).filter(
            models.Pedidos.tipo_pedido == 'delivery'
        ).order_by(models.Pedidos.fecha_creacion.desc()).all()
        
        resultados = []
        for pedido in pedidos:
            delivery_info = db.query(models.Pedidos_Delivery).filter(
                models.Pedidos_Delivery.pedido_id == pedido.id
            ).first()
            
            if not delivery_info:
                app_logger.warning("No hay pedidos de delivery")
                continue
            detalles_db = db.query(models.Detalles_Pedido).filter(
                models.Detalles_Pedido.pedido_id == pedido.id
            ).all()
            
            pago_db = db.query(models.Pagos).filter(
                models.Pagos.pedido_id == pedido.id
            ).first()
            
            detalles_response = []
            for detalle in detalles_db:
                producto = db.query(models.Platillo).filter(
                    models.Platillo.id == detalle.producto_id
                ).first()
                detalles_response.append({
                    "id": detalle.id,
                    "producto_id": detalle.producto_id,
                    "producto_nombre": producto.nombre if producto else "Producto",
                    "cantidad": detalle.cantidad,
                    "precio_unitario": float(detalle.precio_unitario),
                    "notas": detalle.notas,
                    "estado": detalle.estado
                })
            app_logger.info("Los pedidos son listados correctamente")
            resultados.append({
                "pedido": {
                    "id": pedido.id,
                    "estado": pedido.estado,
                    "monto_total": float(pedido.monto_total),
                    "tipo_pedido": pedido.tipo_pedido,
                    "fecha_creacion": pedido.fecha_creacion.isoformat(),
                    "nombre_cliente": delivery_info.nombre_cliente,
                    "direccion_cliente": delivery_info.direccion_cliente,
                    "telefono_cliente": delivery_info.telefono_cliente,
                    "plataforma": delivery_info.plataforma,
                    "codigo_pedido_externo": delivery_info.codigo_pedido_externo
                },
                "detalles": detalles_response,
                "pago": {
                    "id": pago_db.id if pago_db else None,
                    "monto": float(pago_db.monto) if pago_db else 0.0,
                    "metodo_pago": pago_db.metodo_pago if pago_db else None,
                    "estado": pago_db.estado if pago_db else None,
                    "referencia_pago": pago_db.referencia_pago if pago_db else None
                }
            })
        return resultados
        
    except Exception as e:
        raise HTTPException(
            error_logger.error("Hay un error 500 para listar pedidos"),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar pedidos: {str(e)}"
        )

@router.patch("/pedidos/{pedido_id}/estado")
def actualizar_estado_delivery(
    pedido_id: int,
    estado_data: schemas.ActualizarEstadoDelivery,
    db: Session = Depends(get_db)
):
    try:
        pedido = db.query(models.Pedidos).filter(
            models.Pedidos.id == pedido_id,
            models.Pedidos.tipo_pedido == 'delivery'
        ).first()
        
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado"
            )
        
        estado_anterior = pedido.estado
        pedido.estado = estado_data.estado
        
        # Actualizar detalles si es necesario
        if estado_data.estado in ['en_preparacion', 'listo']:
            db.query(models.Detalles_Pedido).filter(
                models.Detalles_Pedido.pedido_id == pedido_id
            ).update({"estado": estado_data.estado}, synchronize_session=False)
        
        db.commit()
        error_logger.info(f'El pedido {pedido_id} ha cambiado de estado correctamente')
        return {
            "mensaje": "Estado actualizado",
            "pedido_id": pedido_id,
            "estado_anterior": estado_anterior,
            "estado_nuevo": estado_data.estado
        }
        
    except HTTPException:
        error_logger.error("Error al actualizar el estado del pedido")
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        error_logger.error("Error 500 para actualizar el estado del pedido")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar estado: {str(e)}"
        )
@router.get("/estadisticas/hoy")
def obtener_estadisticas_delivery_hoy(db: Session = Depends(get_db)):
    try:
        hoy = date.today()
        # Total pedidos hoy
        total_pedidos = db.query(models.Pedidos).filter(
            models.Pedidos.tipo_pedido == models.TipoPedidoEnum.delivery, 
            func.date(models.Pedidos.fecha_creacion) == hoy
        ).count()
        # Monto total hoy
        pedidos_hoy = db.query(models.Pedidos).filter(
            models.Pedidos.tipo_pedido == models.TipoPedidoEnum.delivery,
            func.date(models.Pedidos.fecha_creacion) == hoy
        ).all()
        monto_total = sum(float(pedido.monto_total) for pedido in pedidos_hoy) 
        # Pedidos por plataforma
        plataformas_data = db.query(
            models.Pedidos_Delivery.plataforma,
            func.count(models.Pedidos_Delivery.pedido_id)
        ).join(
            models.Pedidos, 
            models.Pedidos_Delivery.pedido_id == models.Pedidos.id
        ).filter(
            func.date(models.Pedidos.fecha_creacion) == hoy 
        ).group_by(models.Pedidos_Delivery.plataforma).all()
        
        plataformas_dict = {}
        for plataforma, cantidad in plataformas_data:
            plataformas_dict[plataforma] = {
                'cantidad': cantidad,
                'monto_total': 0
            }
        app_logger.info("Se han obtenido las estadisticas de hoy de delivery")
        return {
            "total_pedidos": total_pedidos,
            "monto_total": round(monto_total, 2),
            "pedidos_por_plataforma": plataformas_dict
        }
        
    except Exception as e:
        error_logger.error("Error al obtener las estadísticas de hoy")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )
# Agregar al final de pedidos_delivery.py
@router.post("/webhook")
def recibir_pedido_externo(
    pedido_data: schemas.PedidoDeliveryCreate,
    db: Session = Depends(get_db)
):
    """
    Webhook para recibir pedidos de plataformas externas (Rappi, Uber Eats, etc.)
    El pedido queda en estado 'por_confirmar' hasta que el admin lo acepte.
    """
    # Verificar duplicados
    if pedido_data.codigo_pedido_externo:
        existente = db.query(models.Pedidos_Delivery).filter(
            models.Pedidos_Delivery.codigo_pedido_externo == pedido_data.codigo_pedido_externo
        ).first()
        
        if existente:
            app_logger.warning(f'Ese pedido {pedido_data.codigo_pedido_externo} externo ya existe')
            raise HTTPException(
                status_code=409,
                detail=f"Pedido {pedido_data.codigo_pedido_externo} ya existe"
            )
    # Calcular monto total
    monto_total = 0.0
    for detalle in pedido_data.detalles:
        producto = db.query(models.Platillo).filter(
            models.Platillo.id == detalle.producto_id,
            models.Platillo.producto_activo == True
        ).first()
        if not producto:
            app_logger.warning("No existe ese producto")
            raise HTTPException(status_code=404, detail=f"Producto {detalle.producto_id} no encontrado")
        monto_total += float(producto.precio) * detalle.cantidad
    try:
        # Crear pedido con estado "por_confirmar"
        db_pedido = models.Pedidos(
            empleado_id=None,
            estado='por_confirmar',  
            monto_total=monto_total,
            mesa_id=None,
            tipo_pedido='delivery',
            fecha_creacion=datetime.now()
        )
        db.add(db_pedido)
        db.flush()
        # Crear info delivery
        db_delivery = models.Pedidos_Delivery(
            pedido_id=db_pedido.id,
            nombre_cliente=pedido_data.nombre_cliente,
            direccion_cliente=pedido_data.direccion_cliente,
            telefono_cliente=pedido_data.telefono_cliente,
            plataforma=pedido_data.plataforma,
            codigo_pedido_externo=pedido_data.codigo_pedido_externo
        )
        db.add(db_delivery)
        # Crear detalles
        for detalle in pedido_data.detalles:
            producto = db.query(models.Platillo).filter(
                models.Platillo.id == detalle.producto_id
            ).first()
            db_detalle = models.Detalles_Pedido(
                pedido_id=db_pedido.id,
                producto_id=detalle.producto_id,
                cantidad=detalle.cantidad,
                precio_unitario=producto.precio,
                notas=detalle.notas,
                estado='por_confirmar'
            )
            db.add(db_detalle) 
        db.commit()  
        app_logger.info("El pedido externo ha sido recibido exitosamente")
        return {
            "status": "recibido",
            "mensaje": "Pedido recibido, pendiente de confirmación por administrador",
            "pedido_id": db_pedido.id,
            "codigo_externo": pedido_data.codigo_pedido_externo
        } 
    except Exception as e:
        error_logger.error("El pedido externo no se ha podido recibir")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
@router.put("/webhook/{pedido_id}/confirmar")
def confirmar_pedido_externo(pedido_id: int, db: Session = Depends(get_db)):
    """Admin confirma el pedido y pasa a 'pendiente'"""
    pedido = db.query(models.Pedidos).filter(
        models.Pedidos.id == pedido_id,
        models.Pedidos.estado == 'por_confirmar'
    ).first()
    if not pedido:
        app_logger.warning(f'El pedido {pedido.id} ya existe')
        raise HTTPException(status_code=404, detail="Pedido no encontrado o ya confirmado")
    pedido.estado = 'pendiente'
    db.query(models.Detalles_Pedido).filter(
        models.Detalles_Pedido.pedido_id == pedido_id
    ).update({"estado": "pendiente"})
    db.commit()
    app_logger.info(f'El pedido {pedido_id} ha sido cambiado a pendiente')
    return {"mensaje": "Pedido confirmado a pendiente", "pedido_id": pedido_id, "estado": "pendiente"}
@router.get("/webhook/pendientes")
def listar_pedidos_por_confirmar(db: Session = Depends(get_db)):
    """Lista pedidos recibidos por webhook pendientes de confirmación"""
    pedidos = db.query(models.Pedidos).filter(
        models.Pedidos.tipo_pedido == 'delivery',
        models.Pedidos.estado == 'por_confirmar'
    ).order_by(models.Pedidos.fecha_creacion.desc()).all()
    resultados = []
    for pedido in pedidos:
        delivery_info = db.query(models.Pedidos_Delivery).filter(
            models.Pedidos_Delivery.pedido_id == pedido.id
        ).first()
        detalles = db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id == pedido.id
        ).all()
        detalles_lista = []
        for d in detalles:
            producto = db.query(models.Platillo).filter(
                models.Platillo.id == d.producto_id
            ).first()
            detalles_lista.append({
                "producto": producto.nombre if producto else "N/A",
                "cantidad": d.cantidad,
                "precio": float(d.precio_unitario)
            })
        resultados.append({
            "id": pedido.id,
            "fecha": pedido.fecha_creacion.isoformat(),
            "monto_total": float(pedido.monto_total),
            "cliente": delivery_info.nombre_cliente if delivery_info else "N/A",
            "direccion": delivery_info.direccion_cliente if delivery_info else "N/A",
            "telefono": delivery_info.telefono_cliente if delivery_info else "N/A",
            "plataforma": delivery_info.plataforma if delivery_info else "N/A",
            "codigo_externo": delivery_info.codigo_pedido_externo if delivery_info else None,
            "detalles": detalles_lista
        })
    app_logger.info("Los pedidos de delivery a confirmar se muestran correctamente")
    return resultados