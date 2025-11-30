#  MANUAL TÉCNICO - MANTENIMIENTO

## MONITOREO DIARIO
### Verificar salud del sistema:
```bash

# Verificación del funcionamiento de la API

curl https://proyectointegrador-production-d5ec.up.railway.app/health

# Funcional: {"status":"healthy","database":"connected"}


### Backup de Datos:
```bash
python app/Mantenimiento/Scripts/backup_datos.py
