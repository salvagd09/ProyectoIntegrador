from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import culqi
import qrcode
from io import BytesIO
import base64
import logging

from .. import models, database, schemas
from ..config import CULQI_SECRET_KEY, CULQI_PUBLIC_KEY

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pagos", tags=["Pagos"])

# Configurar Culqi
culqi.api_key = CULQI_SECRET_KEY

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== ESQUEMAS PYDANTIC ====================
from pydantic import BaseModel, EmailStr

class PagoTarjetaRequest(BaseModel):
    pedido_id: int
    token_culqi: str
    email: EmailStr

class PagoTarjetaResponse(BaseModel):
    success: bool
    mensaje: str
    cargo_id: Optional[str] = None
    pedido_id: int
    monto: float

class CrearQrRequest(BaseModel):
    pedido_id: int

class CrearQrResponse(BaseModel):
    success: bool
    qr_url: str
    pedido_id: int
    monto: float
    mensaje: str

class EstadoPagoResponse(BaseModel):
    pedido_id: int
    monto: float
    metodo_pago: Optional[str]
    estado: str
    fecha_pago: Optional[str]
    referencia_pago: Optional[str]

class ProcesarOtrosRequest(BaseModel):
    pedido_id: int
    metodo_pago: str
    referencia: Optional[str] = None

class ProcesarOtrosResponse(BaseModel):
    success: bool
    mensaje: str
    pedido_id: int
    monto: float

# ==================== ENDPOINTS ====================

@router.get("/culqi-public-key")
def obtener_clave_publica():
    """Devuelve la clave pública de Culqi para usar en el frontend"""
    logger.info("Solicitando clave pública de Culqi")
    return {"public_key": CULQI_PUBLIC_KEY}


@router.post("/procesar-tarjeta", response_model=PagoTarjetaResponse)
def procesar_pago_tarjeta(
    pago_data: PagoTarjetaRequest,
    db: Session = Depends(get_db)
):
    """
    Procesa un pago con tarjeta usando Culqi
    """
    try:
        logger.info(f"Iniciando procesamiento de pago para pedido {pago_data.pedido_id}")
        
        # 1. Buscar el pedido
        pedido = db.query(models.Pedidos).filter(
            models.Pedidos.id == pago_data.pedido_id
        ).first()
        
        if not pedido:
            logger.warning(f"Pedido {pago_data.pedido_id} no encontrado")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado"
            )
        
        # 2. Verificar que el pedido no esté ya pagado
        pago_existente = db.query(models.Pagos).filter(
            models.Pagos.pedido_id == pago_data.pedido_id,
            models.Pagos.estado == "Pagado"
        ).first()
        
        if pago_existente:
            logger.warning(f"Pedido {pago_data.pedido_id} ya está pagado")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este pedido ya fue pagado"
            )
        
        # 3. Calcular monto en centavos (Culqi trabaja con centavos)
        monto_soles = float(pedido.monto_total)
        monto_centavos = int(monto_soles * 100)
        
        logger.info(f"Procesando cargo en Culqi: {monto_soles} soles ({monto_centavos} centavos)")
        
        # 4. Crear cargo en Culqi
        cargo = culqi.Charge.create(
            amount=monto_centavos,
            currency_code="PEN",
            email=pago_data.email,
            source_id=pago_data.token_culqi,
            description=f"Pedido #{pedido.id} - Cevichería GestaFood",
            metadata={
                "pedido_id": str(pedido.id),
                "tipo_pedido": pedido.tipo_pedido,
                "mesa_id": str(pedido.mesa_id) if pedido.mesa_id else "N/A"
            }
        )
        
        # 5. Verificar si el pago fue exitoso
        if cargo.get("object") == "charge" and cargo.get("outcome", {}).get("type") == "venta_exitosa":
            logger.info(f"Pago exitoso para pedido {pago_data.pedido_id}. Cargo ID: {cargo.get('id')}")
            
            # Crear o actualizar registro de pago
            pago = db.query(models.Pagos).filter(
                models.Pagos.pedido_id == pago_data.pedido_id
            ).first()
            
            if not pago:
                # Crear nuevo pago
                pago = models.Pagos(
                    pedido_id=pedido.id,
                    monto=monto_soles,
                    metodo_pago="Tarjeta",
                    estado="Pagado",
                    fecha_pago=datetime.now(),
                    referencia_pago=cargo.get("id")
                )
                db.add(pago)
            else:
                # Actualizar pago existente
                pago.estado = "Pagado"
                pago.metodo_pago = "Tarjeta"
                pago.fecha_pago = datetime.now()
                pago.referencia_pago = cargo.get("id")
            
            # Actualizar estado del pedido si está pendiente
            if pedido.estado == "Pendiente":
                pedido.estado = "En preparacion"
            
            db.commit()
            db.refresh(pago)
            
            return {
                "success": True,
                "mensaje": "Pago procesado exitosamente con tarjeta",
                "cargo_id": cargo.get("id"),
                "pedido_id": pedido.id,
                "monto": monto_soles
            }
        else:
            # Pago rechazado
            mensaje_error = cargo.get('outcome', {}).get('user_message', 'Error desconocido')
            logger.error(f"Pago rechazado para pedido {pago_data.pedido_id}: {mensaje_error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Pago rechazado: {mensaje_error}"
            )
            
    except culqi.error.InvalidRequestError as e:
        db.rollback()
        logger.error(f"Error en solicitud a Culqi: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error en la solicitud a Culqi: {str(e)}"
        )
    except culqi.error.AuthenticationError as e:
        db.rollback()
        logger.error(f"Error de autenticación con Culqi: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error de autenticación con Culqi. Verifica tus credenciales."
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error inesperado al procesar pago: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar pago: {str(e)}"
        )


@router.get("/estado/{pedido_id}", response_model=EstadoPagoResponse)
def consultar_estado_pago(pedido_id: int, db: Session = Depends(get_db)):
    """Consulta el estado del pago de un pedido"""
    logger.info(f"Consultando estado de pago para pedido {pedido_id}")
    
    pago = db.query(models.Pagos).filter(
        models.Pagos.pedido_id == pedido_id
    ).first()
    
    if not pago:
        logger.warning(f"No se encontró pago para pedido {pedido_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró información de pago para este pedido"
        )
    
    return {
        "pedido_id": pedido_id,
        "monto": float(pago.monto),
        "metodo_pago": pago.metodo_pago,
        "estado": pago.estado,
        "fecha_pago": pago.fecha_pago.isoformat() if pago.fecha_pago else None,
        "referencia_pago": pago.referencia_pago
    }


@router.post("/procesar-otros", response_model=ProcesarOtrosResponse)
def procesar_otros_metodos(
    request: ProcesarOtrosRequest,
    db: Session = Depends(get_db)
):
    """
    Procesa pagos con métodos diferentes a tarjeta (Efectivo, Yape, Plin)
    """
    try:
        logger.info(f"Procesando pago con {request.metodo_pago} para pedido {request.pedido_id}")
        
        # Validar método de pago
        metodos_validos = ["Efectivo", "Yape", "Plin"]
        if request.metodo_pago not in metodos_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Método de pago inválido. Use: {', '.join(metodos_validos)}"
            )
        
        # Validar referencia para métodos digitales
        if request.metodo_pago in ["Yape", "Plin"] and not request.referencia:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La referencia es obligatoria para pagos con {request.metodo_pago}"
            )
        
        # Buscar pedido
        pedido = db.query(models.Pedidos).filter(
            models.Pedidos.id == request.pedido_id
        ).first()
        
        if not pedido:
            logger.warning(f"Pedido {request.pedido_id} no encontrado")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado"
            )
        
        # Verificar que no esté ya pagado
        pago_existente = db.query(models.Pagos).filter(
            models.Pagos.pedido_id == request.pedido_id,
            models.Pagos.estado == "Pagado"
        ).first()
        
        if pago_existente:
            logger.warning(f"Pedido {request.pedido_id} ya está pagado")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este pedido ya fue pagado"
            )
        
        # Crear o actualizar pago
        pago = db.query(models.Pagos).filter(
            models.Pagos.pedido_id == request.pedido_id
        ).first()
        
        if not pago:
            pago = models.Pagos(
                pedido_id=pedido.id,
                monto=float(pedido.monto_total),
                metodo_pago=request.metodo_pago,
                estado="Pagado",
                fecha_pago=datetime.now(),
                referencia_pago=request.referencia
            )
            db.add(pago)
        else:
            pago.estado = "Pagado"
            pago.metodo_pago = request.metodo_pago
            pago.fecha_pago = datetime.now()
            pago.referencia_pago = request.referencia
        
        # Actualizar estado del pedido
        if pedido.estado == "Pendiente":
            pedido.estado = "En preparacion"
        
        db.commit()
        db.refresh(pago)
        
        logger.info(f"Pago procesado exitosamente: {request.metodo_pago} - Pedido {request.pedido_id}")
        
        return {
            "success": True,
            "mensaje": f"Pago registrado con {request.metodo_pago}",
            "pedido_id": pedido.id,
            "monto": float(pago.monto)
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error al procesar pago: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar pago: {str(e)}"
        )


@router.post("/crear-qr")
def crear_pago_qr(request: CrearQrRequest):
    """
    Genera un código QR para pagos - Tamaño optimizado
    """
    try:
        import qrcode
        import io
        import base64
        
        pedido_id = request.pedido_id
        monto_soles = 50.0
        
        # Data del QR - ASCII puro, sin tildes
        qr_data = f"https://pay.culqi.com/p{pedido_id}m{int(monto_soles*100)}"
        
        # Crear QR con tamaño más pequeño
        qr = qrcode.QRCode(
            version=1,          # Versión más pequeña
            box_size=6,         # ← CAMBIADO de 10 a 6 (más pequeño)
            border=2            # ← CAMBIADO de 4 a 2 (menos borde)
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Crear imagen
        img = qr.make_image(fill='black', back_color='white')
        
        # Guardar en memoria
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Codificar a base64
        img_str = base64.b64encode(buffer.read()).decode('ascii')
        
        return {
            "success": True,
            "qr_url": f"data:image/png;base64,{img_str}",
            "pedido_id": pedido_id,
            "monto": monto_soles,
            "mensaje": "QR generado exitosamente"
        }
        
    except Exception as e:
        import traceback
        print("ERROR COMPLETO:")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )

@router.post("/verificar-orden-culqi/{order_id}")
def verificar_orden_culqi(order_id: str, db: Session = Depends(get_db)):
    """
    Verifica el estado de una orden de Culqi
    """
    try:
        logger.info(f"Verificando orden de Culqi: {order_id}")
        
        # Consultar la orden en Culqi
        order = culqi.Order.retrieve(order_id)
        
        estado = order.get('state')
        payment_status = order.get('payment_status')
        
        logger.info(f"Estado de orden {order_id}: {estado}, Payment Status: {payment_status}")
        
        # Estados posibles:
        # - pending: Pendiente de pago
        # - paid: Pagado
        # - expired: Expirado
        # - canceled: Cancelado
        
        if estado == 'paid' or payment_status == 'paid':
            # Extraer el pedido_id del order_number
            order_number = order.get('order_number', '')
            pedido_id = int(order_number.split('-')[1]) if '-' in order_number else None
            
            if pedido_id:
                # Actualizar el pago en la base de datos
                pago = db.query(models.Pagos).filter(
                    models.Pagos.pedido_id == pedido_id
                ).first()
                
                if not pago:
                    # Crear nuevo registro de pago
                    pedido = db.query(models.Pedidos).filter(
                        models.Pedidos.id == pedido_id
                    ).first()
                    
                    if pedido:
                        pago = models.Pagos(
                            pedido_id=pedido_id,
                            monto=float(order.get('amount', 0)) / 100,
                            metodo_pago="Yape/Plin",
                            estado="Pagado",
                            fecha_pago=datetime.now(),
                            referencia_pago=order_id
                        )
                        db.add(pago)
                        
                        # Actualizar estado del pedido
                        if pedido.estado == "Pendiente":
                            pedido.estado = "En preparacion"
                        
                        db.commit()
            
            return {
                "success": True,
                "verificado": True,
                "mensaje": "Pago verificado exitosamente",
                "estado": estado,
                "monto": float(order.get('amount', 0)) / 100
            }
        elif estado == 'expired':
            return {
                "success": True,
                "verificado": False,
                "mensaje": "El código QR ha expirado"
            }
        elif estado == 'canceled':
            return {
                "success": True,
                "verificado": False,
                "mensaje": "El pago fue cancelado"
            }
        else:
            return {
                "success": True,
                "verificado": False,
                "mensaje": "El pago aún no ha sido confirmado"
            }
            
    except culqi.error.InvalidRequestError as e:
        logger.error(f"Error al verificar orden: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al verificar orden: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error al verificar orden: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar pago: {str(e)}"
        )
