import logging
import threading
import time
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class Component(ABC, threading.Thread):
    """Base class for background components with their own lifecycle."""

    def __init__(self, name: str):
        super().__init__(name=name, daemon=True)
        self._running = False
        self._stop_event = threading.Event()

    @property
    def running(self) -> bool:
        return self._running

    def run(self):
        """Thread entry point."""
        self._running = True
        logger.info(f"{self.name} started")

        try:
            self.on_start()
        except Exception as e:
            logger.exception(f"{self.name} failed during startup: {e}")
            self._running = False
            return

        while self._running:
            try:
                self.tick()
            except Exception as e:
                logger.exception(f"{self.name} error in tick: {e}")

            if not self._running:
                break

            self.wait_until_next()

        logger.info(f"{self.name} stopped")

    def on_start(self):
        """Called once when component starts. Override for initialization."""
        pass

    @abstractmethod
    def tick(self):
        """Called repeatedly. Override with component logic."""
        pass

    def wait_until_next(self):
        """Wait until next tick. Override for custom timing."""
        self._stop_event.wait(timeout=1.0)

    def stop(self):
        """Signal the component to stop."""
        self._running = False
        self._stop_event.set()

    def wait_seconds(self, seconds: float) -> bool:
        """Sleep for seconds, but wake early if stopped. Returns True if stopped."""
        return self._stop_event.wait(timeout=seconds)
