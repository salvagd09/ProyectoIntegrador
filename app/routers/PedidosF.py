from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session,joinedload
from sqlalchemy import join, select
from typing import List
from .. import models, database,schemas
router=APIRouter(prefix="/pedidosF",tags=["pedidosF"])
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/platillos", response_model=None)
def listar_productos(db: Session = Depends(get_db)):
    productos=db.query(models.Platillo).all()
    mostrar_menu=[]
    for producto in productos:
        mostrar_menu.append({
            "id": producto.id,
            "nombre": producto.nombre,
            "precio":producto.precio
        })
    return mostrar_menu
@router.get("/mesas")
def Mostrar_mesas(db:Session=Depends(get_db)):
    mesas=db.query(models.Mesas).order_by(models.Mesas.id.asc()).all()
    mostrar_mesas = []
    for mesa in mesas:
        mostrar_mesas.append({
            "id":mesa.id,
            "numero": mesa.numero
        })
    return mostrar_mesas
@router.get("/pedidosM", response_model=List[schemas.MostrarPedido])
def Mostrar_Pedidos(db: Session = Depends(get_db)):
    pedidos = db.query(models.Pedidos).all()
    
    mostrar_pedidos = []
    
    for pedido in pedidos:
        # Obtener mesa
        mesa_numero = f"Mesa {pedido.mesas.numero}" if pedido.mesas else "Sin mesa"
        
        # Formatear hora
        hora = pedido.fecha_creacion.strftime("%H:%M")
        
        # Construir items desde la relación Dpedido
        items = []
        for detalle in pedido.Dpedido:
            items.append({
                "nombre": detalle.platillos.nombre,
                "cantidad": detalle.cantidad,
                "precio_unitario": float(detalle.precio_unitario)
            })
        
        # Agregar al resultado
        mostrar_pedidos.append({
            "id": pedido.id,
            "mesa": mesa_numero,
            "estado": pedido.estado,
            "hora": hora,
            "monto_total": float(pedido.monto_total),
            "items": items
        })
    return mostrar_pedidos
