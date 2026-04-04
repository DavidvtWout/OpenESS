{ lib, buildPythonPackage, fetchPypi, setuptools, setuptools-scm, entsoe-apy
, fastapi, jinja2, numpy, pandas, pydantic, pymodbus, pyomo, pyyaml, matplotlib
, uvicorn, xsdata, httpx }:

buildPythonPackage {
  pname = "dynamic-ess";
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
    description = "Victron dynamic ESS charge/discharge schedule optimizer";
    license = licenses.mit;
  };
}
