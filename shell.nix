{ pkgs ? import <nixpkgs> { } }:

let dynamic-ess = pkgs.python3.pkgs.callPackage ./default.nix { };
in pkgs.mkShell {
  packages = [
    (pkgs.python3.withPackages (_: dynamic-ess.propagatedBuildInputs))
    pkgs.ipopt # ipopt is required by pyomo
  ];

  shellHook = ''
    export PYTHONPATH="$PWD:$PYTHONPATH"
  '';
}
