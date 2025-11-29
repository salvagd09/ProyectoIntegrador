from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import models, schemas
from enum import Enum
from datetime import datetime, date
from decimal import Decimal 

# Función registrar auditoría
def registrar_auditoria(
    db: Session, 
    accion: str, 
    descripcion: str, 
    empleado_id: Optional[int] = None, 
    nombre_tabla: Optional[str] = None,       
    registro_id: Optional[int] = None,
    valores_antiguos: Optional[Dict[str, Any]] = None,
    valores_nuevos: Optional[Dict[str, Any]] = None    
):
    """
    Registra una acción de auditoría en la base de datos
    
    """
    # Crear el registro de auditoría
    nuevo_registro = models.RegistroAuditoria(
        accion=f"[{accion}] {descripcion}",
        nombre_tabla=nombre_tabla,
        registro_id=registro_id,
        valores_antiguos=valores_antiguos,
        valores_nuevos=valores_nuevos,
        empleado_id=empleado_id
    )
    
    db.add(nuevo_registro)
    db.commit()

def serializar_db_object(db_object):
    """
    Convierte un objeto SQLAlchemy a un dict apto para JSON, manejando tipos no serializables.
    """
    # Crear un dict con los atributos del objeto
    data = {}
    for key, value in db_object.__dict__.items():
        if key.startswith('_'):
            continue
        
        # Maneja Decimal (como el precio en Productos)
        if isinstance(value, Decimal):
            data[key] = float(value)
        elif isinstance(value, (datetime, date)):
            data[key] = value.isoformat() # Formato ISO para fechas
        elif isinstance(value, Enum):
            data[key] = value.value # Usar el valor del Enum
        elif isinstance(value, object) and hasattr(value, '__table__'):
            # Ignorar otros objetos complejos de SQLAlchemy (relaciones, etc.)
            continue
        else:
            data[key] = value
    return data

# --- Funciones de Transformación (Helper para evitar duplicar código) ---
def transformar_producto_con_receta(p: models.Platillo) -> schemas.ProductoResponse:
    """Transforma un objeto Producto de SQLAlchemy a un ProductoResponse de Pydantic, 
    incluyendo la lista de ingredientes de la receta."""
    
    producto_data = p.__dict__.copy()
    receta_data = []
    
    for r in p.receta_asociaciones:
        ingrediente = r.ingrediente
        
        # Debe estar cargado, si es None es inconsistencia en BD, lo ignoramos.
        if ingrediente is None:
            continue 

        receta_data.append(schemas.IngredienteRecetaResponse(
            ingrediente_id=r.ingrediente_id,
            cantidad_requerida=r.cantidad_requerida,
            # Acceso directo a los valores
            nombre_ingrediente=ingrediente.nombre,
            unidad_medida=ingrediente.unidad_de_medida,
        ))
    
    producto_data['ingredientes_receta'] = receta_data
    return schemas.ProductoResponse.model_validate(producto_data)