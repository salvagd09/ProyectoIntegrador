import requests
import random
import sys
from pathlib import Path
"""
Test rápido del webhook para desarrollo.
Uso: python tests/test_webhook_dev.py
"""
# Agregar path
sys.path.insert(0, str(Path(__file__).parent.parent))
# Importar desde app
from app.config import DB_URL
print(f"📝 Usando BD: {DB_URL[:50]}...")
API_URL = "http://localhost:8000"

def simular_pedido():
    pedido = {
        # Campos planos (EN LA RAÍZ, NO ANIDADOS)
        "nombre_cliente": "María García",
        "direccion_cliente": "Av. Javier Prado 456, San Isidro",
        "telefono_cliente": "912345678",
        "plataforma": "rappi",
        "codigo_pedido_externo": f"RAPPI-{random.randint(10000, 99999)}",
        "metodo_pago": "yape",  # ← Nuevo campo requerido
        "detalles": [
            {
                "producto_id": 1,
                "cantidad": 2,
                "notas": "Sin cebolla"
            },
            {
                "producto_id": 2,
                "cantidad": 1,
                "notas": None
            }
        ]
    }
    response = requests.post(f"{API_URL}/delivery/webhook", json=pedido)
    print(f"Status: {response.status_code}")
    print(f"Respuesta: {response.json()}")
if __name__ == "__main__":
    simular_pedido()
