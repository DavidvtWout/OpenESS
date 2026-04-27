{ pkgs ? import <nixpkgs> { } }:

# Note: ruff is dynamically linked and the version installed by pip won't work on NixOS.
# This can be fixed by adding `programs.nix-ld.enable = true;` to your NixOS config.

let open-ess = pkgs.python3.pkgs.callPackage ./default.nix { };
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
    esbuild
    pre-commit
  ];

  shellHook = ''
    export PYTHONPATH="$PWD:$PYTHONPATH"
    export CBC_EXECUTABLE="${pkgs.cbc}/bin/cbc"
  '';
}
