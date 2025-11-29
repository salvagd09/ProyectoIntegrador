from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func,exists,or_
from typing import List, Optional
from decimal import Decimal
from datetime import date
import models, schemas
from database import get_db
from utils import registrar_auditoria, serializar_db_object
from logging_config import setup_loggers
import logging
setup_loggers()
app_logger = logging.getLogger("app_logger")
error_logger = logging.getLogger("error_logger")
router = APIRouter(
    prefix="/inventario_L",
    tags=["Inventario_L"]
)

# Registrar un nuevo lote de ingredientes (Entrada de Stock)
@router.post("/lote", response_model=schemas.LoteResponse, status_code=status.HTTP_201_CREATED)
def registrar_ingreso_lote(lote_data: schemas.LoteCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo lote de ingredientes (Entrada de Stock) y lo marca como AJUSTE
    """
    EMPLEADO_ID_SISTEMA = 7
    
    ingrediente_db = db.query(models.Ingrediente).filter(
        models.Ingrediente.id == lote_data.ingrediente_id
    ).first()
    
    if not ingrediente_db:
        app_logger.warning(f'El ingrediente {ingrediente_db.nombre} no se encuentra ')
        raise HTTPException(
            status_code=404, 
            detail=f"Ingrediente ID {lote_data.ingrediente_id} no encontrado"
        )
    nuevo_lote = models.Lotes_Inventarios(
        ingrediente_id=lote_data.ingrediente_id,
        proveedor_id=lote_data.proveedor_id,
        cantidad=lote_data.cantidad,
        stock_actual=lote_data.cantidad, 
        fecha_vencimiento=lote_data.fecha_vencimiento,
        numero_lote=lote_data.numero_lote
    )
    db.add(nuevo_lote)
    db.flush() 
    empleado_id_final = lote_data.empleado_id or EMPLEADO_ID_SISTEMA

    # Registrar el movimiento de ajuste por ingreso de lote
    movimiento = models.Movimientos_Inventario(
        lote_id=nuevo_lote.id,
        tipo_movimiento=models.TipoMovimientoEnum.ajuste,
        cantidad=lote_data.cantidad,
        motivo="Ingreso por compra de nuevo lote",
        empleado_id=empleado_id_final,
        referencia=f"Lote {nuevo_lote.numero_lote or nuevo_lote.id}"
    )
    db.add(movimiento)

    db.commit()
    db.refresh(nuevo_lote)

    # Cargar relaciones para la respuesta
    lote_cargado = db.query(models.Lotes_Inventarios).filter(
        models.Lotes_Inventarios.id == nuevo_lote.id
    ).options(
        selectinload(models.Lotes_Inventarios.ingredientesLI),
        selectinload(models.Lotes_Inventarios.proveedoresLI)
    ).first()
    # Pre-cargar datos para la auditoría
    ingrediente_nombre = lote_cargado.ingredientesLI.nombre if lote_cargado.ingredientesLI else "N/A"
    ingrediente_unidad = lote_cargado.ingredientesLI.unidad_de_medida if lote_cargado.ingredientesLI else "unidad"
    valores_nuevos = serializar_db_object(lote_cargado)
    registrar_auditoria(
        db, 
        "CREAR", 
        f"Lote {lote_cargado.numero_lote or nuevo_lote.id}",  # ✅ Acortado
        nombre_tabla="lotes_inventario",
        registro_id=lote_cargado.id,
        valores_nuevos=valores_nuevos,
        empleado_id=empleado_id_final,
    )
    # ✅ Construir respuesta manualmente con todos los campos
    response = schemas.LoteResponse(
        id=lote_cargado.id,
        ingrediente_id=lote_cargado.ingrediente_id,
        proveedor_id=lote_cargado.proveedor_id,
        cantidad=lote_cargado.cantidad,
        stock_actual=lote_cargado.stock_actual,
        fecha_vencimiento=lote_cargado.fecha_vencimiento,
        fecha_ingreso=lote_cargado.fecha_ingreso,
        numero_lote=lote_cargado.numero_lote,
        ingrediente_unidad=ingrediente_unidad if ingrediente_unidad else "unidad",
        nombre_proveedor=lote_cargado.proveedoresLI.nombre if lote_cargado.proveedoresLI else None,
        empleado_id=empleado_id_final  # ✅ Agregar manualmente
    )
    app_logger.info(f'El lote {lote_cargado.numero_lote} ha sido registrado')
    return response
#Para que el botón tenga solo productos que han sufrido de movimientos
@router.get("/ingredientes-con-lotes", response_model=List[schemas.IngredienteSimple])
def listar_ingredientes_con_lotes(db: Session = Depends(get_db)):
    """
    Lista todos los ingredientes que tienen al menos un lote activo.
    Útil para poblar el dropdown de filtros.
    """
    # Consulta los lotes activos para el ingrediente dado
    ids_con_lotes = db.query(models.Lotes_Inventarios.ingrediente_id).filter(
        models.Lotes_Inventarios.stock_actual > Decimal('0')
    ).distinct().all()
    ids_lista = [id_tupla[0] for id_tupla in ids_con_lotes]
    if not ids_lista:
        app_logger.warning("No hay ingredientes con lotes activos")
        raise HTTPException(
            status_code=404, 
            detail="No hay ingredientes con lotes activos"
        )
    ingredientes = db.query(models.Ingrediente).filter(
        models.Ingrediente.id.in_(ids_lista)
    ).order_by(
        models.Ingrediente.nombre.asc()
    ).all()
    # ✅ Ahora los objetos se cargan correctamente
    app_logger.info("Se han listado ingredientes con lotes")
    return [
        schemas.IngredienteSimple(
            id=ing.id,
            nombre=ing.nombre,
            unidad_de_medida=ing.unidad_de_medida
        )
        for ing in ingredientes
    ]
# Listar lotes activos por ingrediente
@router.get("/lotes/ingrediente/{ingrediente_id}", response_model=List[schemas.LoteResponse])
def listar_lotes_por_ingrediente(ingrediente_id: int, db: Session = Depends(get_db)):
    """
    Lista todos los lotes activos para un ingrediente específico,
    ordenados por fecha de vencimiento
    """
    hoy = date.today()
    # Consulta los lotes activos para el ingrediente dado
    lotes_db = db.query(models.Lotes_Inventarios).filter(
        models.Lotes_Inventarios.ingrediente_id == ingrediente_id,
        models.Lotes_Inventarios.stock_actual > Decimal('0'),
       or_(
        models.Lotes_Inventarios.fecha_vencimiento > hoy,  
       )
    ).order_by(
        models.Lotes_Inventarios.fecha_vencimiento.asc(),
        models.Lotes_Inventarios.fecha_ingreso.asc()
    ).options(
        selectinload(models.Lotes_Inventarios.ingredientesLI),
        selectinload(models.Lotes_Inventarios.proveedoresLI),
        selectinload(models.Lotes_Inventarios.LIMI)
    ).all()
    
    # Verificar si se encontraron lotes
    if not lotes_db:
        app_logger.warning("No hay lotes activos para este ingrediente")
        raise HTTPException(status_code=404, detail="No se encontraron lotes activos para este ingrediente.")

    # Preparar la respuesta
    resultados = []
    for lote in lotes_db:
        response = schemas.LoteResponse(
            id=lote.id,
            ingrediente_id=lote.ingrediente_id,
            proveedor_id=lote.proveedor_id,
            cantidad=lote.cantidad,
            stock_actual=lote.stock_actual,
            fecha_vencimiento=lote.fecha_vencimiento,
            fecha_ingreso=lote.fecha_ingreso,
            numero_lote=lote.numero_lote,
            empleado_id=None,  # No existe en el modelo Lotes_Inventarios
            nombre_ingrediente=lote.ingredientesLI.nombre if lote.ingredientesLI else None,
            nombre_proveedor=lote.proveedoresLI.nombre if lote.proveedoresLI else None
        )
        resultados.append(response)
    app_logger.info("Se han logrado listar lotes activos por ingrediente")
    return resultados
# Registrar una salida de stock
@router.post("/salida/{ingrediente_id}", response_model=List[schemas.MovimientoInventarioResponse], status_code=status.HTTP_200_OK)
def registrar_salida_stock(
    ingrediente_id: int, 
    cantidad_a_consumir: Decimal, 
    tipo_movimiento: models.TipoMovimientoEnum = Query(models.TipoMovimientoEnum.consumo, description="Tipo de movimiento: 'consumo', 'merma', o 'ajuste'"),
    referencia_salida: Optional[str] = None,
    empleado_id: Optional[int] = Query(None, description="ID del empleado que registra el movimiento"),
    auto_commit: bool = True, 
    db: Session = Depends(get_db)
):
    """
    Registra una salida de stock usando la lógica FIFO
    """
    EMPLEADO_ID_SISTEMA = 7 
    # Validar cantidad
    cantidad_requerida = Decimal(str(cantidad_a_consumir)) # Convertir a Decimal de forma segura
    cantidad_restante = cantidad_requerida
    movimientos_realizados = []
    
    # Obtener lotes activos ordenados por fecha de vencimiento (FIFO)
    lotes_activos = db.query(models.Lotes_Inventarios).filter(
        models.Lotes_Inventarios.ingrediente_id == ingrediente_id,
        models.Lotes_Inventarios.stock_actual > Decimal('0')
    ).order_by(
        models.Lotes_Inventarios.fecha_vencimiento.asc(),
        models.Lotes_Inventarios.fecha_ingreso.asc()
    ).with_for_update().all()

    # Verificar si hay stock suficiente
    stock_total = sum(lote.stock_actual for lote in lotes_activos)
    if stock_total < cantidad_requerida: # type: ignore
        app_logger.warning("No hay stock suficiente para registrar salida")
        raise HTTPException(status_code=400, detail=f"Stock insuficiente. Se requiere {cantidad_requerida:.3f}, pero solo hay {stock_total:.3f} de {ingrediente_id}")
    # Procesar la salida de stock usando FIFO
    ingrediente_db = db.query(models.Ingrediente).filter(models.Ingrediente.id == ingrediente_id).first()
    ingrediente_nombre = ingrediente_db.nombre if ingrediente_db else "N/A"
    ingrediente_unidad = ingrediente_db.unidad_de_medida if ingrediente_db else "unidad"
    motivo_movimiento = f"{tipo_movimiento.value.upper()} de {cantidad_requerida:.3f} de {ingrediente_nombre}"

    cantidad_consumida_total = Decimal('0')
    # Consumir stock de los lotes disponibles
    for lote in lotes_activos:
        if cantidad_restante <= Decimal('0'): # type: ignore
            break

        cantidad_disponible = lote.stock_actual
        
        if cantidad_restante >= cantidad_disponible: # type: ignore
            cantidad_consumida_lote = cantidad_disponible
            lote.stock_actual = Decimal('0') # type: ignore
        else:
            cantidad_consumida_lote = cantidad_restante
            lote.stock_actual = lote.stock_actual - cantidad_consumida_lote # type: ignore

        # Registrar el movimiento de salida
        movimiento = models.Movimientos_Inventario(
            lote_id=lote.id,
            tipo_movimiento=tipo_movimiento,
            cantidad=cantidad_consumida_lote,
            motivo=motivo_movimiento,
            empleado_id=empleado_id or EMPLEADO_ID_SISTEMA,
            referencia=referencia_salida or f"Lote ID {lote.id}"
        )
        db.add(movimiento)
        db.flush() 

        # Agregar a la lista de movimientos realizados
        movimientos_realizados.append(movimiento)
        cantidad_restante -= cantidad_consumida_lote

    db.commit()

    cantidad_consumida_total = cantidad_requerida - cantidad_restante 
    total_consumido_float = float(cantidad_consumida_total)  

    # Preparar la respuesta
    registrar_auditoria(
        db, 
        tipo_movimiento.value.upper(),  # Solo el tipo: "CONSUMO", "MERMA", "AJUSTE"
        f"{total_consumido_float:.2f} {ingrediente_unidad} - {ingrediente_nombre[:30]}",  # ✅ Mensaje más corto
        nombre_tabla="movimientos_inventario",
        valores_nuevos={
            "cantidad_total": total_consumido_float, 
            "tipo": tipo_movimiento.value, 
            "referencia": referencia_salida
        },
        empleado_id=empleado_id or EMPLEADO_ID_SISTEMA
    )
    # Preparar las respuestas
    respuestas = []
    for mov in movimientos_realizados:
        db.refresh(mov)
        response = schemas.MovimientoInventarioResponse.model_validate(mov)
        response.nombre_ingrediente = str(ingrediente_nombre)
        respuestas.append(response)
    app_logger.info("La salida ha sido registrada correctamente")
    return respuestas
# Listar historial de movimientos de inventario
@router.get("/movimientos/historial", response_model=List[schemas.MovimientoInventarioResponse])
def listar_historial_movimientos(
    ingrediente_id: Optional[int] = None, 
    tipo_movimiento: Optional[models.TipoMovimientoEnum] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna el historial de movimientos de inventario, con opciones de filtro
    """
    # Construir la consulta base
    query = db.query(models.Movimientos_Inventario).options(
        joinedload(models.Movimientos_Inventario.LotesMI).joinedload(models.Lotes_Inventarios.ingredientesLI),  # ✅ Corregido
        joinedload(models.Movimientos_Inventario.empleadosMI)
    ).order_by(models.Movimientos_Inventario.fecha_hora.desc())
    
    # Aplicar filtros si se proporcionan
    if ingrediente_id:
        query = query.join(models.Lotes_Inventarios).filter(models.Lotes_Inventarios.ingrediente_id == ingrediente_id)
        
    if tipo_movimiento:
        query = query.filter(models.Movimientos_Inventario.tipo_movimiento == tipo_movimiento)

    # Limitar resultados para evitar sobrecarga
    movimientos = query.limit(100).all()
    
    # Verificar si se encontraron movimientos
    if not movimientos:
        app_logger.warning("No hay movimientos con los criterios especificados")
        raise HTTPException(status_code=404, detail="No se encontraron movimientos con los criterios especificados")

    # Preparar la respuesta
    resultados = []
    for mov in movimientos:
        response = schemas.MovimientoInventarioResponse.model_validate(mov)
        
        nombre_ingrediente = mov.LotesMI.ingredientesLI.nombre if mov.LotesMI and mov.LotesMI.ingredientesLI else "N/A"  # ✅ Corregido
        empleado = mov.empleadosMI
        if empleado:
            apellido = empleado.apellido if empleado.apellido else "" 
            nombre_empleado = f"{empleado.nombre} {apellido}".strip()
        else:
            nombre_empleado = "Sistema"
        response.nombre_ingrediente = nombre_ingrediente
        response.nombre_empleado = nombre_empleado
        resultados.append(response)
    app_logger.info("Se ha conseguido obtener el historial de movimientos deseado")
    return resultados