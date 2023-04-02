
const builder = require("@daybrush/builder");

module.exports = builder([
    {
        input: "src/index.ts",
        output: "./dist/croact.esm.js",
        minifyPrototype: true,
        exports: "named",
        format: "es",
    },
    {
        input: "src/index.ts",
        output: "./dist/croact.cjs.js",
        minifyPrototype: true,
        exports: "named",
        format: "cjs",
    },
    {
        input: "src/index.ts",
        output: "./dist/croact.js",
        name: "Croact",
        exports: "named",
        format: "umd",
        resolve: true,
    },
    {
        input: "src/index.ts",
        output: "./dist/croact.min.js",
        name: "Croact",
        exports: "named",
        format: "umd",
        resolve: true,
        uglify: true,
    },
]);
