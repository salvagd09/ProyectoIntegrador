from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db
from app.utils import registrar_auditoria 

router = APIRouter(
    prefix="/categorias",
    tags=["Categorías"]
)

# Listar todas las categorías
@router.get("/", response_model=List[schemas.CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db)):
    """Lista todas las categorías, ordenadas por índice de orden"""
    categorias = db.query(models.Categoria).order_by(models.Categoria.indice_orden).all()
    return categorias

# Crear una nueva categoría
@router.post("/", response_model=schemas.CategoriaResponse, status_code=status.HTTP_201_CREATED)
def crear_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    """Crea una nueva categoría de producto"""
    
    # Verificar si ya existe una categoría con ese nombre
    existente = db.query(models.Categoria).filter(
        models.Categoria.nombre.ilike(categoria.nombre)
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")

    # Crear la nueva categoría
    nueva_categoria = models.Categoria(**categoria.dict())
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)

    # Registro de auditoría
    registrar_auditoria(
        db, 
        "CREAR", 
        f"Categoría creada: {nueva_categoria.nombre}",
        nombre_tabla="categorias",
        registro_id=getattr(nueva_categoria, "id"),
    )
    
    return nueva_categoria

# Actualizar una categoría
@router.put("/{categoria_id}", response_model=schemas.CategoriaResponse)
def actualizar_categoria(categoria_id: int, categoria: schemas.CategoriaUpdate, db: Session = Depends(get_db)):
    """Actualiza la información de una categoría existente"""
    categoria_db = db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()
    
    # Verificar si la categoría existe
    if not categoria_db:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Actualizar campos
    update_data = categoria.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(categoria_db, key, value)
        
    db.commit()
    db.refresh(categoria_db)

    # Registro de auditoría
    registrar_auditoria(
        db, 
        "ACTUALIZAR", 
        f"Categoría actualizada: {categoria_db.nombre}",
        nombre_tabla="categorias",
        registro_id=getattr(categoria_db, "id"),
    )
    return categoria_db

# Eliminar una categoría
@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    """Elimina una categoría. NOTA: Esto podría afectar a los productos asociados"""
    categoria_db = db.query(models.Categoria).filter(models.Categoria.id == categoria_id).first()

    # Verificar si la categoría existe
    if not categoria_db:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    db.delete(categoria_db)
    db.commit()

    # Registro de auditoría
    registrar_auditoria(
        db, 
        "ELIMINAR", 
        f"Categoría eliminada: {categoria_db.nombre}",
        nombre_tabla="categorias",
        registro_id=getattr(categoria_db, "id"),
    )
    
    return {"detail": "Categoría eliminada con éxito"}