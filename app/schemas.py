from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import enum

# Enums
class TipoPedido(str, enum.Enum):
    MESA = "mesa"
    DELIVERY = "delivery"
    RECOJO_LOCAL = "recojo_local"

class EstadoPedido(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PREPARACION = "en_preparacion"
    LISTO = "listo"
    SERVIDO = "servido"
    ENTREGADO = "entregado"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"

class EstadoItemPedido(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PREPARACION = "en_preparacion"
    LISTO = "listo"
    SERVIDO = "Servido"
    ENTREGADO = "Entregado"

class EstadoMesa(str, enum.Enum):
    LIBRE = "libre"
    OCUPADA = "ocupada"

class EstadoPago(str, enum.Enum):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
    FALLIDO = "fallido"
    REEMBOLSADO = "reembolsado"

class MetodoPago(str, enum.Enum):
    EFECTIVO = "efectivo"
    YAPE = "yape"
    PLIN = "plin"
    TARJETA = "tarjeta"

class PlataformasDelivery(str, enum.Enum):
    RAPPI = "rappi"
    UBER_EATS = "uber_Eats"
    PEDIDOS_YA = "pedidosYa"

class TipoMovimiento(str, enum.Enum):
    CONSUMO = "consumo"
    MERMA = "merma"
    AJUSTE = "ajuste"

# -------------- Schema para categorias de ingredientes -------------- #
class CategoriaIngredienteBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    indice_orden: Optional[int] = None

class CategoriaIngredienteCreate(CategoriaIngredienteBase):
    pass

class CategoriaIngredienteResponse(CategoriaIngredienteBase):
    id: int

    class Config:
        from_attributes = True

# -------------- Schema para Proveedor-Ingrediente -------------- #
class ProveedorIngredienteBase(BaseModel):
    proveedor_id: int
    precio_proveedor: Optional[Decimal] = None
    tiempo_entrega_dias: Optional[int] = None

class ProveedorIngredienteCreate(ProveedorIngredienteBase):
    ingrediente_id: int # Para crear la asociación

class ProveedorIngredienteResponse(ProveedorIngredienteBase):
    nombre_proveedor: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {Decimal: float}

# -------------- Schemas Ingredientes -------------- #
class IngredienteBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    unidad_de_medida: str
    precio_unitario: Optional[Decimal] = None
    categoria_ingrediente_id: Optional[int] = None
    stock_minimo: Optional[Decimal] = Decimal(0)
    es_perecible: Optional[bool] = False

class IngredienteCreate(IngredienteBase):
    pass

class IngredienteUpdate(IngredienteBase):
    nombre: Optional[str] = None
    unidad_de_medida: Optional[str] = None

class IngredienteResponse(IngredienteBase):
    id: int
    nombre_categoria: Optional[str] = None
    proveedores_asociaciones: List[ProveedorIngredienteResponse] = []
    
    class Config:
        from_attributes = True
        json_encoders = {Decimal: float}

# 1. Esquema para la asociación Ingrediente + Cantidad (dentro de un Producto/Platillo)
class IngredienteRecetaBase(BaseModel):
    ingrediente_id: int
    cantidad_requerida: Decimal

class IngredienteRecetaResponse(IngredienteRecetaBase):
    # Agregamos el detalle del ingrediente para el frontend en React (la etiqueta)
    nombre_ingrediente: str
    unidad_medida: str
    
    class Config:
        from_attributes = True
        json_encoders = {Decimal: float} # Usamos json_encoders para serializar Decimal a float

# 2. Esquema para la creación/edición de una Receta
class RecetaCreate(IngredienteRecetaBase):
    producto_id: int

class RecetaResponse(RecetaCreate):
    id: int
    
    class Config:
        from_attributes = True
        json_encoders = {Decimal: float}

# --------------  Schemas Login -------------- #
class LoginPassword(BaseModel):
    username: str
    password: str = Field(..., max_length=72)

class LoginPin(BaseModel):
    pin_code: str = Field(..., max_length=72)

# -------------- Schemas Mesas -------------- #
class AMesas(BaseModel):
    numero:str
    capacidad: int
    estado: Optional[str]="Libre"

# -------------- Schema para categorias -------------- #
class CategoriaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    indice_orden: Optional[int] = None

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaUpdate(CategoriaBase):
    # Permite actualizar solo algunos campos
    nombre: Optional[str] = None

class CategoriaResponse(CategoriaBase):
    id: int

    class Config:
        from_attributes = True

# --------------  Schemas Productos -------------- #
class ProductoBase(BaseModel):
    codigo_producto: str
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    imagen_url: Optional[str] = None
    producto_activo: bool = True
    tiempo_preparacion: Optional[int] = None
    categoria_id: Optional[int] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id: int
    ingredientes_receta: List[IngredienteRecetaResponse] = []
    nombre_categoria: Optional[str] = None
    
    class Config:
        from_attributes = True
        json_encoders = {Decimal: float}

# -------------- Schema para Mesas -------------- #
class MesaBase(BaseModel):
    numero: str
    capacidad: int
    estado: EstadoMesa = EstadoMesa.LIBRE

class MesaCreate(MesaBase):
    pass

class MesaResponse(MesaBase):
    id: int
    
    class Config:
        from_attributes = True

# -------------- Schema para detalles del pedido -------------- #
class DetallePedidoBase(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float
    notas: Optional[str] = None

class DetallePedidoResponse(DetallePedidoBase):
    id: int

    class Config:
        from_attributes = True

# -------------- Schema para Pedidos Delivery y Recojo Local -------------- #
# Esquema específico para pedidos de delivery
class PedidoDeliveryBase(BaseModel):
    nombre_cliente: str = Field(..., max_length=200)
    direccion_cliente: str
    telefono_cliente: str = Field(..., max_length=20)
    plataforma: PlataformasDelivery
    costo_envio: Optional[Decimal] = None
    comision_plataforma: Optional[Decimal] = None
    codigo_pedido_externo: Optional[str] = Field(None, max_length=100)

    class Config: # Aseguramos que la serialización de respuesta sea correcta
        json_encoders = {Decimal: float}

# Esquema específico para pedidos de recojo local
class PedidoRecojoLocalBase(BaseModel):
    nombre_cliente: str = Field(..., max_length=200)
    telefono_cliente: str = Field(..., max_length=20)
    hora_recojo_estimada: Optional[datetime] = None
    comision_plataforma: Optional[Decimal] = None

    class Config:
        json_encoders = {Decimal: float}

# -------------- Schema para Pedidos -------------- #
# Esquema base común para todos los tipos de pedidos
class PedidoBase(BaseModel):
    empleado_id: Optional[int] = None
    mesa_id: Optional[int] = None
    tipo_pedido: TipoPedido = TipoPedido.MESA

# Esquema para crear un nuevo pedido
class PedidoCreate(PedidoBase):
    """Schema para crear un nuevo pedido (soporta mesa, delivery y recojo)"""
    
    detalles: List[DetallePedidoBase]
    # Datos específicos según el tipo de pedido
    delivery_data: Optional[PedidoDeliveryBase] = None
    recojo_data: Optional[PedidoRecojoLocalBase] = None
    
    notas: Optional[str] = None

# Esquema de respuesta detallado de un pedido
class PedidoResponse(PedidoBase):
    """Schema de respuesta completo"""
    id: int
    estado: EstadoPedido
    monto_total: float
    fecha_creacion: datetime
    hora_inicio: datetime

    detalles: List[DetallePedidoResponse] = []
    
    # Relaciones específicas según el tipo de pedido
    delivery: Optional[PedidoDeliveryBase] = None
    recojo: Optional[PedidoRecojoLocalBase] = None

    class Config:
        from_attributes = True

# --------------  Schema para autenticación -------------- #
class LoginBase(BaseModel):
    username: Optional[str] = None
    pin_code: Optional[str] = None
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    rol: Optional[str] = None
    empleado_id: Optional[int] = None

# --------------  Schema para Inventario  -------------- #
# Esquema base para lotes de ingredientes
class LoteBase(BaseModel):
    """Esquema base para la creación de un nuevo lote"""
    ingrediente_id: int
    proveedor_id: Optional[int] = None
    cantidad: Decimal = Field(..., gt=0, description="Cantidad total ingresada en este lote")
    
    fecha_vencimiento: Optional[date] = None
    numero_lote: Optional[str] = Field(None, max_length=100)

# Esquema para crear un nuevo lote
class LoteCreate(LoteBase):
    pass

# Esquema de respuesta detallado de un lote
class LoteResponse(LoteBase):
    """Esquema de respuesta detallado de un lote"""
    id: int
    stock_actual: Decimal = Field(..., description="Cantidad restante del lote")
    fecha_ingreso: datetime
    
    nombre_ingrediente: Optional[str] = None
    nombre_proveedor: Optional[str] = None
    
    class Config:
        from_attributes = True

# Esquema base para movimientos de inventario
class MovimientoInventarioBase(BaseModel):
    """Esquema base para registrar un movimiento"""
    
    lote_id: int = Field(..., description="ID del lote al que se le aplica el movimiento")
    cantidad: Decimal = Field(..., gt=0, description="Cantidad del movimiento (siempre positiva)")
    tipo_movimiento: str = Field(..., description="Tipo de movimiento")
    motivo: Optional[str] = Field(None, max_length=255, description="Motivo o referencia del movimiento")
    empleado_id: Optional[int] = None # Empleado que registró la transacción
    referencia: Optional[str] = Field(None, max_length=100, description="Referencia externa (ej: ID de venta)")

# Esquema para crear un nuevo movimiento
class MovimientoInventarioCreate(MovimientoInventarioBase):
    pass

# Esquema de respuesta detallado de un movimiento
class MovimientoInventarioResponse(MovimientoInventarioBase):
    """Esquema de respuesta detallado de un movimiento."""
    id: int
    fecha_hora: datetime
    
    # Campos de relación para la respuesta
    nombre_ingrediente: Optional[str] = None # Se obtiene del Lote
    nombre_empleado: Optional[str] = None

    class Config:
        from_attributes = True

# Esquema para el reporte de stock total por ingrediente
class StockTotalResponse(BaseModel):
    """Esquema que muestra el stock total agregado por ingrediente."""
    
    ingrediente_id: int
    nombre_ingrediente: str
    unidad_medida: str
    stock_total: Decimal = Field(..., description="Cantidad total disponible sumando todos los lotes.")

    class Config:
        from_attributes = True

# Schemas 
class AInsumo(BaseModel):
    nombre:str
    cantidad:Optional[float]=0.0
    minimo:Optional[float]=0.0
    precio:Optional[float]=0.0
    categoria: str
    unidad: str
    perecible:Optional[bool]=False

class IngredienteSimple(BaseModel):
    nombre: str  
    class Config:
        from_attributes = True

class ProductoConIngredientes(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    precio: float
    producto_activo:bool
    categoria: str  
    ingredientes: List[IngredienteSimple] = []  
    class Config:
        from_attributes = True

class HabilitarPlatillo(BaseModel):
    producto_activo:bool
    class Config:
        from_attributes = True 

class AgregarEmpleado(BaseModel):
    nombres:str
    apellidos:str
    rol:int
    telefono:str
    correo:str
    nombreUs:Optional[str]=None
    contrasenaUs:Optional[str]=None
    PIN:Optional[str]=None

class EditarEmpleado(BaseModel):
    nombres:Optional[str]=None
    apellidos:Optional[str]=None
    rol:Optional[int] = None
    telefono:Optional[str]=None
    correo:Optional[str]=None
    nombreUs:Optional[str]=None
    contrasenaUs:Optional[str]=None
    PIN:Optional[str]=None

class MovimientoInsumo(BaseModel):
    insumo_id: int
    tipo_movimiento: str
    cantidad: float
    motivo: str
    empleado_id: Optional[int] = 1
    class Config:
        from_attributes = True

class ItemPedido(BaseModel):
    producto_id: int
    nombre: str
    cantidad: int
    precio_unitario: float
    class Config:
        from_attributes = True

class MostrarPedido(BaseModel):
    id: int
    mesa: str
    estado: str
    hora: str
    tipo_pedido:str
    monto_total: float
    items: List[ItemPedido]
    class Config:
        from_attributes = True

#Para crear items(elementos de los pedidos)
class ItemPedidoCrear(BaseModel):
    producto_id: int  
    cantidad: int
    precio_unitario: float

# Para crear pedidos
class AgregarPedido(BaseModel):
    mesa_id: int
    empleado_id: Optional[int] = 6
    estado: Optional[str] = 'Pendiente'  #  Valor por defecto
    tipo_pedido: Optional[str] = 'Mesa'
    monto_total: float
    items: List[ItemPedidoCrear]  
    class Config:
        from_attributes = True

# Para items YA CREADOS (con pedido_id)
class ItemAgregado(BaseModel):
    pedido_id: int
    producto_id: int
    nombre: str
    cantidad: int
    precio_unitario: float
    class Config:
        from_attributes = True

class ItemPedidoEditar(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float
    notas: str = ""

class PedidoEditarSolicitud(BaseModel):
    items: List[ItemPedidoEditar]
    monto_total: float
    class Config:
        from_attributes = True

class RegistarMerma(BaseModel):
    platillo_id:int
    cantidad:int
    motivo:str
    
#Para pago de delivery
class DetallePedidoDeliveryCreate(BaseModel):
    producto_id: int
    cantidad: int
    notas: Optional[str] = None

class PedidoDeliveryCreate(BaseModel):
    nombre_cliente: str
    direccion_cliente: str
    telefono_cliente: str
    plataforma: str
    codigo_pedido_externo: Optional[str] = None
    detalles: List[DetallePedidoDeliveryCreate]
    metodo_pago: str

class PedidoDeliveryResponse(BaseModel):
    id: int
    estado: str
    monto_total: float
    tipo_pedido: str
    fecha_creacion: str
    nombre_cliente: str
    direccion_cliente: str
    telefono_cliente: str
    plataforma: str
    codigo_pedido_externo: Optional[str] = None
    
    class Config:
        from_attributes = True

class DetallePedidoDeliveryResponse(BaseModel):
    id: int
    producto_id: int
    producto_nombre: str
    cantidad: int
    precio_unitario: float
    notas: Optional[str] = None
    estado: str
    
    class Config:
        from_attributes = True

class PagoDeliveryResponse(BaseModel):
    id: Optional[int] = None
    monto: float
    metodo_pago: Optional[str] = None
    estado: Optional[str] = None
    referencia_pago: Optional[str] = None
    
    class Config:
        from_attributes = True

class PedidoDeliveryCompletoResponse(BaseModel):
    pedido: PedidoDeliveryResponse
    detalles: List[DetallePedidoDeliveryResponse]
    pago: PagoDeliveryResponse
    
    class Config:
        from_attributes = True

class ActualizarEstadoDelivery(BaseModel):
    estado: str
    #Para generar codigo QR en metodos de pago
class CrearQrResponse(BaseModel):
    success: bool
    qr_url: str
    pedido_id: int
    monto: float
    mensaje: str
    order_id: Optional[str] = None  # ← NUEVO
    payment_code: Optional[str] = None  # ← NUEVO
