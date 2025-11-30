#!/usr/bin/env python3
"""
SCRIPT DE VERIFICACIÓN DEL SISTEMA 
Monitoreo y detección de problemas
"""

import requests
import psycopg2
from datetime import datetime

def verificar_estado_sistema():
    print("🔍 EJECUTANDO VERIFICACIÓN DEL SISTEMA...")
    print("=" * 50)
    
    url_base = "https://proyectointegrador-production-d5ec.up.railway.app"
    
    # ENDPOINTS REALES QUE SÍ EXISTEN
    endpoints = {
        "API Principal": "/",
        "Sistema de Pagos": "/pagos/health",  # Si existe este endpoint
        "Documentación API": "/docs"
    }
    
    todo_funciona = True
    
    # 1. VERIFICAR ENDPOINTS DE LA API
    for servicio, endpoint in endpoints.items():
        try:
            respuesta = requests.get(f"{url_base}{endpoint}", timeout=10)
            
            if respuesta.status_code == 200:
                print(f"✅ {servicio}: OPERATIVO")
            elif respuesta.status_code == 404:
                print(f"⚠️  {servicio}: NO ENCONTRADO (pero API responde)")
            else:
                print(f"❌ {servicio}: FALLANDO (código {respuesta.status_code})")
                todo_funciona = False
                
        except Exception as e:
            print(f"❌ {servicio}: ERROR - {e}")
            todo_funciona = False
    
    # 2. VERIFICAR BASE DE DATOS DIRECTAMENTE
    print("\n--- VERIFICACIÓN BASE DE DATOS ---")
    try:
        conn = psycopg2.connect(
            "postgresql://postgres:CKHelhFLVFGKNAaGoKHazUnmiZaWEVgZ@mainline.proxy.rlwy.net:34440/railway"
        )
        cursor = conn.cursor()
        cursor.execute("SELECT NOW() as hora_servidor, version() as version_postgres")
        resultado = cursor.fetchone()
        cursor.close()
        conn.close()
        
        print(f"✅ BASE DE DATOS: CONECTADA")
        print(f"   📅 Hora servidor: {resultado[0]}")
        print(f"   🗄️  Versión PostgreSQL: {resultado[1].split(',')[0]}")
        
    except Exception as e:
        print(f"❌ BASE DE DATOS: ERROR - {e}")
        todo_funciona = False
    
    print("=" * 50)
    
    if todo_funciona:
        print("🎉 SISTEMA COMPLETAMENTE OPERATIVO")
    else:
        print("⚠️  ALGUNOS SERVICIOS PRESENTAN PROBLEMAS")
    
    return todo_funciona

if __name__ == "__main__":
    verificar_estado_sistema()
