"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="vitest" />
var config_1 = require("vitest/config");
var plugin_react_1 = require("@vitejs/plugin-react");
var path_1 = require("path");
exports.default = (0, config_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
    },
    resolve: {
        alias: {
            '@': (0, path_1.resolve)(__dirname, './src'),
        },
    },
});
