import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DB_URL", "postgresql://postgres:MinuevaContra1@localhost:5432/db_restaurante")