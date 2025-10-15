from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from .. import models, database, schemas

router = APIRouter(prefix="/auth", tags=["Auth"])
#Para encriptar la contraseña que se envían y coincida
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    if not emp or not data.password== emp.contrasena_hash:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {"rol_id": emp.rol_id, "id": emp.id}

@router.post("/login-pin")
def login_pin(data: schemas.LoginPin, db: Session = Depends(get_db)):
    mozos = db.query(models.Empleado).filter(models.Empleado.rol_id == 1).all()
    for emp in mozos:
        if data.pin_code== emp.pin_code_hash:
            return {"rol_id": emp.rol_id, "id": emp.id}
    raise HTTPException(status_code=401, detail="PIN inválido")



