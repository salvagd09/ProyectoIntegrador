from fastapi import FastAPI,status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from sqlalchemy import text
from datetime import datetime,timezone
import os

load_dotenv()
from cloudinary_config import cloudinary
# --- SOLUCIÓN FORZADA PARA VARIABLES DE ENTORNO ---
# Establecer variables críticas directamente
os.environ['DATABASE_PUBLIC_URL'] = 'postgresql://postgres:CKHelhFLVFGKNAaGoKHazUnmiZaWEVgZ@mainline.proxy.rlwy.net:34440/railway'
os.environ['CULQI_SECRET_KEY'] = 'sk_test_UTCQSGcXW8bCyU59'
os.environ['CULQI_PUBLIC_KEY'] = 'pk_test_vzMuTHoueOMlbUbG'

print("✅ Variables de entorno configuradas forzadamente")

# Importar routers correctamente
from routers.pagos import router as pagos_router
from routers.PedidosF import router as pedidos_router
from routers.auth import router as auth_router
from routers.mesas import router as mesas_router
from routers.inventario import router as inventario_router
from routers.empleados import router as empleados_router
from routers.delivery import router as delivery_router
from routers.categorias import router as categorias_router
from routers.ingredientes import router as ingredientes_router
from routers.menu import router as menu_router
from routers.inventario_L import router as inventario_L_router
from routers.upload_image import router as upload_image_router
from routers.metricas import router as metricas_router

app = FastAPI(title="Sistema de Pedidos")

# --- Middleware CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Localhost para desarrollo
        "http://localhost:5173", "http://127.0.0.1:5173", 
        "http://localhost:3000", "http://127.0.0.1:3000", 
        "http://localhost:8000", "http://127.0.0.1:8000",
        # Producción
        "https://proyectointegrador-production-d5ec.up.railway.app",
        "https://frontendproyectointegrador-production.up.railway.app"
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
app.include_router(metricas_router)

# --- Ruta raíz ---
@app.get("/")
def root():
    return {"msg": "Bienvenido a GestaFood"}

# --- Ruta de salud para verificar configuración ---
@app.get("/health")
async def health():
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "GestaFood API",
        "version": "1.0.0",
        "checks": {}
    }
    all_healthy = True
    # 1. Verifica Base de Datos
    try:
        from app.database import SessionLocal
        db = SessionLocal()
        # Hace una query real para verificar conectividad
        db.execute(text("SELECT 1"))
        db.close()
        health_status["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful",
            "response_time_ms": 0  # Útil para medir el tiempo real
        }
    except Exception as e:
        all_healthy = False
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}",
            "error": type(e).__name__
        }
    # 2. Verifica Configuración sin exponer credenciales
    health_status["checks"]["configuration"] = {
        "status": "healthy",
        "database_configured": bool(os.getenv('DATABASE_PUBLIC_URL')),
        "culqi_configured": bool(os.getenv('CULQI_SECRET_KEY')),
        "cloudinary_configured": bool(os.getenv('CLOUDINARY_URL'))
    }
    # 3. Verificar sistema de archivos logs
    try:
        logs_writable = os.access('logs', os.W_OK)
        health_status["checks"]["filesystem"] = {
            "status": "healthy" if logs_writable else "degraded",
            "logs_directory": "writable" if logs_writable else "read-only"
        }
    except Exception as e:
        health_status["checks"]["filesystem"] = {
            "status": "unhealthy",
            "message": str(e)
        }
    if not all_healthy:
        health_status["status"] = "unhealthy"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=health_status
        )
    return health_status  
