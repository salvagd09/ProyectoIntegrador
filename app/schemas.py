from pydantic import BaseModel
from typing import Optional,List
class LoginPassword(BaseModel):
    username: str
    password: str
class LoginPin(BaseModel):
    pin_code: str
class AMesas(BaseModel):
    numero:str
    capacidad: int
    estado: Optional[str]="Libre"
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
    items: List[ItemPedidoCrear]  # ✅ Usa el schema correcto
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

