import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_PUBLIC_URL")
if not DATABASE_URL:
    print("ERROR: No se encontró DATABASE_PUBLIC_URL en el archivo .env")
    sys.exit(1)

engine = create_engine(
    DATABASE_URL, 
    echo = os.getenv("SQL_ECHO", "false").lower() == "true"
)

SessionLocal = sessionmaker(bind = engine, autocommit = False, autoflush = False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()