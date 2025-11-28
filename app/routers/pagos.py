# app/routers/pagos.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import requests
import random
from typing import Optional, List
import os
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Pagos, Pedidos, EstadoPagoEnum, MetodoPagoEnum, EstadoPedidoEnum
from logging_config import setup_loggers
import logging
setup_loggers()
app_logger = logging.getLogger("app_logger")
error_logger = logging.getLogger("error_logger")
router = APIRouter()
# Configuración
CULQI_SECRET_KEY = os.getenv("CULQI_SECRET_KEY", "sk_test_UTCQSGcXW8bCyU59")
CULQI_BASE_URL = "https://api.culqi.com/v2"

# Modelos esenciales
class LinkPagoRequest(BaseModel):
    pedido_id: int
    monto: float
    email_cliente: str = "cliente@restaurante.com"

class LinkPagoResponse(BaseModel):
    success: bool
    payment_url: Optional[str] = None
    qr_url: Optional[str] = None
    link_id: Optional[str] = None
    mensaje: str

class PagoRequest(BaseModel):
    pedido_id: int
    monto: float
    metodo_pago: str
    referencia_pago: Optional[str] = None

class PagoResponse(BaseModel):
    success: bool
    pago_id: Optional[int] = None
    mensaje: str

# Simulación de links
links_activos = {}

# ========== ENDPOINTS ESENCIALES ==========

@router.post("/api/pagos/registrar", response_model=PagoResponse)
async def registrar_pago(request: PagoRequest, db: Session = Depends(get_db)):
    """REGISTRA EL PAGO EN LA BASE DE DATOS"""
    try:
        print(f"💰 Registrando pago para pedido: {request.pedido_id}")
        
        # Verificar pedido
        pedido = db.query(Pedidos).filter(Pedidos.id == request.pedido_id).first()
        if not pedido:
            app_logger.warning("No se han logrado registrar este pago")
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        # Mapear método de pago
        metodo_pago_enum = None
        if request.metodo_pago.lower() == "efectivo":
            metodo_pago_enum = MetodoPagoEnum.efectivo
        elif request.metodo_pago.lower() == "tarjeta":
            metodo_pago_enum = MetodoPagoEnum.tarjeta
        elif request.metodo_pago.lower() == "yape":
            metodo_pago_enum = MetodoPagoEnum.yape
        elif request.metodo_pago.lower() == "plin":
            metodo_pago_enum = MetodoPagoEnum.plin
        else:
            metodo_pago_enum = MetodoPagoEnum.efectivo
        
        # Crear pago
        nuevo_pago = Pagos(
            pedido_id=request.pedido_id,
            monto=request.monto,
            metodo_pago=metodo_pago_enum,
            estado=EstadoPagoEnum.pagado,
            referencia_pago=request.referencia_pago,
            fecha_pago=datetime.now()
        )
        
        db.add(nuevo_pago)
        pedido.estado = EstadoPedidoEnum.completado
        db.commit()
        db.refresh(nuevo_pago)
        app_logger.info("Pago registrado exitosamente")
        return PagoResponse(
            success=True,
            pago_id=nuevo_pago.id,
            mensaje="Pago registrado exitosamente"
        )
        
    except HTTPException:
        error_logger.error("Error de solicitud HTTP para el registro de pagos")
        raise
    except Exception as e:
        error_logger.error("Error 500 al momento de registrar el pago")
        db.rollback()
        return PagoResponse(
            success=False,
            mensaje=f"Error al registrar pago: {str(e)}"
        )

@router.get("/api/pagos/historial")
async def obtener_historial_pagos(db: Session = Depends(get_db)):
    """OBTIENE EL HISTORIAL DE PAGOS"""
    try:
        pagos = db.query(Pagos).join(Pedidos).order_by(Pagos.fecha_pago.desc()).limit(50).all()
        
        historial = []
        for pago in pagos:
            monto = float(pago.monto)
            subtotal = monto / 1.18
            tax = monto - subtotal
            
            historial.append({
                "id": pago.id,
                "pedido_id": pago.pedido_id,
                "orderId": f"PED-{pago.pedido_id}",
                "monto": monto,
                "subtotal": round(subtotal, 2),
                "tax": round(tax, 2),
                "metodo_pago": pago.metodo_pago.value,
                "estado": pago.estado.value,
                "fecha_pago": pago.fecha_pago.isoformat() if pago.fecha_pago else None,
                "referencia_pago": pago.referencia_pago,
                "discount": 0
            })
        app_logger.info("Se ha obtenido todo el historial de pago")
        return {
            "success": True,
            "pagos": historial,
            "total": len(historial)
        }
        
    except Exception as e:
        error_logger.error("No se pudo obtenrer el historial de pagos")
        return {
            "success": False,
            "pagos": [],
            "mensaje": f"Error al obtener historial: {str(e)}"
        }

@router.post("/api/pagos/generar-link", response_model=LinkPagoResponse)
async def generar_link_pago(request: LinkPagoRequest):
    """Genera link de pago para pagos digitales"""
    try:
        print(f" Generando link para pedido: {request.pedido_id}")
        await asyncio.sleep(1.0)
        # Simulación de link
        link_id = f"link_{request.pedido_id}_{random.randint(1000, 9999)}"
        payment_url = f"https://demo-pago.culqi.com/pay/{link_id}"
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={payment_url}"
        
        links_activos[link_id] = {
            "pedido_id": request.pedido_id,
            "monto": request.monto,
            "estado": "pendiente",
            "fecha_creacion": datetime.now()
        }
        app_logger.info("Se generó el pago de forma correcta")
        return LinkPagoResponse(
            success=True,
            payment_url=payment_url,
            qr_url=qr_url,
            link_id=link_id,
            mensaje="Link de pago generado"
        )
        
    except Exception as e:
        error_logger.error("No se pudo generar el link de pago")
        return LinkPagoResponse(
            success=False,
            mensaje=f"Error generando link: {str(e)}"
        )
# Endpoint de salud
@router.get("/healthP")
async def health_check():
    culqi_key = os.getenv('CULQI_SECRET_KEY')
    culqi_configured = bool(culqi_key)
    # Información de links de pago
    links_info = {
        "activos": len(links_activos),
    }
    # Status general
    all_checks_passed = culqi_configured
    return {
        "status": "healthy" if all_checks_passed else "degraded",
        "service": "pagos",
        "checks": {
            "culqi": {
                "status": "healthy" if culqi_configured else "unhealthy",
                "configured": culqi_configured,
                "provider": "Culqi"
            },
            "payment_links": {
                "status": "healthy",
                "links_activos": links_info["activos"]
            }
        },
        "metadata": {
            "module": "pagos",
            "version": "1.0.0"
        }
    }