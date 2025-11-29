import requests
import random
import time
from datetime import datetime
#Para la exposición
#El url se va a obtenr cuando se despliegue el backend a producción
RAILWAY_URL = "https://proyectointegrador-production-d5ec.up.railway.app"
LOCAL_URL = "http://localhost:8000"
# Detectar automáticamente
def get_api_url():
    """Intenta Railway primero, luego local"""
    for url in [RAILWAY_URL, LOCAL_URL]:
        try:
            response = requests.get(f"{url}/health", timeout=3)
            if response.status_code == 200:
                print(f"✅ Conectado a: {url}\n")
                return url
        except:
            continue
    print("❌ No hay servidor disponible")
    exit(1)
API_URL = get_api_url()
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'
def demo_pedido():
    """Demo para exposición"""
    print("=" * 70)
    print(f"{Colors.BOLD}{Colors.BLUE}🍽️  DEMO: Pedido desde Rappi{Colors.END}")
    print("=" * 70 + "\n")
    codigo = f"RAPPI-{random.randint(10000, 99999)}"
    pedido = {
        "nombre_cliente": "María García",
        "direccion_cliente": "Av. Javier Prado 456, San Isidro",
        "telefono_cliente": "912345678",
        "plataforma": "rappi",
        "codigo_pedido_externo": codigo,
        "metodo_pago": "yape",
        "detalles": [
            {"producto_id": 1, "cantidad": 2, "notas": "Sin cebolla"},
            {"producto_id": 2, "cantidad": 1, "notas": None}
        ]
    }
    print(f"{Colors.YELLOW}📱 Datos del pedido:{Colors.END}")
    print(f"Nombre del cliente: {pedido['nombre_cliente']}")
    print(f"Dirección de cliente: {pedido['direccion_cliente']}")
    print(f"Código de pedido externo: {codigo}")
    print(f"Método de pago: {pedido['metodo_pago'].upper()}")
    print(f"Platillos pedidos: {len(pedido['detalles'])} productos\n")
    
    input(f"{Colors.BLUE}Presiona ENTER para enviar al webhook...{Colors.END}")
    
    print(f"\n📤 Enviando a: {API_URL}/delivery/webhook")
    time.sleep(1)
    
    try:
        response = requests.post(f"{API_URL}/delivery/webhook", json=pedido, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n{Colors.GREEN}{Colors.BOLD}✅ ¡PEDIDO RECIBIDO!{Colors.END}\n")
            print(f"ID: {data.get('pedido_id')}")
            print(f"Código: {data.get('codigo_externo')}")
            print(f"Estado: {data.get('status')}")
            print(f"{data.get('mensaje')}\n")
            print(f"{Colors.YELLOW}💡 El administrador puede confirmar/rechazar el pedido{Colors.END}")
            print("=" * 70 + "\n")
        else:
            print(f"\n{Colors.RED}❌ Error {response.status_code}:{Colors.END}")
            print(f"   {response.json()}\n")
    except Exception as e:
        print(f"\n{Colors.RED}❌ Error: {e}{Colors.END}\n")
if __name__ == "__main__":
    demo_pedido()