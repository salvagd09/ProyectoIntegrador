#  MANUAL TÉCNICO - MANTENIMIENTO

## MONITOREO DIARIO
### Verificar salud del sistema:
```bash

# Verificación del funcionamiento de la API

curl https://proyectointegrador-production-d5ec.up.railway.app/
# Respuesta: {"msg":"Bienvenido a GestaFood"}


### Backup de Datos:
```bash
python app/Mantenimiento/Scripts/backup_datos.py


# Verificación con script externo
python app/Mantenimiento/Scripts/verificar_sistema.py
