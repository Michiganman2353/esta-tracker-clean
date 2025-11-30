{
  description = "ESTA Rainforest — The Living Compliance Ecosystem";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
        };
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20
            pnpm
            rust-bin.stable.latest.default
            gleam
            ollama
            tauri
            cargo-tauri
            trunk
            wasmtime
          ];
          shellHook = ''
            export PATH="$PATH:$HOME/.cargo/bin"
            echo "ESTA Rainforest ready. Run: pnpm tauri dev"
          '';
        };
      });
}
