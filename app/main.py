
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()
from app.cloudinary_config import cloudinary
# --- SOLUCIÓN FORZADA PARA VARIABLES DE ENTORNO ---
# Establecer variables críticas directamente
os.environ['DATABASE_PUBLIC_URL'] = 'postgresql://postgres:CKHelhFLVFGKNAaGoKHazUnmiZaWEVgZ@mainline.proxy.rlwy.net:34440/railway'
os.environ['CULQI_SECRET_KEY'] = 'sk_test_UTCQSGcXW8bCyU59'
os.environ['CULQI_PUBLIC_KEY'] = 'pk_test_vzMuTHoueOMlbUbG'

print("✅ Variables de entorno configuradas forzadamente")

# Importar routers correctamente
from app.routers.pagos import router as pagos_router
from app.routers.PedidosF import router as pedidos_router
from app.routers.auth import router as auth_router
from app.routers.mesas import router as mesas_router
from app.routers.inventario import router as inventario_router
from app.routers.empleados import router as empleados_router
from app.routers.delivery import router as delivery_router
from app.routers.categorias import router as categorias_router
from app.routers.ingredientes import router as ingredientes_router
from app.routers.menu import router as menu_router
from app.routers.inventario_L import router as inventario_L_router
from app.routers.upload_image import router as upload_image_router

app = FastAPI(title="Sistema de Pedidos")

# --- Middleware CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173", 
        "http://localhost:3000", "http://127.0.0.1:3000", 
        "http://localhost:8000", "http://127.0.0.1:8000"
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Incluir routers ---
app.include_router(auth_router)
app.include_router(mesas_router)
app.include_router(menu_router) 
app.include_router(categorias_router)
app.include_router(ingredientes_router)
app.include_router(inventario_L_router) 
app.include_router(inventario_router)
app.include_router(empleados_router)
app.include_router(pedidos_router)
app.include_router(upload_image_router)
app.include_router(delivery_router)
app.include_router(pagos_router)


# --- Ruta raíz ---
@app.get("/")
def root():
    return {"msg": "Bienvenido a GestaFood"}

# --- Ruta de salud para verificar configuración ---
@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "service": "GestaFood API",
        "database": os.getenv('DATABASE_PUBLIC_URL', 'not found'),
        "culqi": "configured" if os.getenv('CULQI_SECRET_KEY') else "demo_mode",
        "message": "✅ Servidor funcionando correctamente"
    }