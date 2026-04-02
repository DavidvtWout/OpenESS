{ lib, buildPythonPackage, fetchPypi, setuptools, setuptools-scm, entsoe-apy
, pandas, pydantic, pymodbus, pyyaml, matplotlib, xsdata, httpx }:

buildPythonPackage {
  pname = "dynamic-ess";
  version = "0.0.0";
  format = "pyproject";

  src = ./.;

  nativeBuildInputs = [ setuptools setuptools-scm ];
  propagatedBuildInputs =
    [ entsoe-apy pandas pydantic pymodbus pyyaml matplotlib ];

  meta = with lib; {
    description = "Victron dynamic ESS charge/discharge schedule optimizer";
    license = licenses.mit;
  };
}
