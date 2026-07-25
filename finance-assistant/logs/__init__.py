import logging

def get_logger(name: str) -> logging.Logger:
    from .logger import get_logger as _gl
    return _gl(name)

def get_app_logger() -> logging.Logger:
    from .logger import get_app_logger as _gal
    return _gal()

__all__ = ["get_logger", "get_app_logger"]
