from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app import models, schemas
from app.database import get_db
# Importamos la auditoría y serialización para el registro de cambios
from app.utils import registrar_auditoria, serializar_db_object 
router = APIRouter(
    prefix="/ingredientes",
    tags=["Inventario - Ingredientes"]
)

def cargar_relaciones_ingrediente(query):
    return query.options(
        selectinload(models.Ingrediente.categoria_ingrediente), # Cargar la categoría
        selectinload(models.Ingrediente.proveedores_asociaciones) # Cargar las asociaciones con proveedores
    )

# Crear un nuevo ingrediente
@router.post("/", response_model=schemas.IngredienteResponse, status_code=status.HTTP_201_CREATED)
def crear_ingrediente(ingrediente: schemas.IngredienteCreate, db: Session = Depends(get_db)):
    """Crea un nuevo ingrediente en el catálogo de inventario"""
    
    # Verificar si ya existe un ingrediente con ese nombre
    existente = db.query(models.Ingrediente).filter(
        models.Ingrediente.nombre.ilike(ingrediente.nombre)
    ).first()
    
    # Si ya existe, lanzar error
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un ingrediente con ese nombre")
    
    if ingrediente.categoria_ingrediente_id:
        categoria = db.query(models.CategoriaIngrediente).filter(
            models.CategoriaIngrediente.id == ingrediente.categoria_ingrediente_id
        ).first()
        if not categoria:
            raise HTTPException(status_code=400, detail="ID de Categoría de Ingrediente no válido")

    # Crear el nuevo ingrediente
    nuevo_ingrediente = models.Ingrediente(**ingrediente.model_dump())
    db.add(nuevo_ingrediente)
    db.commit()
    db.refresh(nuevo_ingrediente)

    # Preparar la query para retornar el ingrediente con sus relaciones cargadas
    query = db.query(models.Ingrediente).filter(models.Ingrediente.id == nuevo_ingrediente.id)

    # Registro de auditoría
    valores_nuevos = serializar_db_object(nuevo_ingrediente)
    registrar_auditoria(
        db, 
        "CREAR", 
        f"Ingrediente creado: {nuevo_ingrediente.nombre}",
        nombre_tabla="ingredientes",
        registro_id=getattr(nuevo_ingrediente, "id"),
        valores_nuevos=valores_nuevos
    )
    
    return cargar_relaciones_ingrediente(query).first()

# Listar todos los ingredientes
@router.get("/", response_model=List[schemas.IngredienteResponse])
def listar_ingredientes(db: Session = Depends(get_db)):
    """Lista todos los ingredientes del catálogo"""
    # Preparar la query
    query = db.query(models.Ingrediente)
    # Cargar relaciones
    ingredientes = cargar_relaciones_ingrediente(query).all()
    return ingredientes

# Obtener detalle de un ingrediente específico
@router.get("/{ingrediente_id}", response_model=schemas.IngredienteResponse)
def obtener_ingrediente(ingrediente_id: int, db: Session = Depends(get_db)):
    """Retorna la información de un ingrediente específico"""
    # Preparar la query
    query = db.query(models.Ingrediente).filter(models.Ingrediente.id == ingrediente_id)
    # Cargar relaciones
    ingrediente_db = cargar_relaciones_ingrediente(query).first()
    
    # Verificar si el ingrediente existe
    if not ingrediente_db:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    
    return ingrediente_db

# Actualizar un ingrediente existente
@router.put("/{ingrediente_id}", response_model=schemas.IngredienteResponse)
def actualizar_ingrediente(ingrediente_id: int, ingrediente: schemas.IngredienteUpdate, db: Session = Depends(get_db)):
    """Actualiza los datos de un ingrediente existente"""
    # Obtener el ingrediente de la DB
    ingrediente_db = db.query(models.Ingrediente).filter(models.Ingrediente.id == ingrediente_id).first()

    # Verificar si el ingrediente existe
    if not ingrediente_db:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")

    # Validar categoría si se proporciona
    if ingrediente.categoria_ingrediente_id:
        categoria = db.query(models.CategoriaIngrediente).filter(
            models.CategoriaIngrediente.id == ingrediente.categoria_ingrediente_id
        ).first()
        if not categoria:
            raise HTTPException(status_code=400, detail="ID de Categoría de Ingrediente no válido")
    
    # Registrar valores antiguos para auditoría
    valores_antiguos = serializar_db_object(ingrediente_db)

    # Actualiza solo los campos que se envían (exclude_unset=True)
    for key, value in ingrediente.model_dump(exclude_unset=True).items():
        setattr(ingrediente_db, key, value)

    db.commit()
    db.refresh(ingrediente_db)

    # Preparar la query para retornar el ingrediente con sus relaciones cargadas
    query = db.query(models.Ingrediente).filter(models.Ingrediente.id == ingrediente_db.id)
    ingrediente_actualizado = cargar_relaciones_ingrediente(query).first()
    
    # Registrar valores nuevos para auditoría
    valores_nuevos = serializar_db_object(ingrediente_db)

    # Registro de auditoría
    registrar_auditoria(
        db, 
        "ACTUALIZAR", 
        f"Ingrediente actualizado: {ingrediente_db.nombre}",
        nombre_tabla="ingredientes",
        registro_id=getattr(ingrediente_db, "id"),
        valores_antiguos=valores_antiguos,
        valores_nuevos=valores_nuevos
    )
    
    return ingrediente_actualizado

# Eliminar un ingrediente
@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_ingrediente(ingrediente_id: int, db: Session = Depends(get_db)):
    """
    Elimina un ingrediente.
    Esto eliminará automáticamente todas las recetas que lo utilizan
    """
    # Obtener el ingrediente de la DB
    ingrediente_db = db.query(models.Ingrediente).filter(models.Ingrediente.id == ingrediente_id).first()

    # Verificar si el ingrediente existe
    if not ingrediente_db:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")

    db.delete(ingrediente_db)
    db.commit()

    # Registro de auditoría
    registrar_auditoria(
        db, 
        "ELIMINAR", 
        f"Ingrediente eliminado: {ingrediente_db.nombre}",
        nombre_tabla="ingredientes",
        registro_id=getattr(ingrediente_db, "id"),
    )
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)