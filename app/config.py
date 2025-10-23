import os
from dotenv import load_dotenv
#Para que cargen caracteres especiales
load_dotenv(encoding='utf-8')
DB_URL = os.getenv("DB_URL", "postgresql://postgres:admin@localhost:5432/db_restaurante")