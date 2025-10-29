from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session,joinedload
from typing import List
from datetime import datetime
from .. import models, database,schemas
router=APIRouter(prefix="/pedidosF",tags=["pedidosF"])
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
#Para disminuir la cantidad de insumos en base a los platillos que se realizaron en el pedido
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
                if receta.ingrediente_id in insumos_necesarios:
                    insumos_necesarios[receta.ingrediente_id] += cantidad
                else:
                    insumos_necesarios[receta.ingrediente_id] = cantidad
        
        # 3. Verificar y descontar de forma ATÓMICA
        for insumo_id, cantidad in insumos_necesarios.items():
            # ✅ Usar row locking para evitar race conditions
            insumo = db.query(models.Ingrediente).filter(
                models.Ingrediente.id == insumo_id
            ).with_for_update().first()
            
            if not insumo:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ingrediente {insumo_id} no encontrado"
                )
            cantidad_float=float(cantidad)
            if insumo.cantidad_actual < cantidad_float:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente de {insumo.nombre}"
                )
            
            # ✅ Descontar correctamente
            insumo.cantidad_actual -=float(insumo.cantidad)
        
        # ✅ Commit para guardar cambios
        db.commit()
        
    except HTTPException:
        db.rollback()  # ✅ Rollback en caso de error
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
#Para colocar platillos disponibles en el select
@router.get("/platillos", response_model=None)
def listar_productos(db: Session = Depends(get_db)):
    productos=db.query(models.Platillo).filter(models.Platillo.producto_activo==True)
    mostrar_menu=[]
    for producto in productos:
        mostrar_menu.append({
            "id": producto.id,
            "nombre": producto.nombre,
            "precio":producto.precio
        })
    return mostrar_menu
#Para colocar mesas disponibles en el select
@router.get("/mesas")
def Mostrar_mesas(db:Session=Depends(get_db)):
    mesas=db.query(models.Mesas).filter(models.Mesas.estado=="libre").order_by(models.Mesas.id.asc())
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
        mesa_numero = f"Mesa {pedido.mesas.numero}" if pedido.mesas else "Para delivery"
        hora = pedido.fecha_creacion.strftime("%H:%M")
        
        items = [
            {
                "producto_id": int(detalle.producto_id),
                "nombre": detalle.platillos.nombre,
                "cantidad": int(detalle.cantidad),
                "precio_unitario": float(detalle.precio_unitario)
            }
            for detalle in pedido.Dpedido
        ]
        
        mostrar_pedidos.append({
            "id": pedido.id,
            "mesa": mesa_numero,
            "estado": pedido.estado,
            "tipo_pedido":pedido.tipo_pedido,
            "hora": hora,
            "monto_total": float(pedido.monto_total), # type: ignore
            "items": items
        })
    return mostrar_pedidos

@router.put("/eliminarPM/{id}")
def cancelar_Pedidos(id: int, db: Session = Depends(get_db)):
    # Buscar el pedido
    pedido = db.query(models.Pedidos).filter(models.Pedidos.id == id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    pedido.estado=models.EstadoPedidoEnum.cancelado # type: ignore # type: ignore
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
        return {"mensaje": f"Se eliminaron {registros_a_eliminar} detalles para el pedido {id}"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron detalles para el pedido con ID {id}"
        )
    return
##Cambiar estado de una mesa a otra y restar cantidad de insumos
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
        estado_anterior = pedido.estado
        # Determinar nuevo estado
        if pedido.estado == models.EstadoPedidoEnum.pendiente: # type: ignore
            nuevo_estado = models.EstadoPedidoEnum.en_preparacion
        elif pedido.estado == models.EstadoPedidoEnum.en_preparacion: # type: ignore
            nuevo_estado = models.EstadoPedidoEnum.listo
        elif pedido.estado == models.EstadoPedidoEnum.listo: # type: ignore
            # Aquí la lógica es un poco más compleja, ya que compara con un string
            # DEBES COMPARAR CON LOS VALORES DE ENUM
            if pedido.tipo_pedido == models.TipoPedidoEnum.delivery: # type: ignore
                nuevo_estado = models.EstadoPedidoEnum.entregado
            else:
                nuevo_estado = models.EstadoPedidoEnum.servido
        else:
            # Ahora, la comparación final es segura porque compara objetos Enum
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado '{pedido.estado.value}' no válido o ya está completo"
            )
        
        # Actualizar el pedido
        pedido.estado = nuevo_estado # type: ignore

        if (estado_anterior==models.EstadoPedidoEnum.pendiente and nuevo_estado == models.EstadoPedidoEnum.en_preparacion): # type: ignore
            descontar_insumos_pedido(id,db)
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
@router.post("/agregarPedido",response_model=schemas.MostrarPedido)
def agregar_Pedido(data:schemas.AgregarPedido,db:Session=Depends(get_db)):
    try:
        mesa = db.query(models.Mesas).filter(
            models.Mesas.id ==data.mesa_id
        ).first()
        if not mesa:
            raise HTTPException(status_code=404, detail="Mesa no encontrada")
        nuevo_pedido=models.Pedidos(mesa_id=data.mesa_id,empleado_id=data.empleado_id,estado=data.estado,tipo_pedido=data.tipo_pedido,monto_total=data.monto_total,fecha_creacion=datetime.now())
        db.add(nuevo_pedido)
        db.flush() #Para obtener el id y así registrar tambien los platillos pedidos.
        for item in data.items:
            detalle = models.Detalles_Pedido(
                pedido_id=nuevo_pedido.id,
                producto_id=item.producto_id, 
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario
            )
            db.add(detalle)
        db.commit()
        db.refresh(nuevo_pedido)
        detalles = db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id == nuevo_pedido.id
        ).all()
        # 4. Retornar el pedido creado
        return {
            "id": nuevo_pedido.id,
            "mesa": f"Mesa {mesa.numero}",
            "estado": nuevo_pedido.estado,
            "hora": nuevo_pedido.fecha_creacion.strftime("%H:%M"),
            "tipo_pedido": nuevo_pedido.tipo_pedido,
            "monto_total": float(nuevo_pedido.monto_total), # type: ignore
            "items": [
                {
                    "pedido_id": d.pedido_id,
                    "producto_id": d.producto_id,
                    "nombre": d.platillos.nombre,
                    "cantidad": d.cantidad,
                    "precio_unitario": float(d.precio_unitario) # type: ignore
                }
                for d in detalles
            ]}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/editar/{id}")
def modificar_pedido(id: int, pedido_data: schemas.PedidoEditarSolicitud, db: Session = Depends(get_db)):
    try:
        pedido = db.query(models.Pedidos).filter(models.Pedidos.id == id).first()
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido #{id} no encontrado"
            )
        if not pedido_data.items or len(pedido_data.items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El pedido debe tener como minimo un platillo"
            )
        # Validar productos y cantidades
        for item in pedido_data.items:
            producto = db.query(models.Platillo).filter(
                models.Platillo.id == item.producto_id
            ).first()
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se encontro este producto"
                )
            if item.cantidad < 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La cantidad debe ser mayor a 0"
                )
        # ✅ ELIMINAR items antiguos con synchronize_session=False
        db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id == id
        ).delete(synchronize_session=False)
        # ✅ FORZAR la ejecución del DELETE antes de continuar
        db.flush()
        # Agregar los nuevos items
        for detalle in pedido_data.items:
            nuevo_detalle = models.Detalles_Pedido(
                pedido_id=id,
                producto_id=detalle.producto_id,
                cantidad=detalle.cantidad,
                precio_unitario=detalle.precio_unitario,
                notas=detalle.notas,
                estado="pendiente"                                 
            )
            db.add(nuevo_detalle)
        
        # Actualizar monto total
        pedido.monto_total = pedido_data.monto_total # type: ignore
        
        db.commit()
        db.refresh(pedido)
        
        detalles_actualizados = db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id == id
        ).all()
        
        return {
            "mensaje": "Pedido actualizado correctamente",
            "pedido_id": id,
            "monto_total": pedido.monto_total,
            "total_items": len(detalles_actualizados),
            "items": [
                {
                    "id": d.id,
                    "producto_id": d.producto_id,
                    "cantidad": d.cantidad,
                    "precio_unitario": d.precio_unitario,
                    "subtotal": d.cantidad * d.precio_unitario
                }
                for d in detalles_actualizados
            ]
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al editar el pedido: {str(e)}"
        )
@router.get("/delivery-pendientes-pago/")
def obtener_pedidos_delivery_pendientes_pago(db: Session = Depends(get_db)):
    try:
        # Pedidos delivery que estén en estado 'Entregado' y no tengan un pago completado
        pedidos = db.query(models.Pedidos).join(models.Pedidos_Delivery).outerjoin(models.Pagos).filter(
            models.Pedidos.tipo_pedido == models.TipoPedidoEnum.delivery,
            models.Pedidos.estado == models.EstadoPedidoEnum.entregado,
            ~models.Pedidos.pagos.any(models.Pagos.estado == models.EstadoPagoEnum.pagado)
        ).all()

        resultado = []
        for pedido in pedidos:
            # Obtener información de delivery
            delivery_info = db.query(models.Pedidos_Delivery).filter(
                models.Pedidos_Delivery.pedido_id == pedido.id
            ).first()

            # Obtener detalles del pedido
            detalles = db.query(models.Detalles_Pedido).filter(
                models.Detalles_Pedido.pedido_id == pedido.id
            ).all()

            detalles_lista = []
            for detalle in detalles:
                producto = db.query(models.Platillo).filter(models.Platillo.id == detalle.producto_id).first()
                detalles_lista.append({
                    "producto_id": detalle.producto_id,
                    "nombre_producto": producto.nombre if producto else "Producto no encontrado",
                    "cantidad": detalle.cantidad,
                    "precio_unitario": float(detalle.precio_unitario)
                })

            resultado.append({
                "pedido": {
                    "id": pedido.id,
                    "monto_total": float(pedido.monto_total),
                    "estado": pedido.estado,
                },
                "delivery_info": {
                    "nombre_cliente": delivery_info.nombre_cliente,
                    "direccion_cliente": delivery_info.direccion_cliente,
                    "telefono_cliente": delivery_info.telefono_cliente,
                    "plataforma": delivery_info.plataforma
                },
                "detalles": detalles_lista
            })

        return resultado

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ✅ ENDPOINT NUEVO: Obtener pagos completados (solo delivery)
@router.get("/pagos-completados/")
def obtener_pagos_completados(db: Session = Depends(get_db)):
    try:    # ✅ Cargar TODO con joins anticipados (evita N+1 queries)
        pagos = db.query(models.Pagos).join(
            models.Pedidos
        ).options(
            joinedload(models.Pagos.pedidosP)  # Cargar pedido
            .joinedload(models.Pedidos.PedidosD),  # Cargar delivery_info
            
            joinedload(models.Pagos.pedidosP)  # Cargar pedido otra vez
            .joinedload(models.Pedidos.Dpedido)  # Cargar detalles
            .joinedload(models.Detalles_Pedido.platillos)  # Cargar productos
        ).filter(
            models.Pedidos.tipo_pedido == models.TipoPedidoEnum.delivery,
            models.Pagos.estado == models.EstadoPagoEnum.pagado
        ).all()

        resultado = []
        for pago in pagos:
            pedido = pago.pedidosP  # Ya cargado
            delivery_info = pedido.PedidosD  # Ya cargado por joinedload
            
            # ✅ Sin queries adicionales - todo ya está en memoria
            detalles_lista = [{
                "producto_id": detalle.producto_id,
                "nombre_producto": detalle.platillos.nombre if detalle.platillos else "Producto no encontrado",
                "cantidad": detalle.cantidad,
                "precio_unitario": float(detalle.precio_unitario)
            } for detalle in pedido.Dpedido]  # Ya cargado

            resultado.append({
                "id": pago.id,
                "orderId": f"DEL-{pedido.id}",
                "type": "delivery",
                "customerName": delivery_info.nombre_cliente if delivery_info else "N/A",
                "customerPhone": delivery_info.telefono_cliente if delivery_info else "N/A",
                "customerAddress": delivery_info.direccion_cliente if delivery_info else "N/A",
                "items": detalles_lista,
                "subtotal": float(pedido.monto_total) / 1.18,
                "tax": float(pedido.monto_total) - (float(pedido.monto_total) / 1.18),
                "discount": 0,
                "total": float(pedido.monto_total),
                "paymentMethod": pago.metodo_pago.value,
                "status": "completed",
                "createdAt": pago.fecha_pago.strftime("%Y-%m-%d %H:%M") if pago.fecha_pago else pedido.fecha_creacion.strftime("%Y-%m-%d %H:%M"),
                "plataforma": delivery_info.plataforma.value if delivery_info else "N/A"
            })

        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ✅ ENDPOINT NUEVO: Procesar pago delivery
@router.post("/procesar-pago-delivery/")
def procesar_pago_delivery(pago_data: schemas.ProcesarPagoDelivery, db: Session = Depends(get_db)):
    try:
        # Verificar que el pedido existe y es delivery
        pedido = db.query(models.Pedidos).join(models.Pedidos_Delivery).filter(
            models.Pedidos.id == pago_data.pedido_id,
            models.Pedidos.tipo_pedido == models.TipoPedidoEnum.delivery
        ).first()

        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido delivery no encontrado")

        # Verificar que no tenga un pago completado
        pago_existente = db.query(models.Pagos).filter(
            models.Pagos.pedido_id == pago_data.pedido_id,
            models.Pagos.estado == models.EstadoPagoEnum.pagado
        ).first()

        if pago_existente:
            raise HTTPException(status_code=400, detail="El pedido ya tiene un pago completado")

        # Crear el pago
        nuevo_pago = models.Pagos(
            pedido_id=pago_data.pedido_id,
            monto=pedido.monto_total,
            metodo_pago=pago_data.metodo_pago,
            estado=models.EstadoPagoEnum.pagado,
            fecha_pago=datetime.now(),
            referencia_pago=pago_data.referencia_pago
        )
        db.add(nuevo_pago)

        # Cambiar estado del pedido a 'Completado'
        pedido.estado = models.EstadoPedidoEnum.completado

        db.commit()
        db.refresh(nuevo_pago)

        # Obtener información para la respuesta
        delivery_info = db.query(models.Pedidos_Delivery).filter(
            models.Pedidos_Delivery.pedido_id == pedido.id
        ).first()

        return {
            "mensaje": "Pago procesado exitosamente",
            "pago_id": nuevo_pago.id,
            "datos_cliente": {
                "nombre": delivery_info.nombre_cliente,
                "telefono": delivery_info.telefono_cliente,
                "direccion": delivery_info.direccion_cliente,
                "plataforma": delivery_info.plataforma,
            }
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 