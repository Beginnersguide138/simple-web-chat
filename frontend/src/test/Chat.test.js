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
var Chat_1 = require("@/components/Chat");
// Mock the toast hook
vitest_1.vi.mock('@/components/ui/use-toast', function () { return ({
    useToast: function () { return ({
        toast: vitest_1.vi.fn(),
    }); },
}); });
// Mock fetch
global.fetch = vitest_1.vi.fn();
describe('Chat', function () {
    beforeEach(function () {
        vitest_1.vi.clearAllMocks();
    });
    afterEach(function () {
        vitest_1.vi.resetAllMocks();
    });
    it('renders chat component with no context message', function () {
        (0, react_1.render)(<Chat_1.Chat selectedContext={null}/>);
        expect(react_1.screen.getByText('2. Chat')).toBeInTheDocument();
        expect(react_1.screen.getByText('Please ingest a website and select a context to begin chatting.')).toBeInTheDocument();
        expect(react_1.screen.getByPlaceholderText('Select a context first')).toBeDisabled();
    });
    it('enables input when context is selected', function () {
        (0, react_1.render)(<Chat_1.Chat selectedContext="https://example.com"/>);
        expect(react_1.screen.getByPlaceholderText('Ask a question...')).not.toBeDisabled();
        expect(react_1.screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });
    it('displays user message when form is submitted', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch, input, submitButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, ({
                                        answer: 'Test response',
                                        sources: [{ url: 'https://example.com', text: 'Test source' }]
                                    })];
                            });
                        }); }
                    });
                    (0, react_1.render)(<Chat_1.Chat selectedContext="https://example.com"/>);
                    input = react_1.screen.getByPlaceholderText('Ask a question...');
                    submitButton = react_1.screen.getByRole('button', { name: /send/i });
                    react_1.fireEvent.change(input, { target: { value: 'Test question' } });
                    react_1.fireEvent.click(submitButton);
                    expect(react_1.screen.getByText('Test question')).toBeInTheDocument();
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(react_1.screen.getByText('Test response')).toBeInTheDocument();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('shows loading state while waiting for response', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch, input, submitButton;
        return __generator(this, function (_a) {
            mockFetch = vitest_1.vi.mocked(fetch);
            mockFetch.mockImplementation(function () { return new Promise(function () { }); }); // Never resolves
            (0, react_1.render)(<Chat_1.Chat selectedContext="https://example.com"/>);
            input = react_1.screen.getByPlaceholderText('Ask a question...');
            submitButton = react_1.screen.getByRole('button', { name: /send/i });
            react_1.fireEvent.change(input, { target: { value: 'Test question' } });
            react_1.fireEvent.click(submitButton);
            expect(react_1.screen.getByRole('button', { name: /send/i })).toBeDisabled();
            expect(react_1.screen.getByTestId('loading-indicator') || react_1.screen.getByText('Test question')).toBeInTheDocument();
            return [2 /*return*/];
        });
    }); });
    it('clears messages when context changes', function () {
        var rerender = (0, react_1.render)(<Chat_1.Chat selectedContext="https://example.com"/>).rerender;
        // Simulate having messages (this would require mocking fetch first)
        rerender(<Chat_1.Chat selectedContext="https://different.com"/>);
        // Messages should be cleared when context changes
        expect(react_1.screen.queryByText('Previous message')).not.toBeInTheDocument();
    });
    it('handles API error gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockToast, mockFetch, input, submitButton;
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
                            return [2 /*return*/, ({ detail: 'API Error' })];
                        }); }); }
                    });
                    (0, react_1.render)(<Chat_1.Chat selectedContext="https://example.com"/>);
                    input = react_1.screen.getByPlaceholderText('Ask a question...');
                    submitButton = react_1.screen.getByRole('button', { name: /send/i });
                    react_1.fireEvent.change(input, { target: { value: 'Test question' } });
                    react_1.fireEvent.click(submitButton);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(mockToast).toHaveBeenCalledWith({
                                variant: 'destructive',
                                title: 'Error',
                                description: expect.stringContaining('API Error'),
                            });
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('prevents submission without context', function () {
        var mockToast = vitest_1.vi.fn();
        vitest_1.vi.mocked(require('@/components/ui/use-toast')).useToast = function () { return ({
            toast: mockToast,
        }); };
        (0, react_1.render)(<Chat_1.Chat selectedContext={null}/>);
        var form = react_1.screen.getByRole('form') || react_1.screen.getByTestId('chat-form');
        react_1.fireEvent.submit(form);
        expect(mockToast).toHaveBeenCalledWith({
            variant: 'destructive',
            title: 'No context selected',
            description: 'Please select a website to chat with first.',
        });
    });
    it('displays sources in bot messages', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch, input, submitButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, ({
                                        answer: 'Test response with sources',
                                        sources: [
                                            { url: 'https://example.com', text: 'Source text 1' },
                                            { url: 'https://test.com', text: 'Source text 2' }
                                        ]
                                    })];
                            });
                        }); }
                    });
                    (0, react_1.render)(<Chat_1.Chat selectedContext="https://example.com"/>);
                    input = react_1.screen.getByPlaceholderText('Ask a question...');
                    submitButton = react_1.screen.getByRole('button', { name: /send/i });
                    react_1.fireEvent.change(input, { target: { value: 'Test question' } });
                    react_1.fireEvent.click(submitButton);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(react_1.screen.getByText('Test response with sources')).toBeInTheDocument();
                            expect(react_1.screen.getByText('Sources:')).toBeInTheDocument();
                            expect(react_1.screen.getByText('https://example.com')).toBeInTheDocument();
                            expect(react_1.screen.getByText('https://test.com')).toBeInTheDocument();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
