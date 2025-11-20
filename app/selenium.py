from selenium import webdriver
from selenium.webdriver.chrome import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import random

def simular_pedido_delivery():
    """
    Simula la llegada de un pedido desde una plataforma de delivery
    """
    
    # ✅ Configuración de Chrome
    chrome_options = Options()
    # chrome_options.add_argument('--headless')  # Descomentar para sin interfaz gráfica
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('--start-maximized')
    
    # ✅ Inicializar driver (se descarga automáticamente con webdriver_manager)
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )
    
    try:
        # 1️⃣ Navegar a tu aplicación
        driver.get("http://localhost:5173/admin/Pedidos_Aplicativo")  # Ajusta la URL
        time.sleep(2)
        # 3️⃣ Ir a sección de crear pedido delivery
        driver.find_element(By.ID, "nuevo-pedido-delivery").click()
        # 4️⃣ Esperar que cargue el formulario
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "nombre-cliente"))
        )
        
        # 5️⃣ Llenar datos del cliente
        driver.find_element(By.ID, "nombre-cliente").send_keys("Juan Pérez")
        driver.find_element(By.ID, "direccion-cliente").send_keys("Av. Larco 123, Miraflores")
        driver.find_element(By.ID, "telefono-cliente").send_keys("987654321")
        
        # 6️⃣ Seleccionar plataforma (Rappi, Uber Eats, etc.)
        plataforma_select = driver.find_element(By.ID, "plataforma")
        plataforma_select.click()
        driver.find_element(By.XPATH, "//option[@value='rappi']").click()
        
        driver.find_element(By.ID, "codigo-externo").send_keys(f"RAPPI-{random.randint(1000, 9999)}")
        driver.find_element(By.ID, "costo-envio").send_keys("5.00")
        
        # 7️⃣ Agregar productos al pedido
        driver.find_element(By.ID, "agregar-producto").click()
        time.sleep(1)
        
        # Seleccionar producto (ejemplo: Ceviche Clásico)
        driver.find_element(By.XPATH, "//select[@name='producto']/option[contains(text(), 'Ceviche')]").click()
        driver.find_element(By.NAME, "cantidad").send_keys("2")
        driver.find_element(By.ID, "confirmar-producto").click()
        
        time.sleep(1)
        
        # 8️⃣ Confirmar pedido
        driver.find_element(By.ID, "confirmar-pedido").click()
        
        # 9️⃣ Verificar éxito
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "alert-success"))
        )
        
        print("✅ Pedido de delivery simulado exitosamente")
        
        time.sleep(3)
        
    except Exception as e:
        print(f"❌ Error al simular pedido: {e}")
        driver.save_screenshot("error_pedido.png")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    print("🚀 Iniciando simulación de pedido delivery...")
    simular_pedido_delivery()
