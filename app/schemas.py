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
class IngredienteBase(BaseModel):
    id: int
    nombre: str
    class Config:
        from_attributes = True
class ProductoBase(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    precio: float
    imagen_url: Optional[str]
    class Config:
        from_attributes = True
class ProductoConIngredientes(ProductoBase):
    ingredientes: List[IngredienteBase] = []
class AgregarEmpleado(BaseModel):
    nombres:str
    apellidos:str
    rol:int
    telefono:str
    correo:str
    nombreUs:Optional[str]
    contrasenaUs:Optional[str]
    PIN:Optional[str]
