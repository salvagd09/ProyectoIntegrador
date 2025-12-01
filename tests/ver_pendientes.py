"""
Script de DIAGNÓSTICO para investigar los pedidos
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno PRIMERO
load_dotenv(encoding='utf-8')

# Agregar el directorio raíz al path para poder importar 'app'
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app import models
from sqlalchemy import or_

def diagnosticar_pedidos():
    """Investiga qué hay en las tablas de pedidos"""
    
    print("=" * 70)
    print("🔍 DIAGNÓSTICO DE PEDIDOS")
    print("=" * 70)
    print()
    
    db = SessionLocal()
    
    try:
        # 1. Ver TODOS los pedidos recientes
        print("📋 ÚLTIMOS 10 PEDIDOS (todas las tablas):")
        print("-" * 70)
        
        pedidos_recientes = db.query(models.Pedidos).order_by(models.Pedidos.id.desc()).limit(10).all()
        
        for pedido in pedidos_recientes:
            print(f"\n🎯 PEDIDO ID: {pedido.id}")
            print(f"   Tabla Pedidos:")
            print(f"   - Tipo: {pedido.tipo_pedido}")
            print(f"   - Estado: {pedido.estado}")
            print(f"   - Monto: S/. {pedido.monto_total}")
            print(f"   - Fecha: {pedido.fecha_creacion}")
            
            # Buscar en Pedidos_Delivery
            delivery_info = db.query(models.Pedidos_Delivery).filter(
                models.Pedidos_Delivery.pedido_id == pedido.id
            ).first()
            
            if delivery_info:
                print(f"   Tabla Pedidos_Delivery:")
                print(f"   - Cliente: {delivery_info.nombre_cliente}")
                print(f"   - Código externo: {delivery_info.codigo_pedido_externo}")
                print(f"   - Plataforma: {delivery_info.plataforma}")
                print(f"   - Teléfono: {delivery_info.telefono_cliente}")
            else:
                print(f"   ❌ NO tiene registro en Pedidos_Delivery")
            
            # Contar detalles
            detalles_count = db.query(models.Detalles_Pedido).filter(
                models.Detalles_Pedido.pedido_id == pedido.id
            ).count()
            print(f"   - Detalles: {detalles_count} items")
        
        print("\n" + "=" * 70)
        
        # 2. Estadísticas generales
        print("\n📊 ESTADÍSTICAS:")
        print("-" * 40)
        
        total_pedidos = db.query(models.Pedidos).count()
        total_delivery = db.query(models.Pedidos_Delivery).count()
        total_detalles = db.query(models.Detalles_Pedido).count()
        
        print(f"Total Pedidos: {total_pedidos}")
        print(f"Total Pedidos_Delivery: {total_delivery}")
        print(f"Total Detalles_Pedido: {total_detalles}")
        
        # 3. Buscar patrones específicos en Pedidos_Delivery
        print("\n🔎 BUSCANDO PATRONES EN Pedidos_Delivery:")
        print("-" * 50)
        
        patrones = [
            ('LOAD-%', 'Código LOAD-'),
            ('TEST-%', 'Código TEST-'),
            ('Cliente_Test_%', 'Cliente Test'),
        ]
        
        for patron, descripcion in patrones:
            count = db.query(models.Pedidos_Delivery).filter(
                models.Pedidos_Delivery.codigo_pedido_externo.like(patron)
            ).count()
            print(f"{descripcion}: {count} registros")
        
        count_cliente = db.query(models.Pedidos_Delivery).filter(
            models.Pedidos_Delivery.nombre_cliente.like('Cliente_Test_%')
        ).count()
        print(f"Clientes Test: {count_cliente} registros")
        
        # 4. Ver algunos registros de Pedidos_Delivery
        print("\n📝 MUESTRA DE Pedidos_Delivery:")
        print("-" * 50)
        
        delivery_samples = db.query(models.Pedidos_Delivery).order_by(models.Pedidos_Delivery.pedido_id.desc()).limit(5).all()
        
        for delivery in delivery_samples:
            print(f"ID: {delivery.pedido_id} | Pedido ID: {delivery.pedido_id}")
            print(f"  Cliente: {delivery.nombre_cliente}")
            print(f"  Código: {delivery.codigo_pedido_externo}")
            print(f"  Plataforma: {delivery.plataforma}")
            print()
        
        # 5. Verificar consistencia de datos
        print("\n🔧 VERIFICACIÓN DE CONSISTENCIA:")
        print("-" * 40)
        
        # Pedidos sin registro en Delivery
        pedidos_sin_delivery = db.query(models.Pedidos).filter(
            ~models.Pedidos.id.in_(
                db.query(models.Pedidos_Delivery.pedido_id)
            )
        ).count()
        print(f"Pedidos SIN registro en Delivery: {pedidos_sin_delivery}")
        
        # Registros Delivery sin pedido principal
        delivery_sin_pedido = db.query(models.Pedidos_Delivery).filter(
            ~models.Pedidos_Delivery.pedido_id.in_(
                db.query(models.Pedidos.id)
            )
        ).count()
        print(f"Registros Delivery SIN pedido principal: {delivery_sin_pedido}")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    diagnosticar_pedidos()