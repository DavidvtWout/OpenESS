from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(tags=["pages"])

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
templates = Jinja2Templates(directory=TEMPLATES_DIR)


@router.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Main dashboard page."""
    return templates.TemplateResponse("dashboard.html", {"request": request})


@router.get("/prices", response_class=HTMLResponse)
async def prices_page(request: Request):
    """Energy prices page."""
    return templates.TemplateResponse("prices.html", {"request": request})


@router.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request):
    """Settings page."""
    return templates.TemplateResponse("settings.html", {"request": request})


@router.get("/cycles", response_class=HTMLResponse)
async def cycles_page(request: Request):
    """Battery cycles efficiency page."""
    return templates.TemplateResponse("cycles.html", {"request": request})


@router.get("/debug", response_class=HTMLResponse)
async def debug_page(request: Request):
    """Debug page showing all power and energy flows."""
    return templates.TemplateResponse("debug.html", {"request": request})
