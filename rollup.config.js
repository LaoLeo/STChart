import nodeResolve from "rollup-plugin-node-resolve"
// import uglify from "rollup-plugin-uglify"

export default {
    name: "Scenario-Tree-Chart",
    input: "./src/main.js",
    plugins: [
        nodeResolve(),
        // uglify()
    ],
    output: {
        name: "STChart",
        format: "umd",
        sourcemap: true,
        file: "dist/index.js"
    }
}