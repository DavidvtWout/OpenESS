{ pkgs ? import <nixpkgs> { } }:

let open-ess = pkgs.python3.pkgs.callPackage ./default.nix { };
in pkgs.mkShell {
  packages = [
    (pkgs.python3.withPackages (_: open-ess.propagatedBuildInputs))
    pkgs.cbc  # MILP solver for the optimizer
    pkgs.nodejs # For npm
  ];

  shellHook = ''
    export PYTHONPATH="$PWD:$PYTHONPATH"
    export CBC_EXECUTABLE="${pkgs.cbc}/bin/cbc"
  '';
}
