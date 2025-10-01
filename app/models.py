from sqlalchemy import (  Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, Enum, Float, Text,
    Date, JSON, DECIMAL, text)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import enum
#Los enum de las tablas
class EstadoMesaEnum(str, enum.Enum):
    Libre = "Libre"
    Ocupada = "Ocupada"
class EstadoPedidoEnum(str, enum.Enum):
    Pendiente = "Pendiente"
    EnProceso = "EnProceso"
    Completado = "Completado"
    Cancelado = "Cancelado"

class EstadoItemPedidoEnum(str, enum.Enum):
    Pendiente = "Pendiente"
    Preparando = "Preparando"
    Listo = "Listo"
    Servido = "Sido"
    Cancelado = "Cancelado"

class TipoPedidoEnum(str, enum.Enum):
    Mesa = "Mesa"
    Delivery = "Delivery"
    Recojo = "Recojo"

class PlataformasDeliveryEnum(str, enum.Enum):
    Rappi = "Rappi"
    PedidosYa = "PedidosYa"
    UberEats = "UberEats"
    Otro = "Otro"

class MetodoPagoEnum(str, enum.Enum):
    Efectivo = "Efectivo"
    Yape = "Yape"
    Tarjeta = "Tarjeta"

class EstadoPagoEnum(str, enum.Enum):
    Pendiente = "Pendiente"
    Pagado = "Pagado"
    Fallido = "Fallido"

class TipoMovimientoEnum(str, enum.Enum):
    Entrada = "Entrada"
    Salida = "Salida"
    Ajuste = "Ajuste"

#Se coloca las tablas de la BD a usar.
class Empleado(Base):
    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=True)
    contrasena_hash = Column(String(120), nullable=True)
    pin_code_hash = Column(String(120), nullable=True)
    email = Column(String(150), unique=True, nullable=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=True)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    esta_activo = Column(Boolean, default=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
class Mesas(Base):
   __tablename__ = "mesas"
   id = Column(Integer, primary_key=True, index=True)
   numero=Column(String(10),unique=True,nullable=False)
   capacidad=Column(Integer,nullable=False)
   estado=Column(Enum(EstadoMesaEnum,name="estado_mesa"),nullable=False,server_default="Libre")
class Ingredientes(Base):
    __tablename__="ingredientes"
    id=Column(Integer,primary_key=True,index=True)
    nombre=Column(String(150),nullable=False)
    descripcion=Column(Text)
    cantidad=Column(Float,nullable=False,server_default=text("0"))
    precio=Column(Float,nullable=False,server_default=text("0"))
    unidad_medida=Column(String(20),nullable=False)
    stock=Column(Float,nullable=False,server_default=text("0"))
    es_Perecible=Column(Boolean,nullable=False,server_default=text("False"))
class Categorias(Base):
    __tablename__="categorias"
    id=Column(Integer,primary_key=True,index=True)
    nombre=Column(String(100),nullable=False)
    descripcion=Column(Text)
    indice_orden=Column(Integer)
class Productos(Base):
    __tablename__="productos"
    id=Column(Integer,primary_key=True,index=True)
    codigo_producto=Column(String(50),nullable=False,unique=True)
    nombre=Column(String(200),nullable=False)
    descripcion=Column(Text)
    precio=Column(Float,nullable=False)
    imagen_url=Column(String(255))
    producto_activo=Column(Boolean,server_default=text("True"))
    categoria_id=Column(Integer, ForeignKey("categorias.id"), nullable=False)
    # Relación ORM
    categoria = relationship("Categorias", backref="productos")
class Roles(Base):
    __tablename__="roles"
    id=Column(Integer,nullable=False,index=True)
    nombre=Column(String(50),nullable=False,unique=True)
    descripcion=Column(Text)
class Proveedor(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    contacto = Column(String(100))
    telefono = Column(String(20))
    direccion = Column(Text)
class Receta(Base):
    __tablename__ = "recetas"
    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    ingredientes_id = Column(Integer, ForeignKey("ingredientes.id"), nullable=False)
    cantidad_requerida = Column(DECIMAL(10, 2), nullable=False)

    producto = relationship("Menu", back_populates="recetas")
    ingrediente = relationship("Ingrediente", back_populates="recetas")
class Pedido(Base):
    __tablename__ = "pedidos"
    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"))
    estado = Column(Enum(EstadoPedidoEnum, name="estado_pedido"), server_default="Pendiente")
    monto_total = Column(DECIMAL(10, 2), server_default=text("0"))
    mesa_id = Column(Integer, ForeignKey("mesas.id"))
    tipo_pedido = Column(Enum(TipoPedidoEnum, name="tipo_pedido"), server_default="Mesa")
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
    empleado = relationship("Empleado", back_populates="pedidos")
    mesa = relationship("Mesas", back_populates="pedidos")
    detalles = relationship("DetallePedido", back_populates="pedido")
    pagos = relationship("Pago", back_populates="pedido")
    historial_estados = relationship("HistorialEstadosPedido", back_populates="pedido")
class DetallePedido(Base):
    __tablename__ = "detalles_pedido"
    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    notas = Column(Text)
    estado = Column(Enum(EstadoItemPedidoEnum, name="estado_item_pedido"), server_default="Pendiente")

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Menu", back_populates="detalles")
    historial_items = relationship("HistorialEstadosItem", back_populates="detalle")

class PedidoDelivery(Base):
    __tablename__ = "pedidos_delivery"
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), primary_key=True)
    nombre_cliente = Column(String(200), nullable=False)
    direccion_cliente = Column(Text, nullable=False)
    telefono_cliente = Column(String(20), nullable=False)
    plataforma = Column(Enum(PlataformasDeliveryEnum, name="plataformas_delivery"), nullable=False)
    codigo_pedido_externo = Column(String(100))

class PedidoRecojoLocal(Base):
    __tablename__ = "pedidos_recojo_local"
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), primary_key=True)
    nombre_cliente = Column(String(200), nullable=False)
    telefono_cliente = Column(String(20), nullable=False)
    hora_recojo_estimada = Column(TIMESTAMP)

class Pago(Base):
    __tablename__ = "pagos"
    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    monto = Column(DECIMAL(10, 2), nullable=False)
    metodo_pago = Column(Enum(MetodoPagoEnum, name="metodo_pago"), nullable=False)
    estado = Column(Enum(EstadoPagoEnum, name="estado_pago"), server_default="Pendiente")
    fecha_pago = Column(TIMESTAMP)
    referencia_pago = Column(String(100))

    pedido = relationship("Pedido", back_populates="pagos")
class LoteInventario(Base):
    __tablename__ = "lotes_inventario"
    id = Column(Integer, primary_key=True, index=True)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id", ondelete="CASCADE"), nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    cantidad = Column(DECIMAL(10, 3), nullable=False)
    stock_actual = Column(DECIMAL(10, 3), nullable=False)
    fecha_vencimiento = Column(Date)
    fecha_ingreso = Column(TIMESTAMP, server_default=func.now())
    numero_lote = Column(String(100))

    ingrediente = relationship("Ingrediente", back_populates="lotes")
    proveedor = relationship("Proveedor", back_populates="lotes_inventario")
    movimientos = relationship("MovimientoInventario", back_populates="lote")

class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    id = Column(Integer, primary_key=True, index=True)
    lote_id = Column(Integer, ForeignKey("lotes_inventario.id"), nullable=False)
    tipo_movimiento = Column(Enum(TipoMovimientoEnum, name="tipo_movimiento"), nullable=False)
    cantidad = Column(DECIMAL(10, 3), nullable=False)
    motivo = Column(Text)
    empleado_id = Column(Integer, ForeignKey("empleados.id"))
    fecha_hora = Column(TIMESTAMP, server_default=func.now())

    lote = relationship("LoteInventario", back_populates="movimientos")
    empleado = relationship("Empleado", back_populates="movimientos_inventario")
class RegistroAuditoria(Base):
    __tablename__ = "registro_auditoria"
    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id"))
    accion = Column(String(100), nullable=False)
    nombre_tabla = Column(String(50))
    registro_id = Column(Integer)
    valores_antiguos = Column(JSON)
    valores_nuevos = Column(JSON)
    marca_tiempo = Column(TIMESTAMP, server_default=func.now())

    empleado = relationship("Empleado", back_populates="registros_auditoria")
class HistorialEstadosPedido(Base):
    __tablename__ = "historial_estados_pedido"
    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    estado_anterior = Column(Enum(EstadoPedidoEnum, name="estado_pedido"))
    estado_nuevo = Column(Enum(EstadoPedidoEnum, name="estado_pedido"), nullable=False)
    empleado_id = Column(Integer, ForeignKey("empleados.id"))
    fecha_cambio = Column(TIMESTAMP, server_default=func.now())
    duracion_segundos = Column(Integer)

    pedido = relationship("Pedido", back_populates="historial_estados")
class HistorialEstadosItem(Base):
    __tablename__ = "historial_estados_items"
    id = Column(Integer, primary_key=True, index=True)
    detalle_pedido_id = Column(Integer, ForeignKey("detalles_pedido.id"), nullable=False)
    estado_anterior = Column(Enum(EstadoItemPedidoEnum, name="estado_item_pedido"))
    estado_nuevo = Column(Enum(EstadoItemPedidoEnum, name="estado_item_pedido"), nullable=False)
    empleado_id = Column(Integer, ForeignKey("empleados.id"))
    fecha_cambio = Column(TIMESTAMP, server_default=func.now())

    detalle = relationship("DetallePedido", back_populates="historial_items")