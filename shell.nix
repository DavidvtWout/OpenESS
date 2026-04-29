{ pkgs ? import <nixpkgs> { } }:

# Note: ruff is dynamically linked and the version installed by pip won't work on NixOS.
# This can be fixed by adding `programs.nix-ld.enable = true;` to your NixOS config.

let
  metricsqlite = pkgs.python3.pkgs.buildPythonPackage {
    pname = "metricsqlite";
    version = "0.0.0";
    format = "pyproject";
    src = pkgs.fetchFromGitHub {
      owner = "DavidvtWout";
      repo = "MetricSQLite";
      rev = "9758b9f";
      hash = "sha256-k0dsp/Ycaq/tqOEoOalH7d7RYpP+N8n7HI8NvxbOEu0=";
    };
    nativeBuildInputs = with pkgs.python3.pkgs; [ setuptools setuptools-scm ];
    propagatedBuildInputs = with pkgs.python3.pkgs; [ pydantic ];
  };
  open-ess = pkgs.python3.pkgs.callPackage ./default.nix { inherit metricsqlite; };
in pkgs.mkShell {
  packages = with pkgs; [
    (python3.withPackages (pp:
      open-ess.propagatedBuildInputs ++ (with pp; [
        # Dev tools;
        pre-commit-hooks
        mypy
        ruff
        # pytest and dependencies;
        pytest
        pytest-cov
      ])))
    cbc # MILP solver for the optimizer
    pre-commit
  ];

  shellHook = ''
    export PYTHONPATH="$PWD:$PYTHONPATH"
    export CBC_EXECUTABLE="${pkgs.cbc}/bin/cbc"
  '';
}
