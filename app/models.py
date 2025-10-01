from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey,Enum, Float, text
from sqlalchemy.sql import func
from .database import Base
import enum
#Los enum de las tablas
class EstadoMesaEnum(str, enum.Enum):
    Libre = "Libre"
    Ocupada = "Ocupada"
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
    descripcion=Column(String)
    cantidad=Column(Float,nullable=False,server_default=text("0"))
    precio=Column(Float,nullable=False,server_default=text("0"))
    unidad_medida=Column(String(20),nullable=False)
    stock=Column(Float,nullable=False,server_default=text("0"))
    es_Perecible=Column(Boolean,nullable=False,server_default=text("False"))