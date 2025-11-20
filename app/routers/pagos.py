# app/routers/pagos.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import requests
import json
import random
import string
from typing import Optional, List
import os
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session

# Importaciones de tu base de datos y modelos
from app.database import get_db
from app.models import Pagos, Pedidos, EstadoPagoEnum, MetodoPagoEnum, EstadoPedidoEnum

router = APIRouter()

# Configuración de Culqi DIRECTAMENTE desde variables de entorno
CULQI_SECRET_KEY = os.getenv("CULQI_SECRET_KEY", "sk_test_UTCQSGcXW8bCyU59")
CULQI_PUBLIC_KEY = os.getenv("CULQI_PUBLIC_KEY", "pk_test_vzMuTHoueOMlbUbG")
CULQI_BASE_URL = "https://api.culqi.com/v2"

print(f"🔑 Culqi Configurado: {CULQI_PUBLIC_KEY[:10]}...")

# Modelos existentes
class QRRequest(BaseModel):
    pedido_id: int

class QRResponse(BaseModel):
    success: bool
    qr_url: Optional[str] = None
    order_id: Optional[str] = None
    payment_code: Optional[str] = None
    message: str

class VerificationResponse(BaseModel):
    success: bool
    verificado: bool
    mensaje: str

# NUEVOS MODELOS PARA LINK DE PAGO
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

class VerificarLinkRequest(BaseModel):
    link_id: str

# NUEVO MODELO PARA REGISTRAR PAGO EN BD
class PagoRequest(BaseModel):
    pedido_id: int
    monto: float
    metodo_pago: str
    referencia_pago: Optional[str] = None

class PagoResponse(BaseModel):
    success: bool
    pago_id: Optional[int] = None
    mensaje: str

# Simulación de base de datos en memoria (solo para links)
links_activos = {}

def make_culqi_request(method, endpoint, data=None):
    """Función segura para hacer requests a Culqi"""
    headers = {
        "Authorization": f"Bearer {CULQI_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    url = f"{CULQI_BASE_URL}/{endpoint}"
    
    try:
        if method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        else:
            raise ValueError("Método no soportado")
            
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error en request a Culqi: {e}")
        return None
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return None

# ========== NUEVOS ENDPOINTS PARA VALIDACIÓN ==========

@router.get("/api/pagos/verificar-pedido/{pedido_id}")
async def verificar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """Verifica si un pedido existe y está disponible para pago"""
    try:
        print(f"🔍 Verificando pedido: {pedido_id}")
        
        pedido = db.query(Pedidos).filter(Pedidos.id == pedido_id).first()
        
        if not pedido:
            return {
                "existe": False,
                "mensaje": f"El pedido {pedido_id} no existe en la base de datos"
            }
        
        # Verificar si ya tiene un pago registrado
        pago_existente = db.query(Pagos).filter(Pagos.pedido_id == pedido_id).first()
        
        if pago_existente:
            return {
                "existe": True,
                "puede_pagar": False,
                "mensaje": f"El pedido {pedido_id} ya tiene un pago registrado",
                "estado_pago": pago_existente.estado.value
            }
        
        return {
            "existe": True,
            "puede_pagar": True,
            "mensaje": "Pedido disponible para pago",
            "pedido": {
                "id": pedido.id,
                "estado": pedido.estado.value,
                "monto_total": float(pedido.monto_total) if pedido.monto_total else 0,
                "tipo": pedido.tipo_pedido.value
            }
        }
        
    except Exception as e:
        print(f"❌ Error verificando pedido: {e}")
        return {
            "existe": False,
            "mensaje": f"Error al verificar pedido: {str(e)}"
        }

@router.get("/api/pagos/pedidos-disponibles")
async def listar_pedidos_disponibles(db: Session = Depends(get_db)):
    """Lista pedidos que pueden ser pagados"""
    try:
        # Pedidos sin pago o con pago fallido
        pedidos = db.query(Pedidos).outerjoin(Pagos).filter(
            (Pagos.id.is_(None)) | (Pagos.estado == EstadoPagoEnum.fallido)
        ).order_by(Pedidos.id.asc()).limit(20).all()
        
        return {
            "success": True,
            "pedidos": [
                {
                    "id": p.id,
                    "tipo": p.tipo_pedido.value,
                    "estado": p.estado.value,
                    "monto_total": float(p.monto_total) if p.monto_total else 0,
                    "mesa": p.mesas.numero if p.mesas else None,
                    "fecha_creacion": p.fecha_creacion.isoformat() if p.fecha_creacion else None
                }
                for p in pedidos
            ]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# ========== NUEVO ENDPOINT - REGISTRAR PAGO EN BD ==========
@router.post("/api/pagos/registrar", response_model=PagoResponse)
async def registrar_pago(
    request: PagoRequest,
    db: Session = Depends(get_db)
):
    """REGISTRA EL PAGO EN LA BASE DE DATOS REAL"""
    try:
        print(f"💰 Registrando pago para pedido: {request.pedido_id}, Monto: S/ {request.monto}")
        
        # 1. Verificar que el pedido existe
        pedido = db.query(Pedidos).filter(Pedidos.id == request.pedido_id).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        # 2. Mapear método de pago string a enum
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
            metodo_pago_enum = MetodoPagoEnum.efectivo  # Por defecto
        
        # 3. Crear el pago en la base de datos
        nuevo_pago = Pagos(
            pedido_id=request.pedido_id,
            monto=request.monto,
            metodo_pago=metodo_pago_enum,
            estado=EstadoPagoEnum.pagado,
            referencia_pago=request.referencia_pago,
            fecha_pago=datetime.now()
        )
        
        db.add(nuevo_pago)
        
        # 4. Actualizar estado del pedido a COMPLETADO
        pedido.estado = EstadoPedidoEnum.completado
        
        db.commit()
        db.refresh(nuevo_pago)
        
        print(f"✅ Pago registrado en BD - ID: {nuevo_pago.id}")
        
        return PagoResponse(
            success=True,
            pago_id=nuevo_pago.id,
            mensaje="Pago registrado exitosamente en la base de datos"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al registrar pago: {e}")
        return PagoResponse(
            success=False,
            mensaje=f"Error al registrar pago: {str(e)}"
        )

# ========== ENDPOINT PARA OBTENER HISTORIAL DE PAGOS ==========
@router.get("/api/pagos/historial")
async def obtener_historial_pagos(db: Session = Depends(get_db)):
    """OBTIENE EL HISTORIAL DE PAGOS DESDE LA BD REAL CON DETALLES COMPLETOS"""
    try:
        pagos = db.query(Pagos).join(Pedidos).order_by(Pagos.fecha_pago.desc()).limit(50).all()
        
        historial = []
        for pago in pagos:
            # Calcular subtotal e IGV correctamente
            monto = float(pago.monto)
            subtotal = monto / 1.18  # Asumiendo 18% de IGV
            tax = monto - subtotal
            
            # Obtener detalles del pedido para mostrar items reales
            pedido = db.query(Pedidos).filter(Pedidos.id == pago.pedido_id).first()
            detalles_pedido = []
            
            if pedido and pedido.Dpedido:
                for detalle in pedido.Dpedido:
                    detalles_pedido.append({
                        "id": detalle.id,
                        "nombre_producto": detalle.platillos.nombre if detalle.platillos else "Producto",
                        "cantidad": detalle.cantidad,
                        "precio_unitario": float(detalle.precio_unitario) if detalle.precio_unitario else 0
                    })
            
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
                "items": detalles_pedido,  # Items reales del pedido
                "discount": 0  # Por defecto, puedes ajustarlo si tienes descuentos
            })
        
        return {
            "success": True,
            "pagos": historial,
            "total": len(historial)
        }
        
    except Exception as e:
        print(f"❌ Error obteniendo historial: {e}")
        return {
            "success": False,
            "pagos": [],
            "mensaje": f"Error al obtener historial: {str(e)}"
        }

# ========== ENDPOINTS EXISTENTES (SIN MODIFICAR) ==========

# NUEVO ENDPOINT - Generar Link de Pago
@router.post("/api/pagos/generar-link", response_model=LinkPagoResponse)
async def generar_link_pago(request: LinkPagoRequest):
    """SIMULACIÓN: Genera link de pago para que cliente pague desde su celular"""
    try:
        print(f"🔗 [SIMULACIÓN] Generando link para pedido: {request.pedido_id}, Monto: S/ {request.monto}")
        
        await asyncio.sleep(1.0)
        
        # Generar datos simulados
        link_id = f"link_{request.pedido_id}_{random.randint(1000, 9999)}"
        payment_url = f"https://demo-pago.culqi.com/pay/{link_id}"
        
        # QR para el link
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={payment_url}&format=png&margin=10"
        
        # Guardar en simulación
        links_activos[link_id] = {
            "pedido_id": request.pedido_id,
            "monto": request.monto,
            "estado": "pendiente",
            "fecha_creacion": datetime.now(),
            "email": request.email_cliente,
            "payment_url": payment_url
        }
        
        print(f"✅ Link generado: {link_id}")
        
        return LinkPagoResponse(
            success=True,
            payment_url=payment_url,
            qr_url=qr_url,
            link_id=link_id,
            mensaje="Link de pago generado - Modo Simulación"
        )
        
    except Exception as e:
        print(f"❌ Error generando link: {e}")
        return LinkPagoResponse(
            success=False,
            mensaje=f"Error generando link: {str(e)}"
        )

# NUEVO ENDPOINT - Verificar Estado del Link
@router.post("/api/pagos/verificar-link", response_model=VerificationResponse)
async def verificar_link_pago(request: VerificarLinkRequest):
    """SIMULACIÓN: Verifica si el link de pago fue pagado"""
    try:
        print(f"🔍 Verificando link: {request.link_id}")
        
        await asyncio.sleep(1.0)
        
        # Buscar link en simulación
        link_data = links_activos.get(request.link_id)
        
        if not link_data:
            return VerificationResponse(
                success=False,
                verificado=False,
                mensaje="Link de pago no encontrado"
            )
        
        # SIMULAR: 70% de probabilidad de que ya pagó después de 10 segundos
        tiempo_creacion = link_data["fecha_creacion"]
        tiempo_actual = datetime.now()
        diferencia_segundos = (tiempo_actual - tiempo_creacion).total_seconds()
        
        if diferencia_segundos > 10 and random.random() < 0.7:
            link_data["estado"] = "pagado"
            mensaje = "✅ Pago confirmado - Cliente pagó exitosamente"
            verificado = True
        else:
            mensaje = "⏳ Esperando pago del cliente..."
            verificado = False
        
        return VerificationResponse(
            success=True,
            verificado=verificado,
            mensaje=mensaje
        )
        
    except Exception as e:
        print(f"❌ Error verificando link: {e}")
        return VerificationResponse(
            success=False,
            verificado=False,
            mensaje=f"Error en verificación: {str(e)}"
        )

# Endpoints existentes (los mantienes igual)
@router.post("/api/pagos/crear-qr", response_model=QRResponse)
async def crear_qr(request: QRRequest):
    try:
        print(f"🎯 Generando QR para pedido: {request.pedido_id}")
        
        # ... (código existente igual)
        order_id = f"order_{request.pedido_id}_{random.randint(1000, 9999)}"
        payment_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CULQI-PEDIDO-{request.pedido_id}-CODIGO-{payment_code}"
        
        return QRResponse(
            success=True,
            qr_url=qr_url,
            order_id=order_id,
            payment_code=payment_code,
            message="QR generado (Modo Demo)"
        )
        
    except Exception as e:
        print(f"❌ Error crítico en crear_qr: {e}")
        return QRResponse(
            success=False,
            message=f"Error generando QR: {str(e)}"
        )

@router.post("/api/pagos/verificar-orden-culqi/{order_id}", response_model=VerificationResponse)
async def verificar_orden_culqi(order_id: str):
    try:
        print(f"🔍 Verificando orden: {order_id}")
        
        # ... (código existente igual)
        verificado = random.random() > 0.2
        
        return VerificationResponse(
            success=True,
            verificado=verificado,
            mensaje="Pago verificado exitosamente (Modo Demo)" if verificado else "Pago aún no confirmado (Modo Demo)"
        )
        
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
        return VerificationResponse(
            success=False,
            verificado=False,
            mensaje=f"Error en verificación: {str(e)}"
        )

# Endpoint de salud
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "pagos",
        "links_activos": len(links_activos)
    }
