from typing import Literal

from pydantic import BaseModel


class VictoriaMetricsConfig(BaseModel):
    backend: Literal["victoriametrics"]
    url: str
    username: str | None = None
    password: str | None = None
    timeout: float = 30.0
