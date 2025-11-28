from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_
from datetime import datetime, timedelta
from typing import List, Optional
from app.database import get_db
from app import models
from logging_config import setup_loggers
import logging
setup_loggers()
app_logger = logging.getLogger("app_logger")
error_logger = logging.getLogger("error_logger")
router = APIRouter(prefix="/api/metricas", tags=["métricas"])

@router.get("/ticket-promedio")
def obtener_ticket_promedio(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Calcula el ticket promedio (monto total promedio) de los pedidos completados
    """
    try:
        # Construir filtro base para pedidos completados
        filtro_base = and_(
            or_(
                # Delivery completado
                and_(
                    models.Pedidos.tipo_pedido == models.TipoPedidoEnum.delivery,
                    models.Pedidos.estado == models.EstadoPedidoEnum.entregado
                ),
                # Mesa completada
                and_(
                    models.Pedidos.tipo_pedido == models.TipoPedidoEnum.mesa,
                    models.Pedidos.estado == models.EstadoPedidoEnum.servido
                ),
                # Recojo local completado
                and_(
                    models.Pedidos.tipo_pedido == models.TipoPedidoEnum.recojo_local,
                    models.Pedidos.estado == models.EstadoPedidoEnum.entregado
                )
            )
        )
        
        # Aplicar filtros de fecha si se proporcionan
        if fecha_inicio and fecha_fin:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d")
            filtro_base = and_(
                filtro_base,
                models.Pedidos.fecha_creacion >= fecha_inicio_dt,
                models.Pedidos.fecha_creacion <= fecha_fin_dt
            )
        
        # Calcular ticket promedio
        resultado = db.query(
            func.avg(models.Pedidos.monto_total).label('ticket_promedio'),
            func.count(models.Pedidos.id).label('total_pedidos')
        ).filter(filtro_base).first()
        app_logger.info("Se obtuvo ticket promedio correctamente")
        ticket_promedio = float(resultado.ticket_promedio) if resultado.ticket_promedio else 0.0
        total_pedidos = resultado.total_pedidos if resultado.total_pedidos else 0
        return {
            "ticket_promedio": round(ticket_promedio, 2),
            "total_pedidos": total_pedidos,
            "periodo": {
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin
            }
        }
    except Exception as e:
        error_logger.error("Error al calcular el ticket promedio")
        raise HTTPException(status_code=500, detail=f"Error calculando ticket promedio: {str(e)}")

@router.get("/tiempo-promedio")
def obtener_tiempo_promedio(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Calcula el tiempo promedio de preparación de pedidos completados
    """
    try:
        # Construir filtro base para pedidos completados CON hora_fin
        filtro_base = and_(
            or_(
                # Delivery completado
                and_(
                    models.Pedidos.tipo_pedido == models.TipoPedidoEnum.delivery,
                    models.Pedidos.estado == models.EstadoPedidoEnum.entregado
                ),
                # Mesa completada
                and_(
                    models.Pedidos.tipo_pedido == models.TipoPedidoEnum.mesa,
                    models.Pedidos.estado == models.EstadoPedidoEnum.servido
                ),
                # Recojo local completado
                and_(
                    models.Pedidos.tipo_pedido == models.TipoPedidoEnum.recojo_local,
                    models.Pedidos.estado == models.EstadoPedidoEnum.entregado
                )
            ),
            models.Pedidos.hora_fin.isnot(None),
            models.Pedidos.hora_inicio.isnot(None)
        )
        
        # Aplicar filtros de fecha si se proporcionan
        if fecha_inicio and fecha_fin:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d")
            filtro_base = and_(
                filtro_base,
                models.Pedidos.fecha_creacion >= fecha_inicio_dt,
                models.Pedidos.fecha_creacion <= fecha_fin_dt
            )
        
        # Obtener pedidos completados
        pedidos = db.query(models.Pedidos).filter(filtro_base).all()
        
        print(f"🔍 DEBUG: {len(pedidos)} pedidos con horas registradas")
        
        if not pedidos:
            app_logger.info("No hay pedidos con las horas establecidas")
            return {
                "tiempo_promedio": 0,
                "total_pedidos": 0,
                "pedidos_con_tiempo_valido": 0,
                "debug_info": "No hay pedidos con horas de inicio y fin registradas",
                "periodo": {
                    "fecha_inicio": fecha_inicio,
                    "fecha_fin": fecha_fin
                }
            }
        
        # CALCULAR CON FILTROS MÁS FLEXIBLES
        tiempos = []
        debug_info = {
            "total_pedidos": len(pedidos),
            "sin_horas": 0,
            "orden_incorrecto": 0,
            "fuera_rango": 0,
            "validos": 0
        }
        
        for pedido in pedidos:
            if pedido.hora_inicio and pedido.hora_fin:
                duracion_minutos = (pedido.hora_fin - pedido.hora_inicio).total_seconds() / 60
                
                print(f"📦 Pedido {pedido.id}: {duracion_minutos:.1f} min")
                
                # FILTROS MÁS FLEXIBLES:
                orden_correcto = pedido.hora_fin > pedido.hora_inicio
                tiempo_valido = 1 <= duracion_minutos <= 480  # 1 min a 8 horas
                
                if not orden_correcto:
                    debug_info["orden_incorrecto"] += 1
                    continue
                    
                if not tiempo_valido:
                    debug_info["fuera_rango"] += 1
                    continue
                
                # PEDIDO VÁLIDO
                debug_info["validos"] += 1
                tiempos.append(duracion_minutos)
        
        # Calcular promedio
        tiempo_promedio = sum(tiempos) / len(tiempos) if tiempos else 0
        
        print(f"📊 RESULTADO: {debug_info['validos']} pedidos válidos, Promedio: {tiempo_promedio:.1f} min")
        
        return {
            "tiempo_promedio": round(tiempo_promedio, 1),
            "total_pedidos": len(pedidos),
            "pedidos_con_tiempo_valido": len(tiempos),
            "debug_info": debug_info,
            "periodo": {
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin
            }
        }
        
    except Exception as e:
        print(f"🚨 ERROR en tiempo-promedio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculando tiempo promedio: {str(e)}")

@router.get("/ventas-mensuales")
def obtener_ventas_mensuales(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Obtiene las ventas mensuales desde PAGOS REALES
    """
    try:
        # FILTRAR SOLO PAGOS CONFIRMADOS
        filtro_base = models.Pagos.estado == models.EstadoPagoEnum.pagado
        
        # Aplicar filtros de fecha si se proporcionan
        if fecha_inicio and fecha_fin:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            fecha_fin_dt = datetime.strptime(fecha_fin, "%Y-%m-%d")
            filtro_base = and_(
                filtro_base,
                models.Pagos.fecha_pago >= fecha_inicio_dt,
                models.Pagos.fecha_pago <= fecha_fin_dt
            )
        else:
            # Por defecto, último año
            fecha_fin_dt = datetime.now()
            fecha_inicio_dt = fecha_fin_dt - timedelta(days=365)
            filtro_base = and_(
                filtro_base,
                models.Pagos.fecha_pago >= fecha_inicio_dt,
                models.Pagos.fecha_pago <= fecha_fin_dt
            )
        
        # CONSULTA CORREGIDA - desde PAGOS REALES
        ventas_mensuales = db.query(
            extract('month', models.Pagos.fecha_pago).label('mes_numero'),
            func.sum(models.Pagos.monto).label('ventas'),
            func.count(models.Pagos.id).label('cantidad_pedidos')
        ).filter(
            filtro_base
        ).group_by(
            extract('month', models.Pagos.fecha_pago)
        ).order_by(
            extract('month', models.Pagos.fecha_pago)
        ).all()
        
        # Mapear números de mes a nombres
        meses = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
            5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
            9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        }
        resultado = []
        for venta in ventas_mensuales:
            resultado.append({
                "mes": meses.get(int(venta.mes_numero), f"Mes {int(venta.mes_numero)}"),
                "ventas": float(venta.ventas) if venta.ventas else 0.0,
                "cantidad_pedidos": venta.cantidad_pedidos
            })
        # Verificar cuántos pagos encontró
        total_pagos = sum(item['cantidad_pedidos'] for item in resultado)
        print(f"📊 PAGOS ENCONTRADOS EN MÉTRICAS: {total_pagos}")
        app_logger.info("Se obtuvieron los datos de las ventas mensuales")
        return resultado
        
    except Exception as e:
        error_logger.errors("Error en obtener las ventas mensuales")
        raise HTTPException(status_code=500, detail=f"Error obteniendo ventas mensuales: {str(e)}")

@router.get("/todas")
def obtener_todas_metricas(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las métricas en una sola llamada
    """
    try:
        # Reutilizar las funciones existentes
        ticket_data = obtener_ticket_promedio(fecha_inicio, fecha_fin, db)
        tiempo_data = obtener_tiempo_promedio(fecha_inicio, fecha_fin, db)
        ventas_data = obtener_ventas_mensuales(fecha_inicio, fecha_fin, db)
        app_logger.info("Se obtuvieron todas las métricas")
        return {
            "ticket_promedio": ticket_data,
            "tiempo_promedio": tiempo_data,
            "ventas_mensuales": ventas_data
        }
    except Exception as e:
        error_logger.error("Error al obtener todas las métricas")
        raise HTTPException(status_code=500, detail=f"Error obteniendo todas las métricas: {str(e)}")

@router.get("/top5-platillos-mensual")
def obtener_top5_platillos_mensual(
    mes: Optional[str] = Query(None, description="Mes específico (ej: 'Enero', 'Febrero')"),
    año: Optional[int] = Query(None, description="Año específico"),
    db: Session = Depends(get_db)
):
    """
    Obtiene los 5 platillos más vendidos por mes con filtro opcional
    """
    try:
        # Mapeo de nombres de mes a números
        meses_nombre_a_numero = {
            'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
            'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
            'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
        }
        
        # Determinar el año (actual por defecto)
        año_actual = año or datetime.now().year
        
        # Construir consulta base
        query = db.query(
            extract('year', models.Pedidos.fecha_creacion).label('año'),
            extract('month', models.Pedidos.fecha_creacion).label('mes_numero'),
            models.Detalles_Pedido.producto_id,
            models.Platillo.nombre.label('nombre_platillo'),
            func.sum(models.Detalles_Pedido.cantidad).label('total_vendido'),
            func.count(models.Detalles_Pedido.id).label('veces_pedido')
        ).join(
            models.Detalles_Pedido, models.Detalles_Pedido.pedido_id == models.Pedidos.id
        ).join(
            models.Platillo, models.Platillo.id == models.Detalles_Pedido.producto_id
        ).filter(
            extract('year', models.Pedidos.fecha_creacion) == año_actual,
            models.Pedidos.estado.in_([
                models.EstadoPedidoEnum.servido,
                models.EstadoPedidoEnum.entregado,
                models.EstadoPedidoEnum.completado
            ])
        )

        # Aplicar filtro por mes si se proporciona
        if mes:
            mes_lower = mes.lower()
            if mes_lower in meses_nombre_a_numero:
                mes_numero = meses_nombre_a_numero[mes_lower]
                query = query.filter(extract('month', models.Pedidos.fecha_creacion) == mes_numero)
                print(f"🔍 Filtrando por mes: {mes} (número: {mes_numero})")
            else:
                app_logger.warning(f'El mes {mes} no es válido')
                raise HTTPException(status_code=400, detail=f"Mes '{mes}' no válido")

        # Ejecutar consulta
        resultados = query.group_by(
            extract('year', models.Pedidos.fecha_creacion),
            extract('month', models.Pedidos.fecha_creacion),
            models.Detalles_Pedido.producto_id,
            models.Platillo.nombre
        ).order_by(
            extract('year', models.Pedidos.fecha_creacion),
            extract('month', models.Pedidos.fecha_creacion),
            func.sum(models.Detalles_Pedido.cantidad).desc()
        ).all()

        # Procesar resultados y agrupar por mes
        meses = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
            5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto', 
            9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        }

        # Estructurar datos por mes
        datos_por_mes = {}
        for resultado in resultados:
            mes_key = f"{int(resultado.año)}-{int(resultado.mes_numero)}"
            
            if mes_key not in datos_por_mes:
                datos_por_mes[mes_key] = {
                    "año": int(resultado.año),
                    "mes_numero": int(resultado.mes_numero),
                    "mes_nombre": meses.get(int(resultado.mes_numero), f"Mes {int(resultado.mes_numero)}"),
                    "platillos": []
                }
            
            # Solo agregar si es de los top 5 del mes
            if len(datos_por_mes[mes_key]["platillos"]) < 5:
                datos_por_mes[mes_key]["platillos"].append({
                    "producto_id": resultado.producto_id,
                    "nombre": resultado.nombre_platillo,
                    "total_vendido": int(resultado.total_vendido),
                    "veces_pedido": resultado.veces_pedido
                })

        # Convertir a lista ordenada
        resultado_final = sorted(
            datos_por_mes.values(),
            key=lambda x: (x["año"], x["mes_numero"]),
            reverse=True
        )

        print(f"📊 Encontrados {len(resultado_final)} meses con datos")
        if mes:
            print(f" Filtrado aplicado para: {mes}")
        app_logger.info("Se obtuvieron los 5 platillos más vendidos del mes")
        return {
            "año_analizado": año_actual,
            "mes_filtrado": mes,
            "periodo": {
                "fecha_inicio": datetime(año_actual, 1, 1).strftime("%Y-%m-%d"),
                "fecha_fin": datetime.now().strftime("%Y-%m-%d")
            },
            "top_platillos_por_mes": resultado_final
        }

    except HTTPException:
        error_logger.error("Error de petición HTTP para obtener los pedidos")
        raise
    except Exception as e:
        print(f"🚨 ERROR en top5-platillos-mensual: {str(e)}")
        error_logger.error("Error 500 para obtener los 5 platillos del mes")
        raise HTTPException(
            status_code=500, 
            detail=f"Error calculando top 5 platillos mensual: {str(e)}"
        )
