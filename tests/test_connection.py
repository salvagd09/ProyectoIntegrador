import sys
from pathlib import Path
# Agregar path
sys.path.insert(0, str(Path(__file__).parent.parent))
# Importar desde app
from app.config import DB_URL
from sqlalchemy import create_engine, text
print(f"📝 Usando BD: {DB_URL[:50]}...")  # Solo mostrar inicio por seguridad
try:
    # Crear engine directamente con la URL del config
    engine = create_engine(DB_URL)
    print("🔍 Probando conexión a la base de datos...")
    with engine.connect() as connection:
        result = connection.execute(text("SELECT NOW()"))
        print(f"✅ Conexión exitosa: {result.scalar()}")   
except Exception as e:
    print(f"❌ Error en la conexión: {e}")
