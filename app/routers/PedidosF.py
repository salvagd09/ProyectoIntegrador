from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session,joinedload
from typing import List
from datetime import datetime
from logging_config import setup_loggers
from routers.inventario_L import registrar_salida_stock
import database
import models, schemas 
import logging
setup_loggers()
app_logger = logging.getLogger("app_logger")
error_logger = logging.getLogger("error_logger")
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
        EMPLEADO_ID_SISTEMA = 7
        # 2. Calcular insumos necesarios (ACUMULANDO correctamente)
        insumos_necesarios = {}
        for detalle in detalles:
            recetas = db.query(models.Recetas).filter(
                models.Recetas.producto_id == detalle.producto_id
            ).all()
            for receta in recetas:
                cantidad = receta.cantidad_requerida * detalle.cantidad
                # Acumular, no sobrescribir
                if receta.ingrediente_id in insumos_necesarios:
                    insumos_necesarios[receta.ingrediente_id] += cantidad
                else:
                    insumos_necesarios[receta.ingrediente_id] = cantidad
        
        # 3. Verificar y descontar de forma ATÓMICA
        for insumo_id, cantidad in insumos_necesarios.items():
            # Usar row locking para evitar race conditions
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
            
            #  Descontar correctamente
            insumo.cantidad_actual -= cantidad_float
            #  AGREGAR empleado_id al llamado
            registrar_salida_stock(
                ingrediente_id=insumo_id,
                cantidad_a_consumir=cantidad,
                tipo_movimiento=models.TipoMovimientoEnum.consumo,
                referencia_salida=f"Preparacion del platillo del pedido {pedido_id}",
                empleado_id=EMPLEADO_ID_SISTEMA,
                auto_commit=False,   
                db=db
            )
    except HTTPException:
        error_logger.error("No se pudo realizar la petición HTTP")
        db.rollback()  # ✅ Rollback en caso de error
        raise
    except Exception as e:
        error_logger.error("Error 500 para descontar insumos")
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
    app_logger.info("Platillos existentes para el pedido")
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
    app_logger.info("Las mesas disponibles han sido mostradas")
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
    app_logger.info("Los pedidos son mostrados de forma correcta")
    return mostrar_pedidos

@router.put("/eliminarPM/{id}")
def cancelar_Pedidos(id: int, db: Session = Depends(get_db)):
    # Buscar el pedido
    pedido = db.query(models.Pedidos).filter(models.Pedidos.id == id).first()
    if not pedido:
        app_logger.warning("No existe tal pedido")
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    pedido.estado=models.EstadoPedidoEnum.cancelado # type: ignore # type: ignore
    db.commit()
    db.refresh(pedido)
    app_logger.info(f'El pedido {pedido.id} ha sido eliminado')
    return {"mensaje": "Pedido cancelado correctamente"}

@router.delete("/eliminarDetalles/{id}")
def eliminar_detalles_pedidos(id:int,db:Session=Depends(get_db)):
    detalles_pedidos=db.query(models.Detalles_Pedido).filter(models.Detalles_Pedido.pedido_id==id)
    registros_a_eliminar = detalles_pedidos.count()
    if registros_a_eliminar>0:
        detalles_pedidos.delete(synchronize_session="fetch")
        db.commit()
        app_logger.info(f'Los platillos del pedido {id} tambien han sido eliminados')
        return {"mensaje": f"Se eliminaron {registros_a_eliminar} detalles para el pedido {id}"}
    else:
        raise HTTPException(
            app_logger.warning(f'No se encontradron los detalles del pedido {id}'),
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron detalles para el pedido con ID {id}"
        )
    return
##Cambiar estado de un pedido y restar cantidad de insumos
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
        if pedido.estado == models.EstadoPedidoEnum.pendiente:
            nuevo_estado = models.EstadoPedidoEnum.en_preparacion
        elif pedido.estado == models.EstadoPedidoEnum.en_preparacion:
            nuevo_estado = models.EstadoPedidoEnum.listo
        elif pedido.estado == models.EstadoPedidoEnum.listo:
            if pedido.tipo_pedido == models.TipoPedidoEnum.delivery:
                nuevo_estado = models.EstadoPedidoEnum.entregado
            else:
                nuevo_estado = models.EstadoPedidoEnum.servido
        else:
            raise HTTPException(
                app_logger.warning("El estado no es válido"),
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado '{pedido.estado.value}' no válido o ya está completo"
            )
        
        # Actualizar el pedido
        pedido.estado = nuevo_estado

        # Registrar hora_fin cuando se completa
        if nuevo_estado in [models.EstadoPedidoEnum.entregado, models.EstadoPedidoEnum.servido]:
            if pedido.hora_fin is None:
                pedido.hora_fin = datetime.now()

        if (estado_anterior == models.EstadoPedidoEnum.pendiente and 
            nuevo_estado == models.EstadoPedidoEnum.en_preparacion):
            descontar_insumos_pedido(id, db)
        
        # Actualizar todos los detalles en una sola query (MÁS EFICIENTE)
        detalles_actualizados = db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id == id
        ).update({"estado": nuevo_estado}, synchronize_session=False)
        
        db.commit()
        db.refresh(pedido)
        app_logger.info(f'El pedido físico {id} ha cambiado de estado' )
        return {
            "mensaje": "Estado actualizado correctamente",
            "pedido_id": id,
            "estado_anterior": estado_anterior,
            "estado_nuevo": nuevo_estado,
            "detalles_actualizados": detalles_actualizados
        }
        
    except HTTPException:
        error_logger.error("No se pudo enviar la petición HTTP de cambiar de estado en PedidosF")
        raise
    except Exception as e:
        db.rollback()
        error_logger.error("Error 500 al momento de cambiar de estado de un pedido")
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
            app_logger.warning("Esa mesa no está disponible")
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
        app_logger.info(f'El pedido ha sido {nuevo_pedido.id} registrado correctamente')
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
        error_logger.error("Error en la petición HTTP para agregar un pedido")
        db.rollback()
        raise
    except Exception as e:
        error_logger.error("Error 500 para agregar un pedido")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/editar/{id}")
def modificar_pedido(id: int, pedido_data: schemas.PedidoEditarSolicitud, db: Session = Depends(get_db)):
    try:
        pedido = db.query(models.Pedidos).filter(models.Pedidos.id == id).first()
        if not pedido:
            raise HTTPException(
                app_logger.warning(f'El pedido {pedido.id} no ha sido encontrado'),
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido #{id} no encontrado"
            )
        if not pedido_data.items or len(pedido_data.items) == 0:
            raise HTTPException(
                app_logger.warning(f'El pedido {pedido.id} no tiene un platillo mínimo'),
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
                    app_logger.warning(f'No hay el producto {producto.nombre}'),
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se encontro este producto"
                )
            if item.cantidad < 1:
                raise HTTPException(
                    app_logger.warning(f'La cantidad del producto {producto.nombre} debe ser mayor a 0'),
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La cantidad debe ser mayor a 0"
                )
        
        db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id == id
        ).delete(synchronize_session=False)
        
        db.flush()
        
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
        error_logger.error("Error en la solicitud HTTP para modificar pedido")
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        error_logger.error("Error 500 en la solicitud para modificar el pedido")
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
        app_logger.info("Se muestran todos los pedidos pendientes de pago en delivery")
        return resultado
    except Exception as e:
        error_logger.error("Error al obtener pedidos pendientes de pago en delivery")
        raise HTTPException(status_code=500, detail=str(e))

#  ENDPOINT NUEVO: Obtener pagos completados (solo delivery)
@router.get("/pagos-completados/")
def obtener_pagos_completados(db: Session = Depends(get_db)):
    try:    #  Carga todo con joins anticipados (evita N+1 queries)
        pagos = db.query(models.Pagos).join(
            models.Pedidos
        ).options(
            joinedload(models.Pagos.pedidosP)  # Cargar pedido
            .joinedload(models.Pedidos.PedidosD),  # Cargar info del delivery
            
            joinedload(models.Pagos.pedidosP)  # Vuelve a cargar el pedido
            .joinedload(models.Pedidos.Dpedido)  # Carga  detalles
            .joinedload(models.Detalles_Pedido.platillos)  # Carga los productos
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
        app_logger.info("Se muestra el pedido con pago completado")
        return resultado
    except Exception as e:
        error_logger.error("Se genera un error 500 al momento de mostra pedidos pagados")
        raise HTTPException(status_code=500, detail=str(e))

# ENDPOINT NUEVO: Procesar pago delivery
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
        if pedido.hora_fin is None:
            pedido.hora_fin = datetime.now()

        db.commit()
        db.refresh(nuevo_pago)

        # Obtener información para la respuesta
        delivery_info = db.query(models.Pedidos_Delivery).filter(
            models.Pedidos_Delivery.pedido_id == pedido.id
        ).first()
        app_logger.info(f'El pedido {pedido.id} ha sido pagado exitosamente')
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
        error_logger.error("Existe un error de petición HTTP para procesar pago de delivery")
        db.rollback()
        raise
    except Exception as e:
        error_logger.error("Existe un error 500 para procesar pago de delivery")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 

# ENDPOINT PARA PEDIDOS SERVIDOS LISTOS PARA PAGAR
@router.get("/pedidos-servidos-pago/")
def obtener_pedidos_servidos_para_pago(db: Session = Depends(get_db)):
    """
    Obtener pedidos listos para pagar:
    - Físicos: estado 'servido' 
    - Delivery: estado 'entregado'
    - Que no tengan pago completado
    """
    try:
        # Buscar pedidos servidos/entregados sin pago completado
        pedidos = db.query(models.Pedidos).filter(
            models.Pedidos.estado.in_(["servido", "entregado"]),
            ~models.Pedidos.pagos.any(models.Pagos.estado == "pagado")
        ).options(
            joinedload(models.Pedidos.mesas),
            joinedload(models.Pedidos.Dpedido).joinedload(models.Detalles_Pedido.platillos),
            joinedload(models.Pedidos.PedidosD),
            joinedload(models.Pedidos.pedidosR),
            joinedload(models.Pedidos.pagos)
        ).all()

        resultado = []
        
        for pedido in pedidos:
            # Determinar tipo y obtener datos específicos
            if pedido.tipo_pedido == "mesa":
                # PEDIDO FÍSICO
                tipo = "fisico"
                cliente_nombre = "Cliente en Local"
                cliente_telefono = ""
                direccion = None
                mesa_info = f"Mesa {pedido.mesas.numero}" if pedido.mesas else "Sin mesa"
                
            elif pedido.tipo_pedido == "delivery":
                # PEDIDO DELIVERY
                tipo = "delivery"
                delivery_info = db.query(models.Pedidos_Delivery).filter(
                    models.Pedidos_Delivery.pedido_id == pedido.id
                ).first()
                cliente_nombre = delivery_info.nombre_cliente if delivery_info else "Cliente Delivery"
                cliente_telefono = delivery_info.telefono_cliente if delivery_info else ""
                direccion = delivery_info.direccion_cliente if delivery_info else ""
                mesa_info = None
                
            elif pedido.tipo_pedido == "recojo_local":
                # PEDIDO RECOJO LOCAL
                tipo = "recojo_local"
                recojo_info = db.query(models.PedidosRecojoLocal).filter(
                    models.PedidosRecojoLocal.pedido_id == pedido.id
                ).first()
                cliente_nombre = recojo_info.nombre_cliente if recojo_info else "Cliente Recojo"
                cliente_telefono = recojo_info.telefono_cliente if recojo_info else ""
                direccion = "Recojo en local"
                mesa_info = None
            else:
                continue

            # Obtener items del pedido
            items = []
            for detalle in pedido.Dpedido:
                items.append({
                    "id": detalle.id,
                    "nombre": detalle.platillos.nombre if detalle.platillos else "Producto",
                    "cantidad": detalle.cantidad,
                    "precio_unitario": float(detalle.precio_unitario),
                    "subtotal": float(detalle.precio_unitario * detalle.cantidad)
                })

            # Calcular monto pendiente (por si hay pagos parciales)
            monto_pagado = sum(pago.monto for pago in pedido.pagos if pago.estado == "pagado")
            monto_pendiente = float(pedido.monto_total) - monto_pagado

            pedido_data = {
                "id": pedido.id,
                "tipo": tipo,
                "estado": pedido.estado,
                "monto_total": float(pedido.monto_total),
                "monto_pendiente": monto_pendiente,
                "cliente_nombre": cliente_nombre,
                "cliente_telefono": cliente_telefono,
                "direccion": direccion,
                "mesa": mesa_info,
                "fecha_creacion": pedido.fecha_creacion.isoformat() if pedido.fecha_creacion else None,
                "items": items
            }
            
            resultado.append(pedido_data)

        return {
            "success": True,
            "pedidos": resultado,
            "total": len(resultado)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
