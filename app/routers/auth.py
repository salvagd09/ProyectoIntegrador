from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
from typing import Optional
from logging_config import setup_loggers
import logging
setup_loggers()
logger = logging.getLogger("auth_logger")
from app import database, schemas, models
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
        logger.warning('Las credenciales ingresadas son inválidas')
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    hashed_password_value: Optional[str] = str(emp.password_hash) if emp.password_hash else None # type: ignore

    if not hashed_password_value or not pwd_context.verify(data.password, hashed_password_value):
        logger.warning(f'Intento de logging fallido de usuario:{data.username}')
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    logger.info(f"Login exitoso para usuario '{emp.username}' (id={emp.id}, rol={emp.rol_id})")
    return {
        "id": emp.id,
        "nombre": emp.nombre,
        "apellido": emp.apellido,
        "rol_id": emp.rol_id, 
        "rol_nombre": emp.rol.nombre if emp.rol else None,
        "email": emp.email
    }

@router.post("/login-pin")
def login_pin(data: schemas.LoginPin, db: Session = Depends(get_db)):
    mozos = db.query(models.Empleado).filter(
        models.Empleado.rol_id == 1,
        models.Empleado.esta_activo == True
    ).all()
    
    for emp in mozos:
        pin_hash: Optional[str] = str(emp.pin_code_hash) if emp.pin_code_hash else None # type: ignore
        
        if pin_hash and pwd_context.verify(data.pin_code, pin_hash):
            logger.info("Ingreso del mesero exitoso")
            return {
                "id": emp.id,
                "nombre": emp.nombre,
                "apellido": emp.apellido,
                "rol_id": emp.rol_id, 
                "rol_nombre": emp.rol.nombre if emp.rol else None,
                "email": emp.email
            }
    logger.warning(f"Intento fallido de inicio de sesión de mesero")
    raise HTTPException(status_code=401, detail="PIN inválido")
@router.get("/healthA")
def login_health(db: Session = Depends(get_db)):
    try:
        #Verifica si existe una conexión a la base de datos
        db.execute(text("SELECT 1"))
        #Se demuestra que el router funciona 
        return {
            "status": "ok",
            "login_module": "ready",
            "db": "connected"
        }
    except Exception as e:
        print("Error en health check:", e)
        return {
            "status": "error",
            "db": "failed"
        }