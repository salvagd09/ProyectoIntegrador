from pydantic import BaseModel
from typing import Optional
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
    