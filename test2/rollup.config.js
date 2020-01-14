import builder from "@daybrush/builder";
import cssbundle from "rollup-plugin-css-bundle";
import reactCompat from "rollup-plugin-react-compat";


const reactPlugin = reactCompat({
    useReactCompat: true,
    resolveCompat: true,
})


export default builder([
    {
        input: "demo/src/index.ts",
        output: "demo/dist/index.js",
        format: "iife",
        exports: "named",
        plugins: [cssbundle({output: "./dist/index.css"}), reactPlugin],
        resolve: true,
        // uglify: true,
    },
]);
