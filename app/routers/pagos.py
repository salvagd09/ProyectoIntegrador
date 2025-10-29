# app/routers/pagos.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import json
import random
import string
from typing import Optional
import os
import asyncio
from datetime import datetime

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

# Simulación de base de datos en memoria
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
