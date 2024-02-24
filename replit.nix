{ pkgs }: {
    deps = [
        pkgs.yarn
        pkgs.esbuild
        (pkgs.nodejs-18_x.override { version = "18.17.0"; })

        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
    ];
}
