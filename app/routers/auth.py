from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from typing import Optional
from .. import models, database, schemas

router = APIRouter(prefix="/auth", tags=["Auth"])
#Para encriptar la contraseña que se envían y coincida
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login-password")
def login_password(data: schemas.LoginPassword, db: Session = Depends(get_db)):
    emp = db.query(models.Empleado).filter(
        models.Empleado.username == data.username,
        models.Empleado.esta_activo == True
    ).first()

    if not emp:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    hashed_password_value: Optional[str] = str(emp.password_hash) if emp.password_hash else None # type: ignore

    if not hashed_password_value or not pwd_context.verify(data.password, hashed_password_value):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    return {"rol_id": emp.rol_id, "id": emp.id}

@router.post("/login-pin")
def login_pin(data: schemas.LoginPin, db: Session = Depends(get_db)):
    mozos = db.query(models.Empleado).filter(
        models.Empleado.rol_id == 1,
        models.Empleado.esta_activo == True
    ).all()
    
    for emp in mozos:
        pin_hash: Optional[str] = str(emp.pin_code_hash) if emp.pin_code_hash else None # type: ignore
        
        if pin_hash and pwd_context.verify(data.pin_code, pin_hash):
            return {"rol_id": emp.rol_id, "id": emp.id}
        
    raise HTTPException(status_code=401, detail="PIN inválido")



