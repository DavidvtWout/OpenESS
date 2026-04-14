{ pkgs ? import <nixpkgs> { } }:

let open-ess = pkgs.python3.pkgs.callPackage ./default.nix { };
in pkgs.mkShell {
  packages = with pkgs; [
    (python3.withPackages (_: open-ess.propagatedBuildInputs))
    cbc  # MILP solver for the optimizer
    esbuild
  ];

  shellHook = ''
    export PYTHONPATH="$PWD:$PYTHONPATH"
    export CBC_EXECUTABLE="${pkgs.cbc}/bin/cbc"
  '';
}
