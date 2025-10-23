from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 🔹 Cambia estos datos según tu configuración
DATABASE_URL = "postgresql://postgres:Alexander@localhost:5432/cevicheria_db"

# Crear motor de conexión
engine = create_engine(DATABASE_URL)

# Crear sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Dependencia para usar en rutas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
