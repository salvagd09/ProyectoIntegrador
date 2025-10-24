# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import directo del router
from app.routers.pedidosF import router as pedidos_router

app = FastAPI(title="Sistema de Pedidos")

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(pedidos_router)

# Ruta raíz
@app.get("/")
def root():
    return {"msg": "Bienvenido a GestaFood"}
