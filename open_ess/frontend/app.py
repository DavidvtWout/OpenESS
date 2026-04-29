from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from open_ess.battery_system import BatterySystem
from open_ess.database import Database

from .routes import api_router, pages_router

if TYPE_CHECKING:
    from open_ess.config import Config

STATIC_DIR = Path(__file__).parent / "static"


def create_app(
    database: Database,
    config: "Config",
    battery_systems: list[BatterySystem],
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncGenerator[None]:
        _app.state.database = database.connect()
        _app.state.price_config = config.prices
        _app.state.battery_systems = battery_systems
        yield
        _app.state.database.close()

    app = FastAPI(
        title="OpenESS",
        description="Open Energy Storage System dashboard",
        lifespan=lifespan,
    )
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    app.include_router(pages_router)
    app.include_router(api_router, prefix="/api")

    return app
