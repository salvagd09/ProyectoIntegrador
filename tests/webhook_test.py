import requests
import random
import sys
from pathlib import Path
"""
Test rápido del webhook para desarrollo.
Uso: python tests
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
        "nombre_cliente": "Salvador Goicochea",
        "direccion_cliente": "Calle Los Alisos 519, Los Olivos",
        "telefono_cliente": "958342176",
        "plataforma": "rappi",
        "codigo_pedido_externo": f"UberEats-{random.randint(10000, 99999)}",
        "metodo_pago": "yape",  # ← Nuevo campo requerido
        "detalles": [
            {
                "producto_id": 3,
                "cantidad": 2,
                "notas": "Sin cebolla"
            },
            {
                "producto_id": 4,
                "cantidad": 6,
                "notas": None
            }
        ]
    }
    response = requests.post(f"{API_URL}/delivery/webhook", json=pedido)
    print(f"Status: {response.status_code}")
    print(f"Respuesta: {response.json()}")
if __name__ == "__main__":
    simular_pedido()