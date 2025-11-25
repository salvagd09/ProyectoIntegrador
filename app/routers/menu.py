from fastapi import APIRouter, Depends, HTTPException, status, Response, File, UploadFile, Form
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from decimal import Decimal
import models, schemas
from database import get_db
from utils import registrar_auditoria, serializar_db_object, transformar_producto_con_receta

router = APIRouter(
    prefix="/menu",
    tags=["Menú"]
)

# Obtener todos los productos/platillos activos
@router.get("/", response_model=List[schemas.ProductoResponse])
def listar_productos(categoria_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Retorna todos los productos activos, incluyendo su receta completa  
    Si se especifica una categoría, filtra por ella
    """
    # Construir la consulta base
    query = db.query(models.Platillo).filter(models.Platillo.producto_activo == True)
    # Cargamos la receta y sus ingredientes
    query = query.options(
        selectinload(models.Platillo.receta_asociaciones)
        .selectinload(models.Recetas.ingrediente)
    )
    # Filtrar por categoría si se proporciona
    if categoria_id:
        query = query.filter(models.Platillo.categoria_id == categoria_id)
    # Ejecutar la consulta
    productos = query.all()

    productos_listos = [transformar_producto_con_receta(p) for p in productos]
    # Verificar si hay productos
    if not productos_listos:
        raise HTTPException(status_code=404, detail="No hay productos disponibles")

    return productos_listos

# Buscar producto/platillo por texto
@router.get("/buscar/", response_model=List[schemas.ProductoResponse])
def buscar_productos(search: str, db: Session = Depends(get_db)):
    """
    Busca productos activos por nombre o descripción, incluyendo su receta
    """
    query = db.query(models.Platillo).filter(
        models.Platillo.producto_activo == True,
        (models.Platillo.nombre.ilike(f"%{search}%")) |
        (models.Platillo.descripcion.ilike(f"%{search}%"))
    )
    
    # Cargamos la receta y sus ingredientes
    query = query.options(
        selectinload(models.Platillo.receta_asociaciones)
        .selectinload(models.Recetas.ingrediente)
    )

    productos = query.all()
    productos_listos = [transformar_producto_con_receta(p) for p in productos]

    if not productos_listos:
        raise HTTPException(status_code=404, detail="No se encontraron productos con ese criterio")
    
    return productos_listos

# Obtener detalle de un producto/platillo específico
@router.get("/{producto_id}", response_model=schemas.ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    """
    Retorna la información de un producto específico, incluyendo su receta
    """
    # Cargamos el producto y su receta con ingredientes
    producto_db = db.query(models.Platillo).filter(models.Platillo.id == producto_id).options(
        selectinload(models.Platillo.receta_asociaciones)
        .selectinload(models.Recetas.ingrediente)
    ).first()
    
    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return transformar_producto_con_receta(producto_db)

# Crear un nuevo producto/platillo
@router.post("/", response_model=schemas.ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    """
    Crea un nuevo producto o platillo
    """
    # Verificar si ya existe un producto con el mismo código
    existente = db.query(models.Platillo).filter(
        models.Platillo.codigo_producto == producto.codigo_producto
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese código")

    nuevo_producto = models.Platillo(**producto.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    
    valores_nuevos = serializar_db_object(nuevo_producto)

    registrar_auditoria(
        db, 
        "CREAR", 
        f"Producto creado: {nuevo_producto.nombre}",
        nombre_tabla="productos",
        registro_id=getattr(nuevo_producto, "id"),
        valores_nuevos=valores_nuevos
    )
    
    producto_con_receta_cargada = db.query(models.Platillo).filter(models.Platillo.id == nuevo_producto.id).options(
        selectinload(models.Platillo.receta_asociaciones)
        .selectinload(models.Recetas.ingrediente)
    ).first()

    return transformar_producto_con_receta(producto_con_receta_cargada)

# Editar/Actualizar un producto/platillo existente
@router.put("/{producto_id}", response_model=schemas.ProductoResponse)
def actualizar_producto(producto_id: int, producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    """
    Edita los datos de un producto existente
    """
    producto_db = db.query(models.Platillo).filter(models.Platillo.id == producto_id).first()

    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    valores_antiguos = serializar_db_object(producto_db)

    for key, value in producto.model_dump(exclude_unset=True).items():
        setattr(producto_db, key, value)

    db.commit()
    db.refresh(producto_db)
    
    valores_nuevos = serializar_db_object(producto_db)

    registrar_auditoria(
        db, 
        "ACTUALIZAR", 
        f"Producto actualizado: {producto_db.nombre}",
        nombre_tabla="productos",
        registro_id=getattr(producto_db, "id"),
        valores_antiguos=valores_antiguos,
        valores_nuevos=valores_nuevos
    )
    
    producto_con_receta_cargada = db.query(models.Platillo).filter(models.Platillo.id == producto_db.id).options(
        selectinload(models.Platillo.receta_asociaciones)
        .selectinload(models.Recetas.ingrediente)
    ).first()
    
    return transformar_producto_con_receta(producto_con_receta_cargada)

# Desactivar un producto/platillo (soft delete)
@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_producto(producto_id: int, db: Session = Depends(get_db)):
    """
    Desactiva un producto/platillo sin eliminarlo de la base de datos
    """
    producto_db = db.query(models.Platillo).filter(models.Platillo.id == producto_id).first()

    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    setattr(producto_db, "producto_activo", False)
    db.commit()

    registrar_auditoria(
        db, 
        "DESACTIVAR", 
        f"Producto desactivado: {producto_db.nombre}",
        nombre_tabla="productos",
        registro_id=getattr(producto_db, "id"),
    )
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Reactivar un producto/platillo
@router.put("/reactivar/{producto_id}", response_model=schemas.ProductoResponse)
def reactivar_producto(producto_id: int, db: Session = Depends(get_db)):
    """
    Reactiva un producto/platillo sin eliminarlo de la base de datos
    """
    producto_db = db.query(models.Platillo).filter(models.Platillo.id == producto_id).first()
    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    setattr(producto_db, "producto_activo", True)
    db.commit()
    db.refresh(producto_db)

    registrar_auditoria(db, "REACTIVAR", f"Producto reactivado: {producto_db.nombre}")

    producto_con_receta_cargada = db.query(models.Platillo).filter(models.Platillo.id == producto_db.id).options(
        selectinload(models.Platillo.receta_asociaciones)
        .selectinload(models.Recetas.ingrediente)
    ).first()
    
    return transformar_producto_con_receta(producto_con_receta_cargada)

# Listar productos inactivos
@router.get("/inactivos/", response_model=List[schemas.ProductoResponse])
def listar_inactivos(db: Session = Depends(get_db)):
    productos = db.query(models.Platillo).filter(models.Platillo.producto_activo == False).all()
    productos_listos = [transformar_producto_con_receta(p) for p in productos]
    return productos_listos

# ------------------- GESTIÓN DE RECETAS -------------------

@router.get("/{producto_id}/receta", response_model=List[schemas.IngredienteRecetaResponse])
def obtener_receta_producto(producto_id: int, db: Session = Depends(get_db)):
    """
    Retorna la lista de ingredientes (receta) para un producto específico
    """
    producto_db = db.query(models.Platillo).filter(models.Platillo.id == producto_id).options(
        selectinload(models.Platillo.receta_asociaciones)
        .selectinload(models.Recetas.ingrediente)
    ).first()
    
    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    receta_data = []
    for r in producto_db.receta_asociaciones:
        # Asegurarse de que el ingrediente esté cargado
        ingrediente = r.ingrediente
        
        if ingrediente is None:
            continue

        receta_data.append(schemas.IngredienteRecetaResponse(
            ingrediente_id=r.ingrediente_id,
            cantidad_requerida=r.cantidad_requerida,
            nombre_ingrediente=ingrediente.nombre,
            unidad_medida=ingrediente.unidad_de_medida,
        ))
        
    return receta_data

@router.put("/{producto_id}/receta", status_code=status.HTTP_200_OK)
def actualizar_receta_producto(
    producto_id: int, 
    receta_items: List[schemas.IngredienteRecetaBase], # Lista de ingredientes y cantidades
    db: Session = Depends(get_db)
):
    """
    Reemplaza completamente la receta de un producto con la nueva lista de ingredientes
    """
    producto_db = db.query(models.Platillo).filter(models.Platillo.id == producto_id).first()

    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    try:
        # Elimina la receta existente (para reemplazar) -- fetch para mayor robustez
        db.query(models.Recetas).filter(models.Recetas.producto_id == producto_id).delete(synchronize_session='fetch')
        
        # Crea las nuevas entradas de receta
        for item in receta_items:
            # Verifica que el ingrediente exista
            ingrediente_existe = db.query(models.Ingrediente).filter(
                models.Ingrediente.id == item.ingrediente_id
            ).first()

            if not ingrediente_existe:
                raise HTTPException(status_code=400, detail=f"Ingrediente ID {item.ingrediente_id} no existe")

            # Crear la nueva asociación de receta
            nueva_receta = models.Recetas(
                producto_id=producto_id,
                ingrediente_id=item.ingrediente_id,
                cantidad_requerida=item.cantidad_requerida
            )
            db.add(nueva_receta)

        db.commit()
        
        # Auditoría
        registrar_auditoria(
            db, 
            "ACTUALIZAR", 
            f"Receta del producto {producto_db.nombre} actualizada/reemplazada",
            nombre_tabla="recetas",
            registro_id=producto_id
        )

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad de la base de datos (Ej: duplicados o valores no válidos)")
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno al procesar la receta: {e}")

    return {"detail": f"Receta para el producto ID {producto_id} actualizada exitosamente"}