from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

STATIC_DIR = Path(__file__).parent.parent / "static"
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

router = APIRouter(tags=["pages"])
templates = Jinja2Templates(directory=TEMPLATES_DIR)


@router.get("/favicon.ico", include_in_schema=False)
async def favicon() -> FileResponse:
    return FileResponse(STATIC_DIR / "images/openess-16x16.png")


@router.get("/logo-32x32.png", include_in_schema=False)
async def logo_32x32() -> FileResponse:
    return FileResponse(STATIC_DIR / "images/openess-32x32.png")


@router.get("/", response_class=HTMLResponse)
async def dashboard(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "dashboard.html")


@router.get("/metrics", response_class=HTMLResponse)
async def metrics_page(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "metrics.html")


@router.get("/cycles", response_class=HTMLResponse)
async def cycles_page(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "cycles.html")


@router.get("/debug", response_class=HTMLResponse)
async def debug_page(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "debug.html")


@router.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "settings.html")
