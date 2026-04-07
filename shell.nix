{ pkgs ? import <nixpkgs> { } }:

let dynamic-ess = pkgs.python3.pkgs.callPackage ./default.nix { };
in pkgs.mkShell {
  packages = [
    (pkgs.python3.withPackages (_: dynamic-ess.propagatedBuildInputs))
    pkgs.cbc  # MILP solver for the optimizer
  ];

  shellHook = ''
    export PYTHONPATH="$PWD:$PYTHONPATH"
    export CBC_EXECUTABLE="${pkgs.cbc}/bin/cbc"
  '';
}
