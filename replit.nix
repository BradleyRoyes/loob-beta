{ pkgs }: {
    deps = [
        pkgs.yarn
        pkgs.esbuild

        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}
