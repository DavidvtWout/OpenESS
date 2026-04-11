from pydantic import BaseModel, model_validator


class FrontendConfig(BaseModel):
    """The frontend is disabled by default but is enabled when the host is set."""

    enable: bool = False
    host: str | None = None
    port: int = 8519

    @model_validator(mode="before")
    @classmethod
    def set_enable_default(cls, data):
        if isinstance(data, dict) and "enable" not in data:
            data["enable"] = data.get("host") is not None
        return data
