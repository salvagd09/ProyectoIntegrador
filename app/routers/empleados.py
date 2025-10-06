from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import join, select
from .. import models, database,schemas
router=APIRouter(prefix="/empleados",tags=["empleados"])
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/")
def MostrarEmpleados(db:Session=Depends(get_db)):
    empleados=db.query(models.Empleado,models.Roles.nombre.label("nombre_rol")).join(models.Roles,models.Empleado.rol_id==models.Roles.id).order_by(models.Empleado.id.asc()).all()
    mostrar_empleados=[]
    for empleado,nombre_rol in empleados:
        mostrar_empleados.append({
            "id":empleado.id,
            "nombre":empleado.nombre,
            "apellido":empleado.apellido,
            "rol":nombre_rol,
            "nombreUs":empleado.username,
            "telefono":empleado.telefono,
            "correo_electronico":empleado.email
        })
    return mostrar_empleados
@router.get("/agregar")
def AgregarEmpleado(data:schemas.AgregarEmpleado,db: Session=Depends(get_db)):
    nuevo_empleado=models.Empleado(
        nombres=data.nombres,
        apellidos=data.apellidos,
        rol_id=data.rol,
        nombreUs=data.nombreUs,
        contrasena_hash=data.contrasenaUs,
        pin_code_hash=data.PIN,
        telefono=data.telefono,
        correo=data.correo
    )
    db.add(nuevo_empleado)
    db.commit()
    db.refresh(nuevo_empleado)
    return{
        "id": nuevo_empleado.id,
        "nombre":nuevo_empleado.nombre,
        "apellido": nuevo_empleado.apellido,
        "rol":nuevo_empleado.rol_id,
        "telefono":nuevo_empleado.telefono,
        "correo":nuevo_empleado.correo
    }