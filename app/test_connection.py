from database import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT NOW()"))
        print("✅ Conexión exitosa:", result.scalar())
except Exception as e:
    print("❌ Error en la conexión:", e)
