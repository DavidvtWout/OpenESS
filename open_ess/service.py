import logging
import threading
import time
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class Service(ABC, threading.Thread):
    def __init__(self, name: str):
        super().__init__(name=name, daemon=True)
        self._running = False
        self._ready = False
        self._stop_event = threading.Event()

    @property
    def running(self) -> bool:
        return self._running

    @property
    def is_ready(self) -> bool:
        return self._ready

    def run(self):
        """Thread entry point."""
        self._running = True
        logger.info(f"{self.name} started")

        try:
            self.on_start()
            self._ready = True
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
        """Called once when service starts. Override for initialization."""
        pass

    @abstractmethod
    def tick(self):
        """Called repeatedly. Override with service logic."""
        pass

    def wait_until_next(self):
        """Wait until next tick. Override for custom timing."""
        self._stop_event.wait(timeout=1.0)

    def stop(self):
        """Signal the service to stop."""
        self._running = False
        self._stop_event.set()

    def wait_seconds(self, seconds: float) -> bool:
        """Sleep for seconds, but wake early if stopped. Returns True if stopped."""
        return self._stop_event.wait(timeout=seconds)


class ServiceManager:
    def __init__(self):
        self._services: list[Service] = []
        self._dependencies: dict[Service, list[Service]] = {}
        self._running = False

    def register_service(self, service: Service, requires: Service | list[Service] = None):
        self._services.append(service)
        if requires:
            if not isinstance(requires, list):
                requires = [requires]
            self._dependencies[service] = requires

    def start(self):
        self._running = True
        services_to_start = self._services
        services_on_hold = []
        while self._running and services_to_start:
            for service in services_to_start:
                if all(dep.is_ready for dep in self._dependencies.get(service, [])):
                    service.start()
                else:
                    services_on_hold.append(service)
            services_to_start = services_on_hold
            services_on_hold = []
            time.sleep(0.1)

    def stop(self):
        self._running = False
        for service in self._services:
            service.stop()

    def wait_for_stop(self):
        for service in self._services:
            service.join()
