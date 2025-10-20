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
@router.post("/agregar")
def AgregarEmpleado(data:schemas.AgregarEmpleado,db: Session=Depends(get_db)):
    nuevo_empleado=models.Empleado(
        nombre=data.nombres,
        apellido=data.apellidos,
        rol_id=data.rol,
        username=data.nombreUs,
        contrasena_hash=data.contrasenaUs,
        pin_code_hash=data.PIN,
        telefono=data.telefono,
        email=data.correo
    )
    db.add(nuevo_empleado)
    db.commit()
    db.refresh(nuevo_empleado)
    rol_nombre = db.query(models.Roles.nombre).filter(models.Roles.id == data.rol).scalar()
    return{
        "id": nuevo_empleado.id,
        "nombre": nuevo_empleado.nombre,
        "apellido": nuevo_empleado.apellido,
        "rol": rol_nombre, 
        "nombreUs": nuevo_empleado.username,
        "telefono": nuevo_empleado.telefono,
        "correo_electronico": nuevo_empleado.email
    }
@router.put("/editar/{id}")
def EditarEmpleado(id:int,data:schemas.EditarEmpleado,db:Session=Depends(get_db)):
    empleado=db.query(models.Empleado).filter(models.Empleado.id==id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    campos_mapeo = {
        "nombres": "nombre",
        "apellidos": "apellido",
        "correo": "email",
        "rol": "rol_id",
        "telefono": "telefono",
        "nombreUs": "username",
        "contrasenaUs": "contrasena_hash",
        "PIN": "pin_code_hash",
    }
    for campo,valor in data.dict(exclude_unset=True).items():
          if campo in campos_mapeo:
            if campo in ["nombreUs", "contrasenaUs", "PIN","rol"] and (valor is None or valor == ""):
                continue
            setattr(empleado, campos_mapeo[campo], valor)
    db.commit()
    db.refresh(empleado)
    rol_nombre = (
        db.query(models.Roles.nombre)
        .filter(models.Roles.id == empleado.rol_id)
        .scalar()
    )
    # 🔁 Devolver el mismo formato que el GET
    return {
        "id": empleado.id,
        "nombre": empleado.nombre,
        "apellido": empleado.apellido,
        "rol": rol_nombre,
        "nombreUs": empleado.username,
        "telefono": empleado.telefono,
        "correo_electronico": empleado.email,
    }
@router.delete("/eliminar/{id}")
def eliminar_empleado(id: int, db: Session = Depends(get_db)):
    empleado = db.query(models.Empleado).filter(models.Empleado.id == id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    db.delete(empleado)
    db.commit()
    return {"mensaje": "Empleado eliminado correctamente"}
