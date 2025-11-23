import requests
import random

API_URL = "http://localhost:8000"

def simular_pedido():
    """Usa el formato de PedidoCreate existente"""
    
    pedido = {
        "empleado_id": None,
        "mesa_id": None,
        "tipo_pedido": "delivery",
        "notas": "Tocar el timbre",
        "detalles": [
            {"producto_id": 1, "cantidad": 2, "precio_unitario": 35.00, "notas": "Sin cebolla"},
            {"producto_id": 2, "cantidad": 1, "precio_unitario": 28.00}
        ],
        "delivery_data": {
            "nombre_cliente": "María García",
            "direccion_cliente": "Av. Javier Prado 456, San Isidro",
            "telefono_cliente": "912345678",
            "plataforma": "rappi",
            "codigo_pedido_externo": f"RAPPI-{random.randint(10000, 99999)}",
            "costo_envio": 6.50,
            "comision_plataforma": 3.50
        }
    }
    response = requests.post(f"{API_URL}/webhook/delivery", json=pedido)
    print(f"Status: {response.status_code}")
    print(f"Respuesta: {response.json()}")
if __name__ == "__main__":
    simular_pedido()
