"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var vitest_1 = require("vitest");
var ContextSelector_1 = require("@/components/ContextSelector");
// Mock the toast hook
vitest_1.vi.mock('@/components/ui/use-toast', function () { return ({
    useToast: function () { return ({
        toast: vitest_1.vi.fn(),
    }); },
}); });
// Mock fetch
global.fetch = vitest_1.vi.fn();
describe('ContextSelector', function () {
    var mockOnContextChange = vitest_1.vi.fn();
    beforeEach(function () {
        vitest_1.vi.clearAllMocks();
    });
    afterEach(function () {
        vitest_1.vi.resetAllMocks();
    });
    it('renders loading state initially', function () {
        var mockFetch = vitest_1.vi.mocked(fetch);
        mockFetch.mockImplementation(function () { return new Promise(function () { }); }); // Never resolves
        (0, react_1.render)(<ContextSelector_1.ContextSelector selectedContext={null} onContextChange={mockOnContextChange}/>);
        expect(react_1.screen.getByText('Select a context to chat with:')).toBeInTheDocument();
        expect(react_1.screen.getByText('Loading contexts...')).toBeInTheDocument();
    });
    it('displays contexts when loaded successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ['https://example.com', 'https://test.com']];
                        }); }); }
                    });
                    (0, react_1.render)(<ContextSelector_1.ContextSelector selectedContext={null} onContextChange={mockOnContextChange}/>);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(react_1.screen.getByText('https://example.com')).toBeInTheDocument();
                            expect(react_1.screen.getByText('https://test.com')).toBeInTheDocument();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('automatically selects first context when none is selected', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ['https://example.com', 'https://test.com']];
                        }); }); }
                    });
                    (0, react_1.render)(<ContextSelector_1.ContextSelector selectedContext={null} onContextChange={mockOnContextChange}/>);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(mockOnContextChange).toHaveBeenCalledWith('https://example.com');
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles API error gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockToast, mockFetch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockToast = vitest_1.vi.fn();
                    vitest_1.vi.mocked(require('@/components/ui/use-toast')).useToast = function () { return ({
                        toast: mockToast,
                    }); };
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockRejectedValueOnce(new Error('API Error'));
                    (0, react_1.render)(<ContextSelector_1.ContextSelector selectedContext={null} onContextChange={mockOnContextChange}/>);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(mockToast).toHaveBeenCalledWith({
                                variant: 'destructive',
                                title: 'Error',
                                description: 'Could not load the list of ingested websites.',
                            });
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('shows empty state when no contexts available', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, []];
                        }); }); }
                    });
                    (0, react_1.render)(<ContextSelector_1.ContextSelector selectedContext={null} onContextChange={mockOnContextChange}/>);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(react_1.screen.getByText('No websites ingested yet.')).toBeInTheDocument();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('allows context selection', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch, select;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ['https://example.com', 'https://test.com']];
                        }); }); }
                    });
                    (0, react_1.render)(<ContextSelector_1.ContextSelector selectedContext="https://example.com" onContextChange={mockOnContextChange}/>);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(react_1.screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
                        })
                        // Simulate selecting a different context
                    ];
                case 1:
                    _a.sent();
                    select = react_1.screen.getByRole('combobox');
                    react_1.fireEvent.click(select);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            var testOption = react_1.screen.getByText('https://test.com');
                            react_1.fireEvent.click(testOption);
                        })];
                case 2:
                    _a.sent();
                    expect(mockOnContextChange).toHaveBeenCalledWith('https://test.com');
                    return [2 /*return*/];
            }
        });
    }); });
    it('disables select when loading or no contexts', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch, select;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, []];
                        }); }); }
                    });
                    (0, react_1.render)(<ContextSelector_1.ContextSelector selectedContext={null} onContextChange={mockOnContextChange}/>);
                    select = react_1.screen.getByRole('combobox');
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(select).toBeDisabled();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles HTTP error response', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockToast, mockFetch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockToast = vitest_1.vi.fn();
                    vitest_1.vi.mocked(require('@/components/ui/use-toast')).useToast = function () { return ({
                        toast: mockToast,
                    }); };
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockResolvedValueOnce({
                        ok: false,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, ({ detail: 'Server error' })];
                        }); }); }
                    });
                    (0, react_1.render)(<ContextSelector_1.ContextSelector selectedContext={null} onContextChange={mockOnContextChange}/>);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(mockToast).toHaveBeenCalledWith({
                                variant: 'destructive',
                                title: 'Error',
                                description: 'Could not load the list of ingested websites.',
                            });
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
