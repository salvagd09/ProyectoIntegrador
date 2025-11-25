import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from sqlalchemy import create_engine, text
DB_URL = "postgresql://postgres:CKHelhFLVFGKNAaGoKHazUnmiZaWEVgZ@mainline.proxy.rlwy.net:34440/railway?sslmode=require"
engine = create_engine(DB_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TYPE estado_item_pedido ADD VALUE 'por_confirmar'"))
        conn.commit()
        print("✅ ENUM actualizado!")
    except Exception as e:
        if "already exists" in str(e):
            print("✅ 'por_confirmar' ya existe en el ENUM")
        else:
            print(f"❌ Error: {e}")