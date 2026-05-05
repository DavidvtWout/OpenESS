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
    mql_client: TimeseriesBackend | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncGenerator[None]:
        _app.state.price_config = config.prices
        _app.state.battery_systems = battery_systems
        _app.state.mql_client = mql_client
        yield
        # _app.state.mql_client.close()

    app = FastAPI(
        title="OpenESS",
        description="Open Energy Storage System dashboard",
        lifespan=lifespan,
    )
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    app.include_router(pages_router)
    app.include_router(api_router, prefix="/api")

    # Mount timeseries query endpoints
    if mql_client is not None:
        if isinstance(mql_client, MetricSQLiteBackend):
            app.include_router(mql_client.create_fastapi_router(), prefix="/api/v1")
        else:
            app.include_router(timeseries_router, prefix="/api/v1")

    return app
