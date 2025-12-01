"""
LIMPIEZA DE PEDIDOS FÍSICOS (MESA)
Elimina pedidos de tipo 'mesa' para evitar sobresaturación
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

def limpiar_todos_pedidos_fisicos():
    """Elimina TODOS los pedidos de tipo 'mesa'"""
    
    print("=" * 70)
    print("⚠️  LIMPIEZA TOTAL DE PEDIDOS FÍSICOS (MESA)")
    print("=" * 70)
    print()
    
    db = SessionLocal()
    
    try:
        # 1. Contar pedidos físicos actuales
        pedidos_fisicos = db.query(models.Pedidos).filter(
            models.Pedidos.tipo_pedido == 'mesa'
        ).all()
        
        print(f"🔍 Encontrados {len(pedidos_fisicos)} pedidos físicos (mesa)")
        print()
        
        if not pedidos_fisicos:
            print("✅ No hay pedidos físicos para eliminar")
            return
        
        # 2. Estadísticas por estado
        from collections import Counter
        estados = Counter([p.estado for p in pedidos_fisicos])
        
        print("📊 Distribución por estado:")
        for estado, cantidad in estados.items():
            print(f"   - {estado}: {cantidad}")
        print(f"   - Total: {len(pedidos_fisicos)}")
        print()
        
        # 3. Contar registros asociados
        fisicos_ids = [p.id for p in pedidos_fisicos]
        
        detalles_count = db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id.in_(fisicos_ids)
        ).count()
        
        pagos_count = db.query(models.Pagos).filter(
            models.Pagos.pedido_id.in_(fisicos_ids)
        ).count()
        
        print("📋 Registros asociados:")
        print(f"   - Detalles de pedidos: {detalles_count}")
        print(f"   - Pagos registrados: {pagos_count}")
        print()
        
        # 4. Mostrar ejemplos
        print("📋 Ejemplos de pedidos a eliminar:")
        for i, pedido in enumerate(pedidos_fisicos[:5], 1):
            mesa = db.query(models.Mesas).filter(
                models.Mesas.id == pedido.mesa_id
            ).first()
            
            mesa_info = f"Mesa {mesa.numero}" if mesa else "Sin mesa"
            
            print(f"   {i}. ID: {pedido.id} | {mesa_info} | Estado: {pedido.estado} | Monto: S/. {pedido.monto_total:.2f}")
        
        if len(pedidos_fisicos) > 5:
            print(f"   ... y {len(pedidos_fisicos) - 5} más")
        print()
        
        # 5. Confirmación
        print(f"🚨 Se eliminarán TODOS los {len(pedidos_fisicos)} pedidos físicos")
        print("   Esto incluye:")
        print(f"   - {detalles_count} detalles de pedidos")
        print(f"   - {pagos_count} registros de pagos")
        print("   - Los pedidos en todos los estados")
        print()
        print("⚠️  Las mesas NO se eliminarán, solo volverán a estado 'libre'")
        print()
        
        respuesta = input("¿Continuar? (escribe 'ELIMINAR-FISICOS'): ")
        
        if respuesta.upper() != 'ELIMINAR-FISICOS':
            print("❌ Operación cancelada")
            return
        
        # 6. Eliminar en orden correcto
        print("\n🗑️  Eliminando pedidos físicos...")
        
        # Liberar mesas primero
        mesas_ocupadas = set([p.mesa_id for p in pedidos_fisicos if p.mesa_id])
        if mesas_ocupadas:
            db.query(models.Mesas).filter(
                models.Mesas.id.in_(mesas_ocupadas)
            ).update({"estado": "libre"}, synchronize_session=False)
            print(f"✅ Liberadas {len(mesas_ocupadas)} mesas")
        
        # Eliminar pagos
        pagos_eliminados = db.query(models.Pagos).filter(
            models.Pagos.pedido_id.in_(fisicos_ids)
        ).delete(synchronize_session=False)
        print(f"✅ Eliminados {pagos_eliminados} pagos")
        
        # Eliminar historial de estados de items
        historial_items_eliminados = db.query(models.HistorialEstadosItems).filter(
            models.HistorialEstadosItems.detalle_pedido_id.in_(
                db.query(models.Detalles_Pedido.id).filter(
                    models.Detalles_Pedido.pedido_id.in_(fisicos_ids)
                )
            )
        ).delete(synchronize_session=False)
        print(f"✅ Eliminados {historial_items_eliminados} registros de historial de items")
        
        # Eliminar detalles
        detalles_eliminados = db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id.in_(fisicos_ids)
        ).delete(synchronize_session=False)
        print(f"✅ Eliminados {detalles_eliminados} detalles de pedidos")
        
        # Eliminar historial de estados de pedidos
        historial_eliminados = db.query(models.HistorialEstadosPedido).filter(
            models.HistorialEstadosPedido.pedido_id.in_(fisicos_ids)
        ).delete(synchronize_session=False)
        print(f"✅ Eliminados {historial_eliminados} registros de historial de pedidos")
        
        # Eliminar pedidos principales
        pedidos_eliminados = db.query(models.Pedidos).filter(
            models.Pedidos.id.in_(fisicos_ids)
        ).delete(synchronize_session=False)
        
        db.commit()
        
        print(f"✅ Eliminados {pedidos_eliminados} pedidos principales")
        print()
        
        # 7. Verificación final
        total_final = db.query(models.Pedidos).count()
        fisicos_final = db.query(models.Pedidos).filter(
            models.Pedidos.tipo_pedido == 'mesa'
        ).count()
        
        print("=" * 50)
        print("📊 RESUMEN FINAL")
        print("=" * 50)
        print(f"   Pedidos físicos eliminados: {pedidos_eliminados}")
        print(f"   Detalles eliminados: {detalles_eliminados}")
        print(f"   Pagos eliminados: {pagos_eliminados}")
        print(f"   Mesas liberadas: {len(mesas_ocupadas)}")
        print(f"   Pedidos totales ahora: {total_final}")
        print(f"   Pedidos físicos ahora: {fisicos_final}")
        print()
        
        if fisicos_final == 0:
            print("🎉 ¡Todos los pedidos físicos eliminados!")
        else:
            print(f"⚠️  Aún quedan {fisicos_final} pedidos físicos")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

def limpiar_pedidos_fisicos_por_estado():
    """Elimina pedidos físicos según su estado"""
    
    print("=" * 70)
    print("⚠️  LIMPIEZA SELECTIVA DE PEDIDOS FÍSICOS")
    print("=" * 70)
    print()
    
    db = SessionLocal()
    
    try:
        # Mostrar estados disponibles
        from collections import Counter
        todos_pedidos = db.query(models.Pedidos).filter(
            models.Pedidos.tipo_pedido == 'mesa'
        ).all()
        
        if not todos_pedidos:
            print("✅ No hay pedidos físicos en el sistema")
            return
        
        estados = Counter([p.estado for p in todos_pedidos])
        
        print("📊 Estados disponibles:")
        estados_lista = []
        for i, (estado, cantidad) in enumerate(estados.items(), 1):
            print(f"   {i}. {estado}: {cantidad} pedidos")
            estados_lista.append(estado)
        print()
        
        # Seleccionar estados a eliminar
        print("Selecciona los estados a eliminar (separados por coma)")
        print("Ejemplo: 1,3,4  o  completado,cancelado")
        seleccion = input("Estados: ").strip()
        
        # Procesar selección
        estados_eliminar = []
        for item in seleccion.split(','):
            item = item.strip()
            if item.isdigit():
                idx = int(item) - 1
                if 0 <= idx < len(estados_lista):
                    estados_eliminar.append(estados_lista[idx])
            else:
                if item in estados_lista:
                    estados_eliminar.append(item)
        
        if not estados_eliminar:
            print("❌ No se seleccionaron estados válidos")
            return
        
        print(f"\n📋 Estados seleccionados: {', '.join(estados_eliminar)}")
        
        # Encontrar pedidos a eliminar
        pedidos_a_eliminar = db.query(models.Pedidos).filter(
            models.Pedidos.tipo_pedido == 'mesa',
            models.Pedidos.estado.in_(estados_eliminar)
        ).all()
        
        print(f"🔍 Encontrados {len(pedidos_a_eliminar)} pedidos para eliminar")
        print()
        
        if not pedidos_a_eliminar:
            print("✅ No hay pedidos con esos estados")
            return
        
        # Mostrar ejemplos
        print("📋 Ejemplos de pedidos a eliminar:")
        for i, pedido in enumerate(pedidos_a_eliminar[:5], 1):
            mesa = db.query(models.Mesas).filter(
                models.Mesas.id == pedido.mesa_id
            ).first()
            
            mesa_info = f"Mesa {mesa.numero}" if mesa else "Sin mesa"
            print(f"   {i}. ID: {pedido.id} | {mesa_info} | Estado: {pedido.estado} | S/. {pedido.monto_total:.2f}")
        
        if len(pedidos_a_eliminar) > 5:
            print(f"   ... y {len(pedidos_a_eliminar) - 5} más")
        print()
        
        # Confirmación
        print(f"🚨 Se eliminarán {len(pedidos_a_eliminar)} pedidos físicos")
        respuesta = input("¿Continuar? (escribe 'CONFIRMAR'): ")
        
        if respuesta.upper() != 'CONFIRMAR':
            print("❌ Operación cancelada")
            return
        
        # Eliminar
        print("\n🗑️  Eliminando pedidos...")
        
        pedidos_ids = [p.id for p in pedidos_a_eliminar]
        
        # Liberar mesas
        mesas_ocupadas = set([p.mesa_id for p in pedidos_a_eliminar if p.mesa_id])
        if mesas_ocupadas:
            db.query(models.Mesas).filter(
                models.Mesas.id.in_(mesas_ocupadas),
                models.Mesas.estado == 'ocupada'
            ).update({"estado": "libre"}, synchronize_session=False)
            print(f"✅ Liberadas {len(mesas_ocupadas)} mesas")
        
        # Eliminar registros asociados
        pagos_eliminados = db.query(models.Pagos).filter(
            models.Pagos.pedido_id.in_(pedidos_ids)
        ).delete(synchronize_session=False)
        print(f"✅ Eliminados {pagos_eliminados} pagos")
        
        historial_items = db.query(models.HistorialEstadosItems).filter(
            models.HistorialEstadosItems.detalle_pedido_id.in_(
                db.query(models.Detalles_Pedido.id).filter(
                    models.Detalles_Pedido.pedido_id.in_(pedidos_ids)
                )
            )
        ).delete(synchronize_session=False)
        print(f"✅ Eliminados {historial_items} registros de historial items")
        
        detalles_eliminados = db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id.in_(pedidos_ids)
        ).delete(synchronize_session=False)
        print(f"✅ Eliminados {detalles_eliminados} detalles")
        
        historial_eliminados = db.query(models.HistorialEstadosPedido).filter(
            models.HistorialEstadosPedido.pedido_id.in_(pedidos_ids)
        ).delete(synchronize_session=False)
        print(f"✅ Eliminados {historial_eliminados} registros de historial")
        
        pedidos_eliminados = db.query(models.Pedidos).filter(
            models.Pedidos.id.in_(pedidos_ids)
        ).delete(synchronize_session=False)
        
        db.commit()
        
        print(f"✅ Eliminados {pedidos_eliminados} pedidos principales")
        
        # Verificación
        fisicos_final = db.query(models.Pedidos).filter(
            models.Pedidos.tipo_pedido == 'mesa'
        ).count()
        
        print(f"\n📊 Pedidos físicos restantes: {fisicos_final}")
        print("🎉 ¡Limpieza completada!")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

def limpiar_pedidos_fisicos_antiguos(dias=30):
    """Elimina pedidos físicos más antiguos que X días"""
    
    print("=" * 70)
    print("⚠️  LIMPIEZA DE PEDIDOS FÍSICOS ANTIGUOS")
    print("=" * 70)
    print()
    
    from datetime import datetime, timedelta
    
    db = SessionLocal()
    
    try:
        dias = int(input(f"¿Cuántos días atrás? (predeterminado: 30): ") or 30)
        fecha_limite = datetime.now() - timedelta(days=dias)
        
        pedidos_antiguos = db.query(models.Pedidos).filter(
            models.Pedidos.tipo_pedido == 'mesa',
            models.Pedidos.fecha_creacion < fecha_limite
        ).all()
        
        print(f"\n🔍 Encontrados {len(pedidos_antiguos)} pedidos anteriores a {fecha_limite.date()}")
        
        if not pedidos_antiguos:
            print("✅ No hay pedidos antiguos para eliminar")
            return
        
        # Estadísticas
        from collections import Counter
        estados = Counter([p.estado for p in pedidos_antiguos])
        
        print("\n📊 Distribución por estado:")
        for estado, cantidad in estados.items():
            print(f"   - {estado}: {cantidad}")
        print()
        
        # Mostrar ejemplos
        print("📋 Ejemplos (más antiguos primero):")
        pedidos_ordenados = sorted(pedidos_antiguos, key=lambda x: x.fecha_creacion)
        for i, pedido in enumerate(pedidos_ordenados[:5], 1):
            dias_antiguedad = (datetime.now() - pedido.fecha_creacion).days
            print(f"   {i}. ID: {pedido.id} | Hace {dias_antiguedad} días | Estado: {pedido.estado}")
        
        if len(pedidos_antiguos) > 5:
            print(f"   ... y {len(pedidos_antiguos) - 5} más")
        print()
        
        # Confirmación
        print(f"🚨 Se eliminarán {len(pedidos_antiguos)} pedidos de hace más de {dias} días")
        respuesta = input("¿Continuar? (escribe 'CONFIRMAR'): ")
        
        if respuesta.upper() != 'CONFIRMAR':
            print("❌ Operación cancelada")
            return
        
        # Eliminar
        print("\n🗑️  Eliminando pedidos antiguos...")
        
        antiguos_ids = [p.id for p in pedidos_antiguos]
        
        mesas_ocupadas = set([p.mesa_id for p in pedidos_antiguos if p.mesa_id])
        if mesas_ocupadas:
            db.query(models.Mesas).filter(
                models.Mesas.id.in_(mesas_ocupadas)
            ).update({"estado": "libre"}, synchronize_session=False)
        
        db.query(models.Pagos).filter(
            models.Pagos.pedido_id.in_(antiguos_ids)
        ).delete(synchronize_session=False)
        
        db.query(models.HistorialEstadosItems).filter(
            models.HistorialEstadosItems.detalle_pedido_id.in_(
                db.query(models.Detalles_Pedido.id).filter(
                    models.Detalles_Pedido.pedido_id.in_(antiguos_ids)
                )
            )
        ).delete(synchronize_session=False)
        
        db.query(models.Detalles_Pedido).filter(
            models.Detalles_Pedido.pedido_id.in_(antiguos_ids)
        ).delete(synchronize_session=False)
        
        db.query(models.HistorialEstadosPedido).filter(
            models.HistorialEstadosPedido.pedido_id.in_(antiguos_ids)
        ).delete(synchronize_session=False)
        
        pedidos_eliminados = db.query(models.Pedidos).filter(
            models.Pedidos.id.in_(antiguos_ids)
        ).delete(synchronize_session=False)
        
        db.commit()
        
        print(f"✅ Eliminados {pedidos_eliminados} pedidos antiguos")
        print("🎉 ¡Limpieza completada!")
        
    except ValueError:
        print("❌ Número de días inválido")
    except Exception as e:
        print(f"❌ ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 70)
    print("🧹 LIMPIEZA DE PEDIDOS FÍSICOS (MESA)")
    print("=" * 70)
    print("\nOPCIONES:")
    print("1. Eliminar TODOS los pedidos físicos")
    print("2. Eliminar pedidos por estado (completado, cancelado, etc.)")
    print("3. Eliminar pedidos antiguos (por fecha)")
    print()
    
    opcion = input("Selecciona opción (1, 2 o 3): ")
    
    if opcion == "1":
        limpiar_todos_pedidos_fisicos()
    elif opcion == "2":
        limpiar_pedidos_fisicos_por_estado()
    elif opcion == "3":
        limpiar_pedidos_fisicos_antiguos()
    else:
        print("❌ Opción no válida")