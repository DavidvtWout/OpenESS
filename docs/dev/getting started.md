To set up a dev environment run;

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e .
pip install -e ".[dev]"

pre-commit install
pre-commit autoupdate
```

### pytest

```bash
# Run all tests:
pytest

# For a code coverage report:
pytest --cov=metricsqlite --cov-report=term-missing
```

### ruff

```bash
ruff check .              # Lint
ruff check . --fix        # Lint + auto-fix
ruff format .             # Format

# pyproject.toml sets `output-format = "concise"`. To show more details run;
ruff check --output-format=full .
```

### mypy

```bash
mypy open_ess

mypy --install-types
```
