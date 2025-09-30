from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#Aquí se incluyen los router que contendrán los endpoints
app = FastAPI(title="Sistema de Pedidos")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi import FastAPI
from .routers import auth, mesas, menu,inventario

# Incluir routers
app.include_router(menu.router)
app.include_router(auth.router)
app.include_router(mesas.router)
app.include_router(inventario.router)
@app.get("/")
def root():
    return {"msg": "Bienvenido a GestaFood"}