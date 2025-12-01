from sqlalchemy import (
    Column, Integer, String, Text, DECIMAL, Boolean,
    ForeignKey, Enum as SQLEnum, TIMESTAMP, CheckConstraint, Date, DateTime, JSON, Float
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime, date
from enum import Enum

Base = declarative_base()

#-------#
# Enums #
#-------#

class TipoPedidoEnum(str, Enum):
    mesa = "mesa"
    delivery = "delivery"
    recojo_local = "recojo_local"

class EstadoPedidoEnum(str, Enum):
    por_confirmar = "por_confirmar"
    pendiente = "pendiente"
    en_preparacion = "en_preparacion"
    listo = "listo"
    servido = "servido"
    entregado = "entregado"
    completado = "completado"
    cancelado = "cancelado"

class EstadoItemPedidoEnum(str, Enum):
    por_confirmar = "por_confirmar"
    pendiente = "pendiente"
    en_preparacion = "en_preparacion"
    listo = "listo"
    servido = "servido"
    entregado = "entregado"

class EstadoMesaEnum(str, Enum):
    libre = "libre"
    ocupada = "ocupada"

class EstadoPagoEnum(str, Enum):
    pendiente = "pendiente"
    pagado = "pagado"
    fallido = "fallido"
    reembolsado = "reembolsado"

class MetodoPagoEnum(str, Enum):
    efectivo = "efectivo"
    yape = "yape"
    plin = "plin"
    tarjeta = "tarjeta"

class PlataformasDeliveryEnum(str, Enum):
    rappi = "rappi"
    uber_Eats = "uber_Eats"
    pedidosYa = "pedidosYa"

class TipoMovimientoEnum(str, Enum):
    consumo = "consumo"
    merma = "merma"
    ajuste = "ajuste"

#----------------#
# Tablas Simples #
#----------------#

class Roles(Base):
    __tablename__="roles"

    id=Column(Integer,primary_key=True,index=True)
    nombre=Column(String(50),unique=True,nullable=True)
    descripcion=Column(Text)

    empleados=relationship("Empleado",back_populates="rol")

    def __repr__(self):
        return f"<Rol(nombre='{self.nombre}')>"
    
class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    indice_orden = Column(Integer)

    productos = relationship("Platillo", back_populates="categoria")

    def __repr__(self):
        return f"<Categoria(nombre='{self.nombre}')>"
    
class CategoriaIngrediente(Base):
    __tablename__ = "categorias_ingredientes"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    indice_orden = Column(Integer)

    ingredientes = relationship("Ingrediente", back_populates="categoria_ingrediente")

    def __repr__(self):
        return f"<CategoriaIngrediente(nombre='{self.nombre}')>"
    
class Proveedores(Base):
    __tablename__="proveedores"

    id=Column(Integer,primary_key=True,index=True)
    nombre=Column(String(100),nullable=False)
    ruc = Column(String(20))
    contacto=Column(String(100))
    email_contacto = Column(String(100))
    telefono=Column(String(20))
    direccion=Column(Text)

    ingredientes_asociaciones = relationship("ProveedorIngrediente", back_populates="proveedor")
    ingredientes = relationship(
        "Ingrediente",
        secondary="proveedores_ingredientes", # Nombre de la tabla de asociación
        backref="proveedores",
        overlaps="proveedores_asociaciones",
    )

    invP=relationship("Lotes_Inventarios",back_populates="proveedoresLI")

    def __repr__(self):
        return f"<Proveedor(nombre='{self.nombre}')>"

#---------------------#
# Tablas Dependientes #
#---------------------#

class Ingrediente(Base):
    __tablename__ = "ingredientes"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text)
    cantidad_actual=Column(Float,nullable=False,default=0)
    unidad_de_medida = Column(String(20), nullable=False)
    precio_unitario = Column(DECIMAL(10, 2))
    categoria_ingrediente_id = Column(Integer, ForeignKey("categorias_ingredientes.id", ondelete="SET NULL"))
    stock_minimo = Column(DECIMAL(10, 2), default=0)
    es_perecible = Column(Boolean, default=False)

    recetasI=relationship("Recetas",back_populates="ingrediente")
    invIng=relationship("Lotes_Inventarios",back_populates="ingredientesLI")

    categoria_ingrediente = relationship("CategoriaIngrediente", back_populates="ingredientes")
    proveedores_asociaciones = relationship(
        "ProveedorIngrediente", 
        back_populates="ingrediente",
    )

    @hybrid_property
    def nombre_categoria(self):
        return self.categoria_ingrediente.nombre if self.categoria_ingrediente else None
    def __repr__(self):
        return f"<Ingrediente(nombre='{self.nombre}')>"
    
class Platillo(Base):
    __tablename__="productos"

    id=Column(Integer,primary_key=True,index=True)
    codigo_producto=Column(String(50),unique=True,nullable=False)
    nombre=Column(String(200),nullable=False)
    descripcion=Column(Text)
    precio = Column(DECIMAL(10, 2), nullable=False)
    imagen_url=Column(String(255),nullable=True)
    producto_activo=Column(Boolean,nullable=False,default=True)
    tiempo_preparacion = Column(Integer)
    categoria_id=Column(Integer,ForeignKey("categorias.id"),nullable=False)

    categoria=relationship("Categoria",back_populates="productos")
    DPedidoP=relationship("Detalles_Pedido",back_populates="platillos")
    receta_asociaciones = relationship("Recetas", back_populates="producto")
    PLmer=relationship("Mermas",back_populates="mermas")

    __table_args__ = (
        CheckConstraint("precio >= 0", name="chk_precio_positivo"),
        CheckConstraint("codigo_producto ~* '^[A-Z]{3}-[0-9]{3}$'", name="chk_codigo_producto"),
    )

    def __repr__(self):
        return f"<Producto(nombre='{self.nombre}', precio={self.precio})>"
    
class Mesas(Base):
    __tablename__ = "mesas"

    id = Column(Integer, primary_key=True, index=True)
    numero=Column(String(10),unique=True,nullable=False)
    capacidad=Column(Integer,nullable=False)
    estado=Column(SQLEnum(EstadoMesaEnum, name="estado_mesa"), default=EstadoMesaEnum.libre)

    __table_args__ = (
        CheckConstraint("capacidad BETWEEN 1 AND 20", name="chk_capacidad_mesa"),
    )

    pedidosM=relationship("Pedidos",back_populates="mesas")

    def __repr__(self):
        return f"<Mesa(numero='{self.numero}', estado='{self.estado.value}')>"

class Empleado(Base):
    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=True)
    password_hash = Column(String(120), nullable=True)
    pin_code_hash = Column(String(120), nullable=True)
    email = Column(String(150), unique=True, nullable=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=True)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    esta_activo = Column(Boolean, default=True)
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())
    telefono=Column(String(9))

    rol = relationship("Roles", back_populates="empleados")
    registros_auditoria = relationship("RegistroAuditoria", back_populates="empleado")
    historial_pedidos = relationship("HistorialEstadosPedido", back_populates="empleado")
    historial_items = relationship("HistorialEstadosItems", back_populates="empleado")
    pedidosE=relationship("Pedidos",back_populates="empleados")
    eMI=relationship("Movimientos_Inventario",back_populates="empleadosMI")

    __table_args__ = (
        CheckConstraint(
            "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' OR email IS NULL",
            name="chk_email_valido"
        ),
    )
    
    def __repr__(self):
        return f"<Empleado(nombre='{self.nombre}', rol_id={self.rol_id})>"

#---------------------------#
# Tablas Multi Dependientes #
#---------------------------#

class ProveedorIngrediente(Base):
    __tablename__ = "proveedores_ingredientes"

    proveedor_id = Column(Integer, ForeignKey("proveedores.id", ondelete="CASCADE"), primary_key=True)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id", ondelete="CASCADE"), primary_key=True)
    precio_proveedor = Column(DECIMAL(10, 2))
    tiempo_entrega_dias = Column(Integer)

    # Relaciones para acceder a los objetos
    proveedor = relationship("Proveedores", back_populates="ingredientes_asociaciones")
    ingrediente = relationship("Ingrediente", back_populates="proveedores_asociaciones")

    @hybrid_property
    def nombre_proveedor(self):
        return self.proveedor.nombre if self.proveedor else None

    def __repr__(self):
        return f"<ProveedorIngrediente(p_id={self.proveedor_id}, i_id={self.ingrediente_id})>"
    
class Recetas(Base):
    __tablename__="recetas"

    id=Column(Integer,primary_key=True,index=True)
    producto_id=Column(Integer,ForeignKey("productos.id"),nullable=False)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id", ondelete="CASCADE"), nullable=False)
    cantidad_requerida = Column(DECIMAL(10, 2), nullable=False)
    
    __table_args__ = (
        # Evita duplicados producto/ingrediente
        CheckConstraint("cantidad_requerida > 0", name="chk_cantidad_positiva"),
    )

    ingrediente = relationship("Ingrediente")
    producto = relationship("Platillo", back_populates="receta_asociaciones")

    def __repr__(self):
        return f"<Receta(producto_id={self.producto_id}, ingrediente_id={self.ingrediente_id})>"
    
class Pedidos(Base):
    __tablename__="pedidos"

    id = Column(Integer, primary_key=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"))
    estado = Column(SQLEnum(EstadoPedidoEnum, name="estado_pedido"), default=EstadoPedidoEnum.pendiente)
    monto_total = Column(DECIMAL(10, 2), default=0)
    mesa_id = Column(Integer, ForeignKey("mesas.id", ondelete="SET NULL"))
    tipo_pedido = Column(SQLEnum(TipoPedidoEnum, name="tipo_pedido"), default=TipoPedidoEnum.mesa)
    notas = Column(Text)
    hora_inicio = Column(TIMESTAMP, server_default=func.now())
    hora_fin = Column(TIMESTAMP)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())

    empleados=relationship("Empleado",back_populates="pedidosE")
    mesas=relationship("Mesas",back_populates="pedidosM")
    Dpedido = relationship(
        "Detalles_Pedido",
        back_populates="pedidos",
        cascade="all, delete-orphan",
        passive_deletes=True  
    )
    PedidosD=relationship("Pedidos_Delivery",back_populates="delivery")
    pedidosR=relationship("PedidosRecojoLocal",back_populates="pedidosRJ")
    pagos=relationship("Pagos",back_populates="pedidosP")
    historial_estados = relationship("HistorialEstadosPedido", back_populates="pedido")

    def __repr__(self):
        return f"<Pedido(id={self.id}, estado='{self.estado.value}', total={self.monto_total})>"
    
class Detalles_Pedido(Base):
    __tablename__="detalles_pedido"

    id=Column(Integer,primary_key=True,index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="SET NULL"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    notas = Column(Text)
    estado = Column(SQLEnum(EstadoItemPedidoEnum, name="estado_item_pedido"), default=EstadoItemPedidoEnum.pendiente)

    pedidos=relationship("Pedidos",back_populates="Dpedido")
    platillos=relationship("Platillo",back_populates="DPedidoP")
    historial_items = relationship("HistorialEstadosItems", back_populates="detalle_pedido")

    def __repr__(self):
        return f"<DetallePedido(pedido_id={self.pedido_id}, producto_id={self.producto_id})>"

class Pedidos_Delivery(Base):
    __tablename__="pedidos_delivery"

    pedido_id=Column(Integer,ForeignKey("pedidos.id"),primary_key=True,index=True)
    nombre_cliente=Column(String(200),nullable=False)
    direccion_cliente=Column(Text,nullable=False)
    telefono_cliente=Column(String(20),nullable=False)
    plataforma = Column(SQLEnum(PlataformasDeliveryEnum, name="plataformas_delivery"), nullable=False)
    codigo_pedido_externo=Column(String(100))
    costo_envio = Column(DECIMAL(10, 2))    
    comision_plataforma = Column(DECIMAL(10, 2)) 

    delivery=relationship("Pedidos",back_populates="PedidosD")

    def __repr__(self):
        return f"<PedidoDelivery(pedido_id={self.pedido_id}, plataforma='{self.plataforma.value}')>"

class PedidosRecojoLocal(Base):
    __tablename__="pedidos_recojo_local"

    pedido_id=Column(Integer,ForeignKey("pedidos.id"),primary_key=True,index=True)
    nombre_cliente=Column(String(200),nullable=False)
    telefono_cliente=Column(String(20),nullable=False)
    hora_recojo_estimada=Column(TIMESTAMP)
    comision_plataforma = Column(DECIMAL(10, 2)) 

    pedidosRJ=relationship("Pedidos",back_populates="pedidosR")

    def __repr__(self):
        return f"<PedidoRecojoLocal(pedido_id={self.pedido_id})>"

class Pagos(Base):
    __tablename__="pagos"

    id=Column(Integer,primary_key=True,index=True,autoincrement=True)
    pedido_id=Column(Integer,ForeignKey("pedidos.id"),primary_key=True,index=True)
    monto=Column(Float,nullable=False)
    metodo_pago = Column(SQLEnum(MetodoPagoEnum, name="metodo_pago"), nullable=False)
    estado = Column(SQLEnum(EstadoPagoEnum, name="estado_pago"), default=EstadoPagoEnum.pendiente)
    fecha_pago=Column(TIMESTAMP)
    referencia_pago=Column(String(100))
    id_transaccion = Column(String(100))
    observaciones = Column(Text)

    pedidosP=relationship("Pedidos",back_populates="pagos")

    __table_args__ = (
        CheckConstraint("monto > 0", name="chk_monto_valido"),
    )

    def __repr__(self):
        return f"<Pago(pedido_id={self.pedido_id}, monto={self.monto}, estado='{self.estado.value}')>"
    
#----------------------#
# Tablas de Inventario #
#----------------------#

class Lotes_Inventarios(Base):
    __tablename__="lotes_inventario"

    id=Column(Integer,primary_key=True,index=True)
    ingrediente_id=Column(Integer,ForeignKey("ingredientes.id"),nullable=False)
    proveedor_id=Column(Integer,ForeignKey("proveedores.id"))
    cantidad=Column(Float,nullable=False)
    stock_actual=Column(DECIMAL(10,3),nullable=False)
    fecha_vencimiento=Column(Date)
    fecha_ingreso=Column(TIMESTAMP,default=func.now())
    numero_lote=Column(String(100))

    ingredientesLI=relationship("Ingrediente",back_populates="invIng")
    proveedoresLI=relationship("Proveedores",back_populates="invP")
    LIMI=relationship("Movimientos_Inventario",back_populates="LotesMI")

    __table_args__ = (
        CheckConstraint("cantidad > 0 AND stock_actual >= 0", name="chk_cantidad_positiva_lote"),
    )

    def __repr__(self):
        return f"<LoteInventario(id={self.id}, ingrediente_id={self.ingrediente_id})>"

class Movimientos_Inventario(Base):
    __tablename__="movimientos_inventario"

    id=Column(Integer,primary_key=True,index=True)
    lote_id=Column(Integer,ForeignKey("lotes_inventario.id"),nullable=False)
    tipo_movimiento = Column(SQLEnum(TipoMovimientoEnum, name="tipo_movimiento"), nullable=False)
    cantidad=Column(DECIMAL(10,3),nullable=False)
    motivo=Column(Text)
    empleado_id=Column(Integer,ForeignKey("empleados.id"))
    referencia = Column(String(100))
    fecha_hora=Column(TIMESTAMP,default=func.now())

    empleadosMI=relationship("Empleado",back_populates="eMI")
    LotesMI=relationship("Lotes_Inventarios",back_populates="LIMI")

    __table_args__ = (
        CheckConstraint("cantidad > 0", name="chk_mov_cantidad_positiva"),
    )

    def __repr__(self):
        return f"<MovimientoInventario(id={self.id}, tipo='{self.tipo_movimiento.value}')>"

class Mermas(Base):
    __tablename__="registrarmermas"
    id=Column(Integer,primary_key=True,index=True)
    platillo_id=Column(Integer,ForeignKey("productos.id"),nullable=False)
    cantidad=Column(Integer)
    motivo=Column(Text)
    fecha_registro = Column(TIMESTAMP, server_default=func.now())

    mermas=relationship("Platillo",back_populates="PLmer")

#---------------------#
# Tablas de Auditoría #
#---------------------#

class RegistroAuditoria(Base):
    __tablename__ = "registro_auditoria"

    id = Column(Integer, primary_key=True)
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"))
    accion = Column(String(100), nullable=False)
    nombre_tabla = Column(String(50))
    registro_id = Column(Integer)
    valores_antiguos = Column(JSON)
    valores_nuevos = Column(JSON)
    marca_tiempo = Column(TIMESTAMP)

    # Relaciones
    empleado = relationship("Empleado", back_populates="registros_auditoria", lazy="joined")

class HistorialEstadosPedido(Base):
    __tablename__ = "historial_estados_pedido"

    id = Column(Integer, primary_key=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    estado_anterior = Column(SQLEnum(EstadoPedidoEnum, name="estado_pedido"), default=EstadoPedidoEnum.pendiente)
    estado_nuevo = Column(SQLEnum(EstadoPedidoEnum, name="estado_pedido"), default=EstadoPedidoEnum.pendiente, nullable=False)
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"))
    fecha_cambio = Column(TIMESTAMP, default=datetime.utcnow)
    duracion_segundos = Column(Integer)

    # Relaciones
    pedido = relationship("Pedidos", back_populates="historial_estados")
    empleado = relationship("Empleado", back_populates="historial_pedidos")

class HistorialEstadosItems(Base):
    __tablename__ = "historial_estados_items"

    id = Column(Integer, primary_key=True)
    detalle_pedido_id = Column(Integer, ForeignKey("detalles_pedido.id", ondelete="CASCADE"), nullable=False)
    estado_anterior = Column(SQLEnum(EstadoItemPedidoEnum, name="estado_item_pedido"), default=EstadoItemPedidoEnum.pendiente)
    estado_nuevo = Column(SQLEnum(EstadoItemPedidoEnum, name="estado_item_pedido"), default=EstadoItemPedidoEnum.pendiente, nullable=False)
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="SET NULL"))
    fecha_cambio = Column(TIMESTAMP, default=datetime.utcnow)

    # Relaciones
    detalle_pedido = relationship("Detalles_Pedido", back_populates="historial_items")
    empleado = relationship("Empleado", back_populates="historial_items")