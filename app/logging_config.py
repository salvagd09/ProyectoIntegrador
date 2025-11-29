import logging
from logging.handlers import TimedRotatingFileHandler
import os

def setup_loggers():
    # Crear logs directory si no existe
    log_dir = os.path.join(os.getcwd(), "logs")
    os.makedirs(log_dir, exist_ok=True)

    # Función auxiliar para crear handlers
    def create_handler(filename, level):
        handler = TimedRotatingFileHandler(
            filename=os.path.join(log_dir, filename),
            when="midnight",
            interval=1,
            backupCount=7,
            encoding="utf-8"
        )
        handler.setFormatter(logging.Formatter(
            "%(asctime)s - %(levelname)s - %(message)s"
        ))
        handler.setLevel(level)
        return handler
    
    # ======================
    # LOGGER GENERAL (app)
    # ======================
    app_logger = logging.getLogger("app_logger")
    app_logger.setLevel(logging.INFO)
    app_logger.propagate = False

    if not app_logger.handlers:
        app_logger.addHandler(create_handler("app.log", logging.INFO))

    # ======================
    # LOGGER DE AUTH
    # ======================
    auth_logger = logging.getLogger("auth_logger")
    auth_logger.setLevel(logging.INFO)
    auth_logger.propagate = False

    if not auth_logger.handlers:
        auth_logger.addHandler(create_handler("auth.log", logging.INFO))

    # ======================
    # LOGGER SOLO DE ERRORES
    # ======================
    error_logger = logging.getLogger("error_logger")
    error_logger.setLevel(logging.ERROR)
    error_logger.propagate = False

    if not error_logger.handlers:
        error_logger.addHandler(create_handler("errors.log", logging.ERROR))