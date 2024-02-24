{ pkgs }: {
    deps = [
        pkgs.yarn
        pkgs.esbuild
        pkgs.nodejs-20_x

        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}
