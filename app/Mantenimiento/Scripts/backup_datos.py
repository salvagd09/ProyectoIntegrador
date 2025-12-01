#!/usr/bin/env python3
"""
SCRIPT DE BACKUP PARA DATOS CRÍTICOS
Demuestra conocimiento en respaldo de base de datos
"""

import psycopg2
import pandas as pd
from datetime import datetime
import os
import json

def backup_con_python():
    print("INICIANDO BACKUP CON PYTHON (Conexión directa)...")
    
    # Configuración
    config = {
        'host': 'mainline.proxy.rlwy.net',
        'port': '34440',
        'database': 'railway', 
        'user': 'postgres',
        'password': 'CKHelhFLVFGKNAaGoKHazUnmiZaWEVgZ'
    }
    
    fecha = datetime.now().strftime("%Y-%m-%d_%H-%M")
    os.makedirs('app/Mantenimiento/Backups', exist_ok=True)
    
    tablas = ['pedidos', 'detalles_pedido', 'pagos', 'ingredientes']
    
    try:
        # Conexión a la base de datos
        conn = psycopg2.connect(**config)
        print("Conexión a PostgreSQL establecida")
        
        for tabla in tablas:
            try:
                # Leer datos de la tabla
                query = f"SELECT * FROM {tabla}"
                df = pd.read_sql_query(query, conn)
                
                # Guardar en múltiples formatos
                archivo_csv = f'app/Mantenimiento/Backups/backup_{tabla}_{fecha}.csv'
                archivo_json = f'app/Mantenimiento/Backups/backup_{tabla}_{fecha}.json'
                
                df.to_csv(archivo_csv, index=False, encoding='utf-8')
                df.to_json(archivo_json, orient='records', indent=2)
                
                print(f"{tabla} - {len(df)} registros respaldados")
                print(f"   📄 CSV: {archivo_csv}")
                print(f"   📄 JSON: {archivo_json}")
                
            except Exception as e:
                print(f"❌ {tabla} - Error: {str(e)}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
    
    print("BACKUP COMPLETADO")

if __name__ == "__main__":
    backup_con_python()
