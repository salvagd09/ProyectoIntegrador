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
        mesa_id = 1
        with self.client.put(
            f"/mesas/{mesa_id}/estado",
            catch_response=True,
            name="PUT /mesas/{id}/estado"
        ) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Error {response.status_code}")
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