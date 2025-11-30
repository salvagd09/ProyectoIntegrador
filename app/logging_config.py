import logging
from logging.handlers import TimedRotatingFileHandler
def setup_loggers():
    # ======================
    # LOGGER GENERAL (app)
    # ======================
    app_logger = logging.getLogger("app_logger")
    app_logger.setLevel(logging.INFO)
    app_logger.propagate = False

    if not app_logger.handlers:
        app_handler = TimedRotatingFileHandler(
            filename="logs/app.log",
            when="midnight",
            interval=1,
            backupCount=7,
            encoding="utf-8"
        )
        app_handler.setFormatter(logging.Formatter(
            "%(asctime)s - %(levelname)s - %(message)s"
        ))
        app_handler.setLevel(logging.INFO)
        app_logger.addHandler(app_handler)
    # ======================
    # LOGGER DE AUTH
    # ======================
    auth_logger = logging.getLogger("auth_logger")
    auth_logger.setLevel(logging.INFO)
    auth_logger.propagate = False   # <---- MUY IMPORTANTE
    if not auth_logger.handlers:
        auth_handler = TimedRotatingFileHandler(
            filename="logs/auth.log",
            when="midnight",
            interval=1,
            backupCount=7,
            encoding="utf-8"
        )
        auth_handler.setFormatter(logging.Formatter(
            "%(asctime)s - %(levelname)s - %(message)s"
        ))
        auth_handler.setLevel(logging.INFO)
        auth_logger.addHandler(auth_handler)
    # ======================
    # LOGGER SOLO DE ERRORES
    # ======================
    error_logger = logging.getLogger("error_logger")
    error_logger.setLevel(logging.ERROR)
    error_logger.propagate = False

    if not error_logger.handlers:
        error_logger.addHandler(create_handler("errors.log", logging.ERROR))