# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar routers correctamente
from app.routers.pedidosF import router as pedidos_router
from app.routers.menu import router as menu_router
from app.routers.auth import router as auth_router
from app.routers.mesas import router as mesas_router
from app.routers.inventario import router as inventario_router
from app.routers.empleados import router as empleados_router

app = FastAPI(title="Sistema de Pedidos")

# --- Middleware CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Incluir routers ---
app.include_router(menu_router)
app.include_router(auth_router)
app.include_router(mesas_router)
app.include_router(inventario_router)
app.include_router(empleados_router)
app.include_router(pedidos_router)

# --- Ruta raíz ---
@app.get("/")
def root():
    return {"msg": "Bienvenido a GestaFood"}
