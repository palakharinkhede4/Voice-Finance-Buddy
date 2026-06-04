"""
Centralized logging for ArthBot.
Tracks: agent selection, tool calls, latency, errors, security violations.
Logs to both file (logs/) and console.
"""
import logging
import time
from pathlib import Path
from logging.handlers import RotatingFileHandler

LOG_DIR = Path(__file__).parent

_loggers: dict[str, logging.Logger] = {}


def get_logger(name: str) -> logging.Logger:
    """Get or create a named logger with file + console handlers."""
    if name in _loggers:
        return _loggers[name]

    logger = logging.getLogger(f"arthbot.{name}")
    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Rotating file handler (5 MB per file, keep 3 backups)
    log_file = LOG_DIR / f"{name}.log"
    fh = RotatingFileHandler(log_file, maxBytes=5 * 1024 * 1024, backupCount=3)
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)

    # Console handler (INFO and above)
    ch = logging.StreamHandler()
    ch.setLevel(logging.WARNING)
    ch.setFormatter(fmt)

    logger.addHandler(fh)
    logger.addHandler(ch)

    _loggers[name] = logger
    return logger


def get_app_logger() -> logging.Logger:
    return get_logger("app")


class LatencyTimer:
    """Context manager that logs elapsed time."""

    def __init__(self, logger: logging.Logger, label: str):
        self.logger = logger
        self.label  = label

    def __enter__(self):
        self._start = time.perf_counter()
        return self

    def __exit__(self, *_):
        elapsed_ms = (time.perf_counter() - self._start) * 1000
        self.logger.info(f"{self.label} | latency={elapsed_ms:.0f}ms")
