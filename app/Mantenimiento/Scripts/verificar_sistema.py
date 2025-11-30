#!/usr/bin/env python3
"""
SCRIPT DE VERIFICACIÓN DEL SISTEMA
Monitoreo y detección de problemas
"""

import requests

def verificar_estado_sistema():
    print("🔍 EJECUTANDO VERIFICACIÓN DEL SISTEMA...")
    print("=" * 50)
    
    url_base = "https://proyectointegrador-production-d5ec.up.railway.app"
    
    endpoints = {
        "API Principal": "/health",
        "Base de Datos": "/healthA", 
        "Sistema de Pagos": "/healthP"
    }
    
    todo_funciona = True
    
    for servicio, endpoint in endpoints.items():
        try:
            respuesta = requests.get(f"{url_base}{endpoint}", timeout=10)
            
            if respuesta.status_code == 200:
                print(f"✅ {servicio}: OPERATIVO")
            else:
                print(f"❌ {servicio}: FALLANDO (código {respuesta.status_code})")
                todo_funciona = False
                
        except Exception as e:
            print(f"❌ {servicio}: ERROR - {e}")
            todo_funciona = False
    
    print("=" * 50)
    
    if todo_funciona:
        print("SISTEMA COMPLETAMENTE OPERATIVO")
    else:
        print("ALGUNOS SERVICIOS PRESENTAN PROBLEMAS")
    
    return todo_funciona

if __name__ == "__main__":
    verificar_estado_sistema()
