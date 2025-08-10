"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var path_1 = require("path");
// https://vite.dev/config/
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true, // Needed for Docker container port mapping
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://backend:8000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
