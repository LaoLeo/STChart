import nodeResolve from "rollup-plugin-node-resolve"
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
// import {uglify} from "rollup-plugin-uglify"
// import { minify } from 'uglify-js';

export default {
    input: "./src/main.js",
    plugins: [
        nodeResolve({
            // 将自定义选项传递给解析插件
            customResolveOptions: {
                moduleDirectory: 'node_modules'
            }
        }),
        commonjs(),
        babel({
            exclude: 'node_modules/**',
        }),
        // uglify({}, minify),
        // uglify(),
    ],
    external: id => /echarts/.test(id),
    output: {
        name: "STChart",
        format: "umd",
        sourcemap: true,
        file: "dist/STChart.js",
    }
}