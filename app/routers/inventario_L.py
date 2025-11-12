from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal

from app import models, schemas
from app.database import get_db
from app.utils import registrar_auditoria, serializar_db_object



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
        selectinload(models.Lotes_Inventarios.ingrediente),
        selectinload(models.Lotes_Inventarios.proveedoresLI)
    ).first()
    
    # Pre-cargar datos para la auditoría
    ingrediente_nombre = lote_cargado.ingrediente.nombre if lote_cargado.ingrediente else "N/A"
    ingrediente_unidad = lote_cargado.ingrediente.unidad_de_medida if lote_cargado.ingrediente else "unidad"
    
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
        nombre_ingrediente=lote_cargado.ingrediente.nombre if lote_cargado.ingrediente else "N/A",
        nombre_proveedor=lote_cargado.proveedoresLI.nombre if lote_cargado.proveedoresLI else None,
        empleado_id=empleado_id_final  # ✅ Agregar manualmente
    )

    return response

# Listar stock total agregado por ingrediente
@router.get("/stock/total", response_model=List[schemas.StockTotalResponse])
def listar_stock_agregado(db: Session = Depends(get_db)):
    """
    Calcula y lista el stock total (sumado por todos los lotes activos) de cada ingrediente
    """
    # Consulta agregada para sumar el stock_actual por ingrediente
    stock_agregado = db.query(
        models.Ingrediente.id.label("ingrediente_id"),
        models.Ingrediente.nombre.label("nombre_ingrediente"),
        models.Ingrediente.unidad_de_medida.label("unidad_medida"),
        func.sum(models.Lotes_Inventarios.stock_actual).label("stock_total")
    ).join(models.Lotes_Inventarios, models.Lotes_Inventarios.ingrediente_id == models.Ingrediente.id).group_by(
        models.Ingrediente.id,
        models.Ingrediente.nombre,
        models.Ingrediente.unidad_de_medida
    ).filter(
        models.Lotes_Inventarios.stock_actual > Decimal('0')
    ).all()

    # Verificar si hay stock disponible
    if not stock_agregado:
        raise HTTPException(status_code=404, detail="No se encontró stock activo en ningún lote.")
    
    # Preparar la respuesta
    return [schemas.StockTotalResponse(
        ingrediente_id=row.ingrediente_id,
        nombre_ingrediente=row.nombre_ingrediente,
        unidad_medida=row.unidad_medida,
        stock_total=row.stock_total 
    ) for row in stock_agregado]

# Listar lotes activos por ingrediente
@router.get("/lotes/ingrediente/{ingrediente_id}", response_model=List[schemas.LoteResponse])
def listar_lotes_por_ingrediente(ingrediente_id: int, db: Session = Depends(get_db)):
    """
    Lista todos los lotes activos para un ingrediente específico,
    ordenados por fecha de vencimiento
    """
    # Consulta los lotes activos para el ingrediente dado
    lotes_db = db.query(models.Lotes_Inventarios).filter(
        models.Lotes_Inventarios.ingrediente_id == ingrediente_id,
        models.Lotes_Inventarios.stock_actual > Decimal('0')
    ).order_by(
        models.Lotes_Inventarios.fecha_vencimiento.asc(),
        models.Lotes_Inventarios.fecha_ingreso.asc()
    ).options(
        selectinload(models.Lotes_Inventarios.ingrediente),
        selectinload(models.Lotes_Inventarios.proveedoresLI)
    ).all()
    
    # Verificar si se encontraron lotes
    if not lotes_db:
        raise HTTPException(status_code=404, detail="No se encontraron lotes activos para este ingrediente.")

    # Preparar la respuesta
    resultados = []
    for lote in lotes_db:
        response = schemas.LoteResponse.model_validate(lote)
        response.nombre_ingrediente = lote.ingrediente.nombre if lote.ingrediente else None
        response.nombre_proveedor = lote.proveedoresLI.nombre if lote.proveedoresLI else None
        resultados.append(response)
        
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
        joinedload(models.Movimientos_Inventario.LotesMI).joinedload(models.Lotes_Inventarios.ingrediente),
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
        raise HTTPException(status_code=404, detail="No se encontraron movimientos con los criterios especificados")

    # Preparar la respuesta
    resultados = []
    for mov in movimientos:
        response = schemas.MovimientoInventarioResponse.model_validate(mov)
        
        nombre_ingrediente = mov.LotesMI.ingrediente.nombre if mov.LotesMI and mov.LotesMI.ingrediente else "N/A"
        empleado = mov.empleadosMI
        if empleado:
            apellido = empleado.apellido if empleado.apellido else "" 
            nombre_empleado = f"{empleado.nombre} {apellido}".strip()
        else:
            nombre_empleado = "Sistema"

        response.nombre_ingrediente = nombre_ingrediente
        response.nombre_empleado = nombre_empleado # Asignamos la variable corregida

        resultados.append(response)
    return resultados