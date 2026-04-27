"""Generate TypeScript types and API client from Pydantic models and FastAPI routes.

Usage:
    python -m open_ess.scripts.generate_types
    # or via entry point:
    generate-types
"""

import inspect
import logging
import re
import sys
from datetime import datetime
from enum import Enum
from pathlib import Path
from types import NoneType, UnionType
from typing import Any, TypedDict, get_args, get_origin

from fastapi.routing import APIRoute
from pydantic import BaseModel


class _ParamInfo(TypedDict):
    name: str
    ts_type: str
    optional: bool


logger = logging.getLogger(__name__)


def python_type_to_ts(python_type: Any, models: dict[str, type]) -> str:
    """Convert a Python type annotation to TypeScript type."""
    origin = get_origin(python_type)
    args = get_args(python_type)

    # Handle None
    if python_type is NoneType:
        return "null"

    # Handle basic types
    if python_type is str:
        return "string"
    if python_type is int or python_type is float:
        return "number"
    if python_type is bool:
        return "boolean"
    if python_type is datetime:
        return "string"  # ISO 8601 string

    # Handle Union types (X | Y or Optional[X])
    if origin is UnionType:
        ts_types = [python_type_to_ts(arg, models) for arg in args]
        return " | ".join(ts_types)

    # Handle list
    if origin is list:
        if args:
            inner = python_type_to_ts(args[0], models)
            return f"Array<{inner}>"
        return "Array<unknown>"

    # Handle dict
    if origin is dict:
        if len(args) >= 2:
            key_type = python_type_to_ts(args[0], models)
            value_type = python_type_to_ts(args[1], models)
            return f"Record<{key_type}, {value_type}>"
        return "Record<string, unknown>"

    # Handle Pydantic models (reference by name)
    if isinstance(python_type, type) and issubclass(python_type, BaseModel):
        return python_type.__name__

    # Handle Enums
    if isinstance(python_type, type) and issubclass(python_type, Enum):
        return python_type.__name__

    # Fallback
    if hasattr(python_type, "__name__"):
        return str(python_type.__name__)

    return "unknown"


def generate_enum_ts(enum_class: type[Enum]) -> str:
    """Generate TypeScript type for an Enum."""
    values = [f'"{member.value}"' for member in enum_class]
    return f"export type {enum_class.__name__} = {' | '.join(values)};"


def generate_interface_ts(model: type[BaseModel], models: dict[str, type]) -> str:
    """Generate TypeScript interface for a Pydantic model."""
    lines = [f"export interface {model.__name__} {{"]

    for field_name, field_info in model.model_fields.items():
        ts_type = python_type_to_ts(field_info.annotation, models)

        # Check if field is optional (has default or is Optional)
        is_optional = field_info.default is not None or field_info.default_factory is not None
        optional_marker = "?" if is_optional else ""

        lines.append(f"    {field_name}{optional_marker}: {ts_type};")

    lines.append("}")
    return "\n".join(lines)


def collect_models(module: object) -> tuple[list[type[Enum]], list[type[BaseModel]]]:
    """Collect all Enum and BaseModel classes from a module."""
    enums = []
    models = []

    for _name, obj in inspect.getmembers(module):
        if inspect.isclass(obj):
            if issubclass(obj, Enum) and obj is not Enum:
                enums.append(obj)
            elif issubclass(obj, BaseModel) and obj is not BaseModel:
                models.append(obj)

    return enums, models


def path_to_function_name(path: str, method: str) -> str:
    """Convert API path to a camelCase function name."""
    # Remove leading /api/ if present
    path = re.sub(r"^/api/", "", path)
    # Remove leading slash
    path = path.lstrip("/")
    # Replace hyphens and slashes with spaces for camelCase conversion
    path = path.replace("-", " ").replace("/", " ")
    # Convert to camelCase
    words = path.split()
    if not words:
        return method.lower()
    name = words[0].lower() + "".join(word.capitalize() for word in words[1:])
    # Prefix with method if not GET
    if method.upper() != "GET":
        name = method.lower() + name[0].upper() + name[1:]
    return name


def generate_api_function(route: APIRoute, models_dict: dict[str, type]) -> str | None:
    """Generate TypeScript function for an API route."""
    # Get the HTTP method
    methods = list(route.methods - {"HEAD", "OPTIONS"})
    if not methods:
        return None
    method = methods[0]

    path = route.path
    func_name = path_to_function_name(path, method)

    # Get response type from response_model
    response_type = "unknown"
    if route.response_model is not None:
        response_type = python_type_to_ts(route.response_model, models_dict)

    # Extract query parameters from the endpoint function signature
    params: list[_ParamInfo] = []
    endpoint = route.endpoint
    sig = inspect.signature(endpoint)

    for param_name, param in sig.parameters.items():
        # Skip dependency injection parameters
        if param_name in ("db", "battery_configs", "price_config", "battery_systems"):
            continue

        annotation = param.annotation
        if annotation is inspect.Parameter.empty:
            continue

        # Check if it's a Query parameter
        default = param.default
        is_optional = default is not inspect.Parameter.empty

        # Get the actual type (unwrap Query if needed)
        ts_type = python_type_to_ts(annotation, models_dict)

        params.append(
            {
                "name": param_name,
                "ts_type": ts_type,
                "optional": is_optional,
            }
        )

    # Build function signature
    if params:
        param_strs = []
        # Sort so required params come first
        params.sort(key=lambda x: x["optional"])
        for p in params:
            opt = "?" if p["optional"] else ""
            param_strs.append(f"{p['name']}{opt}: {p['ts_type']}")
        params_signature = "params: { " + "; ".join(param_strs) + " }"
    else:
        params_signature = ""

    lines = [
        f"export async function {func_name}({params_signature}): Promise<{response_type}> {{",
    ]

    if params:
        lines.append("const searchParams = new URLSearchParams();")
        for p in params:
            lines.append(
                f"if (params.{p['name']} !== undefined) searchParams.set('{p['name']}', String(params.{p['name']}));"
            )
        lines.append("const query = searchParams.toString() ? `?${searchParams.toString()}` : '';")
        lines.append(f"const response = await fetch(`/api{path}${{query}}`);")
    else:
        lines.append(f"const response = await fetch(`/api{path}`);")

    lines.extend(
        [
            "if (!response.ok) {",
            "    throw new Error(`HTTP ${response.status}`);",
            "}",
            "return response.json();",
        ]
    )

    return "\n    ".join(lines) + "}"


def generate_types_file(output_path: Path) -> None:
    """Generate TypeScript types file from API models."""
    # Import the modules containing models
    from open_ess.frontend.routes import api, util

    # Collect all models
    enums = []
    models = []

    for module in [util, api]:
        module_enums, module_models = collect_models(module)
        enums.extend(module_enums)
        models.extend(module_models)

    # Build a lookup dict for model references
    models_dict = {m.__name__: m for m in models}

    # Generate TypeScript
    lines = [
        "// Auto-generated from Pydantic models - do not edit manually",
        "// Run `generate-types` to regenerate",
        "",
        "// ============",
        "// === Types ===",
        "// ============",
        "",
    ]

    # Generate enums first (they may be referenced by interfaces)
    for enum_class in enums:
        lines.append(generate_enum_ts(enum_class))
        lines.append("")

    # Generate interfaces
    for model in models:
        lines.append(generate_interface_ts(model, models_dict))
        lines.append("")

    # Generate API client functions
    lines.append("// ===================")
    lines.append("// === API Client ===")
    lines.append("// ===================")
    lines.append("")

    for route in api.router.routes:
        if isinstance(route, APIRoute):
            func_code = generate_api_function(route, models_dict)
            if func_code:
                lines.append(func_code)
                lines.append("")

    # Write output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines))
    print(f"Generated {output_path}")


def main() -> None:
    output_path = Path("open_ess/frontend/src/types.ts")
    try:
        generate_types_file(output_path)
    except Exception as e:
        logger.exception(f"Error generating types: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
