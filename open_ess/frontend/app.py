from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from open_ess.battery_system import BatterySystem
from open_ess.timeseries import TimeseriesBackend
from open_ess.timeseries.metricsqlite.backend import MetricSQLiteBackend

from .routes import api_router, pages_router, timeseries_router

if TYPE_CHECKING:
    from open_ess.config import Config

STATIC_DIR = Path(__file__).parent / "static"


def create_app(
    config: "Config",
    battery_systems: list[BatterySystem],
    timeseries: TimeseriesBackend | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncGenerator[None]:
        _app.state.price_config = config.prices
        _app.state.battery_systems = battery_systems
        _app.state.timeseries = timeseries
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

    # Mount timeseries query endpoints
    if timeseries is not None:
        if isinstance(timeseries, MetricSQLiteBackend):
            from metricsqlite.fastapi import create_router as create_metricsqlite_router

            app.include_router(create_metricsqlite_router(timeseries._client), prefix="/api/v1")
        else:
            app.include_router(timeseries_router, prefix="/api/v1")

    return app
