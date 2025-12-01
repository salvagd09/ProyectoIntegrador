from locust import HttpUser, task, between
import random
from datetime import datetime

class GestaFoodAdmin(HttpUser):
    wait_time = between(1, 15)
    @task(3)
    def consultar_delivery(self):
        with self.client.get("/delivery/pedidos/", catch_response=True, name="GET /delivery/pedidos/") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Falla en consulta de pedidos de delivery:Status {response.status_code}")
    @task(2)
    def consultar_insumos(self):
        with self.client.get("/api/inventario/", catch_response=True, name="GET /api/inventario/") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Falla en consulta insumos:Status {response.status_code}")
    @task(1)
    def consultar_metricas(self):
        with self.client.get("/api/metricas/todas", catch_response=True, name="GET /api/metricas/todas") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Falla en consulta de metricas:Status {response.status_code}")
class GestaFoodCaja(HttpUser):
    wait_time = between(2, 5)
    @task
    def consultar_pagos(self):
        with self.client.get("/api/pagos/historial", catch_response=True, name="GET /api/pagos/historial") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Falla en consulta de pagos:Status {response.status_code}")
class GestaFoodMesero(HttpUser):
    wait_time = between(3, 8)
    @task(3)
    def consultar_mesas(self):
        with self.client.get("/mesas/", catch_response=True, name="GET /mesas/") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Falla en consulta de mesas: Status {response.status_code}")
    @task(5)
    def consultar_pedidos_fisicos(self):
        with self.client.get("/pedidosF/pedidosM", catch_response=True, name="GET /pedidosF/pedidosM") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Falla en consulta de pedidos: Status {response.status_code}")
    @task(1)
    def cambiar_estado_mesa(self):
        """Tarea de cambio de datos"""
        mesa_id = random.randint(1,8)
        with self.client.put(
            f"/mesas/{mesa_id}/estado",
            catch_response=True,
            name="PUT /mesas/{id}/estado"
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Error {response.status_code}")
    @task
    def crear_pedido(self):
        """Simula mesero creando un pedido en mesa"""
        
        # Datos variables para simular diferentes pedidos
        mesa_id = random.randint(1, 10)  # Ajusta según tus mesas
        empleado_id = 7  # Ajusta según tus empleados
        
        # Crear items del pedido (1-4 productos)
        num_items = random.randint(1, 4)
        items = []
        monto_total = 0.0
        for _ in range(num_items):
            producto_id = random.randint(1, 10)  # Ajusta según tus productos
            cantidad = random.randint(1, 3)
            precio_unitario = random.choice([15.50, 20.00, 25.50, 30.00, 12.00])  # Precios realistas
            
            items.append({
                "producto_id": producto_id,
                "cantidad": cantidad,
                "precio_unitario": precio_unitario
            })
            
            monto_total += precio_unitario * cantidad
        
        # Payload del pedido
        pedido = {
            "mesa_id": mesa_id,
            "empleado_id": empleado_id,
            "estado": "pendiente",  # Cambiado a minúscula según tu enum
            "tipo_pedido": "mesa",  # Cambiado a minúscula según tu enum
            "monto_total": round(monto_total, 2),
            "items": items
        }
        
        # Hacer request
        with self.client.post(
            "/pedidosF/agregarPedido",  # Ajusta si tiene prefijo de router
            json=pedido,
            catch_response=True,
            name="POST /pedidosF/agregarPedido"
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                # Mesa no encontrada es esperado si el ID no existe
                response.success()
            else:
                response.failure(f"Error al crear pedido. Status {response.status_code}")
class GestaFoodCocina(HttpUser):
    wait_time = between(2, 6)
    
    @task(8)
    def consultar_pedidos_cocina(self):
        with self.client.get("/pedidosF/pedidosM", catch_response=True, name="GET /pedidosF/pedidosM") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Falla al consultar pedido en cocina:Status {response.status_code}")
    @task(2)
    def consultar_insumos(self):
        with self.client.get("/api/inventario/", catch_response=True, name="GET /api/inventario/") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Falla al consultar insumos en cocina:Status {response.status_code}")
