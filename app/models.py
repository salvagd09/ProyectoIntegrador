from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from .database import Base

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