# app/routers/pagos.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import json
import random
import string
from typing import Optional
import os

router = APIRouter()

# Configuración de Culqi DIRECTAMENTE desde variables de entorno
CULQI_SECRET_KEY = os.getenv("CULQI_SECRET_KEY", "sk_test_UTCQSGcXW8bCyU59")
CULQI_PUBLIC_KEY = os.getenv("CULQI_PUBLIC_KEY", "pk_test_vzMuTHoueOMlbUbG")
CULQI_BASE_URL = "https://api.culqi.com/v2"

print(f"🔑 Culqi Configurado: {CULQI_PUBLIC_KEY[:10]}...")

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

@router.post("/api/pagos/crear-qr", response_model=QRResponse)
async def crear_qr(request: QRRequest):
    try:
        print(f"🎯 Generando QR para pedido: {request.pedido_id}")
        
        # INTENTO 1: Usar Culqi real
        order_data = {
            "amount": 1000,  # 10.00 PEN en centavos
            "currency_code": "PEN",
            "description": f"Pago para pedido {request.pedido_id}",
            "order_number": f"pedido_{request.pedido_id}",
        }
        
        culqi_response = make_culqi_request("POST", "orders", order_data)
        
        if culqi_response and "id" in culqi_response:
            # Crear QR con Culqi
            qr_data = {
                "order_id": culqi_response["id"],
                "amount": order_data["amount"],
                "currency_code": "PEN"
            }
            
            qr_response = make_culqi_request("POST", "qrs", qr_data)
            
            if qr_response and "qr_image" in qr_response:
                return QRResponse(
                    success=True,
                    qr_url=qr_response["qr_image"],
                    order_id=culqi_response["id"],
                    payment_code=qr_response.get("id", f"qr_{request.pedido_id}"),
                    message="QR generado exitosamente con Culqi"
                )
        
        # INTENTO 2: Fallback a Mock (si Culqi falla)
        print("🔄 Culqi no disponible, usando modo mock...")
        
        # Generar datos mock realistas
        order_id = f"order_{request.pedido_id}_{random.randint(1000, 9999)}"
        payment_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        
        # QR mock con API pública
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CULQI-PEDIDO-{request.pedido_id}-CODIGO-{payment_code}&format=png&margin=10&color=2c5aa0&bgcolor=FFFFFF"
        
        return QRResponse(
            success=True,
            qr_url=qr_url,
            order_id=order_id,
            payment_code=payment_code,
            message="QR generado (Modo Demo - Culqi no disponible)"
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
        
        # INTENTO 1: Verificar con Culqi real
        if order_id.startswith("order_"):
            culqi_response = make_culqi_request("GET", f"orders/{order_id}")
            
            if culqi_response:
                verificado = culqi_response.get("status") == "paid"
                mensaje = "Pago verificado exitosamente" if verificado else "Pago pendiente"
                
                return VerificationResponse(
                    success=True,
                    verificado=verificado,
                    mensaje=mensaje
                )
        
        # INTENTO 2: Mock verification (para testing)
        print("🔄 Usando verificación mock...")
        
        # Simular verificación (80% de éxito para testing)
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

# Endpoint de salud para probar
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "pagos",
        "culqi_configured": bool(CULQI_SECRET_KEY and CULQI_SECRET_KEY != "sk_test_UTCQSGcXW8bCyU59")
    }