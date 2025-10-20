from sqlalchemy import Column, Integer,Text, String, Boolean, TIMESTAMP, ForeignKey,Enum, Float,Date, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import enum
#Los enum de las tablas
class EstadoMesaEnum(str, enum.Enum):
    Libre = "Libre"
    Ocupada = "Ocupada"
class EstadoPedido(str,enum.Enum):
    Pendiente='Pendiente', 		
    EnPreparacion='En preparacion',	
    Listo='Listo', 			
    Servido='Servido',        	
    Entregado='Entregado',      	
    Completado='Completado', 		
    Cancelado='Cancelado'
class TipoPedido(str,enum.Enum):
    Mesa='Mesa',
    Delivery='Delivery',
    Reocjo_Local='Recojo_local'
class EstadoDPedido(str,enum.Enum):
    Pendiente='Pendiente',
    EnPreparacion='En preparacion',
    Listo='Listo'
class PlataformasDelivery(str,enum.Enum):
    Rappi='Rappi', 
    UberEats='Uber Eats', 
    PedidosYa='PedidosYa'
class MetodosPago(str,enum.Enum):
    Efectivo='Efectivo',
    Yape='Yape',
    Plin='Plin',
    Tarjeta='Tarjeta'
class EstadoPago(str,enum.Enum):
    Pendiente='Pendiente',
    Pagado='Pagado',
    Fallido='Fallido',
    Reembolsado='Reembolsado'
class TipoMovimiento(str,enum.Enum):
    Consumo='Consumo',
    Merma='Merma', 
    Ajuste='Ajuste'
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
    telefono=Column(String(9))
    rol = relationship("Roles", back_populates="empleados")
    pedidosE=relationship("Pedidos",back_populates="empleados")
    eMI=relationship("Movimientos_Inventario",back_populates="empleadosMI")
class Mesas(Base):
   __tablename__ = "mesas"
   id = Column(Integer, primary_key=True, index=True)
   numero=Column(String(10),unique=True,nullable=False)
   capacidad=Column(Integer,nullable=False)
   estado=Column(Enum(EstadoMesaEnum,name="estado_mesa"),nullable=False,server_default="Libre")
   pedidosM=relationship("Pedidos",back_populates="mesas")
class Ingredientes(Base):
    __tablename__="ingredientes"
    id=Column(Integer,primary_key=True,index=True)
    nombre=Column(String(150),nullable=False)
    descripcion=Column(Text)
    cantidad=Column(Float,nullable=False,default=0)
    precio=Column(Float,nullable=False,default=0)
    unidad_medida=Column(String(20),nullable=False)
    stock=Column(Float,nullable=False,default=0)
    es_Perecible=Column(Boolean,nullable=False,default=False)
    recetasI=relationship("Recetas",back_populates="ingredientesR")
    invIng=relationship("Lotes_Inventarios",back_populates="ingredientesLI")
class Roles(Base):
    __tablename__="roles"
    id=Column(Integer,primary_key=True,index=True)
    nombre=Column(String(50),unique=True,nullable=True)
    descripcion=Column(Text)
    empleados=relationship("Empleado",back_populates="rol")
class Platillo(Base):
    __tablename__="productos"
    id=Column(Integer,primary_key=True,index=True)
    codigo_producto=Column(String(50),unique=True,nullable=False)
    nombre=Column(String(200),nullable=False)
    descripcion=Column(Text)
    precio=Column(Float,nullable=False)
    imagen_url=Column(String(255),nullable=True)
    producto_activo=Column(Boolean,nullable=False,default=True)
    categoria_id=Column(Integer,ForeignKey("categorias.id"),nullable=False)
    categoria=relationship("Categorias",back_populates="platillos")
    DPedidoP=relationship("Detalles_Pedido",back_populates="platillos")
    recetasP=relationship("Recetas",back_populates="productosR")
class Categorias(Base):
    __tablename__="categorias"
    id=Column(Integer,primary_key=True,index=True)
    nombre=Column(String(100),nullable=False)
    descripcion=Column(Text)
    indice_orden=Column(Integer)
    platillos=relationship("Platillo",back_populates="categoria")
class Pedidos(Base):
    __tablename__="pedidos"
    id=Column(Integer,primary_key=True,index=True)
    empleado_id=Column(Integer,ForeignKey("empleados.id"))
    estado=Column(Enum(EstadoPedido,name="estado_pedido"),nullable=False,server_default="Pendiente")
    monto_total=Column(Float,default=0)
    mesa_id=Column(Integer,ForeignKey("mesas.id"))
    tipo_pedido=Column(Enum(TipoPedido,name="tipo_pedido"),nullable=False,server_default="Mesa")
    fecha=Column(TIMESTAMP,server_default=func.now())
    empleados=relationship("Empleado",back_populates="pedidosE")
    mesas=relationship("Mesas",back_populates="pedidosM")
    Dpedido=relationship("Detalles_Pedido",back_populates="pedidos")
    PedidosD=relationship("Pedidos_Delivery",back_populates="delivery")
    pedidosR=relationship("PedidosRecojoLocal",back_populates="pedidosRJ")
    pagos=relationship("Pagos",back_populates="pedidosP")
class Detalles_Pedido(Base):
    __tablename__="detalles_pedido"
    id=Column(Integer,primary_key=True,index=True)
    pedido_id=Column(Integer,ForeignKey("pedidos.id"),nullable=False)
    producto_id=Column(Integer,ForeignKey("productos.id"),nullable=False)
    cantidad=Column(Integer,nullable=False)
    precio_unitario=Column(Float,nullable=False)
    notas=Column(Text)
    estado=Column(Enum(EstadoDPedido,name="estado_item_pedido"),server_default="Pendiente")
    pedidos=relationship("Pedidos",back_populates="Dpedido")
    platillos=relationship("Platillo",back_populates="DPedidoP")
class Pedidos_Delivery(Base):
    __tablename__="pedidos_delivery"
    pedido_id=Column(Integer,ForeignKey("pedidos.id"),primary_key=True,index=True)
    nombre_cliente=Column(String(200),nullable=False)
    direccion_cliente=Column(Text,nullable=False)
    telefono_cliente=Column(String(20),nullable=False)
    plataformas_delivery=Column(Enum(PlataformasDelivery,name="plataformas_delivery"),nullable=False)
    codigo_pedido_externo=Column(String(100))
    delivery=relationship("Pedidos",back_populates="PedidosD")
class PedidosRecojoLocal(Base):
    __tablename__="pedidos_recojo_local"
    pedido_id=Column(Integer,ForeignKey("pedidos.id"),primary_key=True,index=True)
    nombre_cliente=Column(String(200),nullable=False)
    telefono_cliente=Column(String(20),nullable=False)
    hora_recojo_estimada=Column(TIMESTAMP)
    pedidosRJ=relationship("Pedidos",back_populates="pedidosR")
class Pagos(Base):
    __tablename__="pagos"
    id=Column(Integer,primary_key=True,index=True)
    pedido_id=Column(Integer,ForeignKey("pedidos.id"),primary_key=True,index=True)
    monto=Column(Float,nullable=False)
    metodo_pago=Column(Enum(MetodosPago,name="metodo_pago"),nullable=False)
    estado=Column(Enum(EstadoPago,name="estado_pago"),server_default="Pendiente")
    fecha_pago=Column(TIMESTAMP)
    referencia_pago=Column(String(100))
    pedidosP=relationship("Pedidos",back_populates="pagos")
class Recetas(Base):
    __tablename__="recetas"
    id=Column(Integer,primary_key=True,index=True)
    producto_id=Column(Integer,ForeignKey("productos.id"),nullable=False,unique=True)
    ingredientes_id=Column(Integer,ForeignKey("ingredientes.id"),nullable=False,unique=True)
    cantidad_requerida=Column(Float,nullable=False)
    productosR=relationship("Platillo",back_populates="recetasP")
    ingredientesR=relationship("Ingredientes",back_populates="recetasI")
class Proveedores(Base):
    __tablename__="proveedores"
    id=Column(Integer,primary_key=True,index=True)
    nombre=Column(String(100),nullable=False)
    contacto=Column(String(100))
    telefono=Column(String(20))
    direccion=Column(Text)
    invP=relationship("Lotes_Inventarios",back_populates="proveedoresLI")
class Lotes_Inventarios(Base):
    __tablename__="lotes_inventarios"
    id=Column(Integer,primary_key=True,index=True)
    ingrediente_id=Column(Integer,ForeignKey("ingredientes.id"),nullable=False)
    provedor_id=Column(Integer,ForeignKey("proveedores.id"))
    cantidad=Column(Float,nullable=False)
    stock_actual=Column(Float,nullable=False)
    fecha_vencimiento=Column(Date)
    fecha_ingreso=Column(TIMESTAMP,default=func.now())
    numero_lote=Column(String(100))
    ingredientesLI=relationship("Ingredientes",back_populates="invIng")
    proveedoresLI=relationship("Proveedores",back_populates="invP")
    LIMI=relationship("Movimientos_Inventario",back_populates="LotesMI")
class Movimientos_Inventario(Base):
    __tablename__="movimientos_inventarios"
    id=Column(Integer,primary_key=True,index=True)
    lote_id=Column(Integer,ForeignKey("lotes_inventarios.id"),nullable=False)
    tipo_movimiento=Column(Enum(TipoMovimiento,name="tipo_movimiento"),nullable=False)
    cantidad=Column(Float,nullable=False)
    motivo=Column(Text)
    empleado_id=Column(Integer,ForeignKey("empleados.id"))
    Fecha_Hora=Column(TIMESTAMP,default=func.now())
    empleadosMI=relationship("Empleado",back_populates="eMI")
    LotesMI=relationship("Lotes_Inventarios",back_populates="LIMI")