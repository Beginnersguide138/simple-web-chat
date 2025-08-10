"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
(0, vitest_1.describe)('Simple Test', function () {
    (0, vitest_1.it)('should pass a basic test', function () {
        (0, vitest_1.expect)(1 + 1).toBe(2);
    });
    (0, vitest_1.it)('should work with strings', function () {
        var greeting = 'Hello World';
        (0, vitest_1.expect)(greeting).toContain('World');
    });
    (0, vitest_1.it)('should work with arrays', function () {
        var fruits = ['apple', 'banana', 'cherry'];
        (0, vitest_1.expect)(fruits).toHaveLength(3);
        (0, vitest_1.expect)(fruits).toContain('banana');
    });
    (0, vitest_1.it)('should work with objects', function () {
        var user = {
            name: 'Test User',
            age: 25,
            active: true
        };
        (0, vitest_1.expect)(user.name).toBe('Test User');
        (0, vitest_1.expect)(user.age).toBeGreaterThan(18);
        (0, vitest_1.expect)(user.active).toBe(true);
    });
});
