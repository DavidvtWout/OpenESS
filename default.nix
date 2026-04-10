{ lib, buildPythonPackage, fetchPypi, setuptools, setuptools-scm, entsoe-apy
, fastapi, jinja2, numpy, pandas, pydantic, pymodbus, pyomo, pyyaml, matplotlib
, uvicorn, xsdata, httpx }:

buildPythonPackage {
  pname = "open-ess";
  version = "0.0.0";
  format = "pyproject";

  src = ./.;

  nativeBuildInputs = [ setuptools setuptools-scm ];
  propagatedBuildInputs = [
    entsoe-apy
    fastapi
    jinja2
    numpy
    pandas
    pydantic
    pymodbus
    pyomo
    pyyaml
    matplotlib
    uvicorn
  ];

  meta = with lib; {
    description = "Open Energy Storage System - Charge/discharge schedule optimizer for day-ahead energy prices.";
    license = licenses.mit;
  };
}
