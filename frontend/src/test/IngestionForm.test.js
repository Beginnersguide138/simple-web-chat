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
var IngestionForm_1 = require("@/components/IngestionForm");
// Mock the toast hook
vitest_1.vi.mock('@/components/ui/use-toast', function () { return ({
    useToast: function () { return ({
        toast: vitest_1.vi.fn(),
    }); },
}); });
// Mock fetch
global.fetch = vitest_1.vi.fn();
describe('IngestionForm', function () {
    var mockOnIngestionSuccess = vitest_1.vi.fn();
    beforeEach(function () {
        vitest_1.vi.clearAllMocks();
    });
    afterEach(function () {
        vitest_1.vi.resetAllMocks();
    });
    it('renders ingestion form correctly', function () {
        (0, react_1.render)(<IngestionForm_1.IngestionForm onIngestionSuccess={mockOnIngestionSuccess}/>);
        expect(react_1.screen.getByText('1. Ingest a Website')).toBeInTheDocument();
        expect(react_1.screen.getByText('Enter a URL to scrape and add its content to the knowledge base.')).toBeInTheDocument();
        expect(react_1.screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
        expect(react_1.screen.getByText('Process URL')).toBeInTheDocument();
    });
    it('shows validation error when submitting empty URL', function () {
        var mockToast = vitest_1.vi.fn();
        vitest_1.vi.mocked(require('@/components/ui/use-toast')).useToast = function () { return ({
            toast: mockToast,
        }); };
        (0, react_1.render)(<IngestionForm_1.IngestionForm onIngestionSuccess={mockOnIngestionSuccess}/>);
        var submitButton = react_1.screen.getByText('Process URL');
        react_1.fireEvent.click(submitButton);
        expect(mockToast).toHaveBeenCalledWith({
            variant: 'destructive',
            title: 'URL is required',
            description: 'Please enter a URL to process.',
        });
    });
    it('successfully processes a URL', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockToast, mockFetch, urlInput, submitButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockToast = vitest_1.vi.fn();
                    vitest_1.vi.mocked(require('@/components/ui/use-toast')).useToast = function () { return ({
                        toast: mockToast,
                    }); };
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockResolvedValueOnce({
                        ok: true,
                        json: function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, ({
                                        url: 'https://example.com',
                                        message: 'Successfully processed',
                                        text_length: 1000,
                                        vector_dim: 384,
                                        milvus_insert_count: 1
                                    })];
                            });
                        }); }
                    });
                    (0, react_1.render)(<IngestionForm_1.IngestionForm onIngestionSuccess={mockOnIngestionSuccess}/>);
                    urlInput = react_1.screen.getByPlaceholderText('https://example.com');
                    submitButton = react_1.screen.getByText('Process URL');
                    react_1.fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
                    react_1.fireEvent.click(submitButton);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(mockToast).toHaveBeenCalledWith({
                                title: 'Success!',
                                description: 'Successfully processed and stored content from https://example.com.',
                            });
                        })];
                case 1:
                    _a.sent();
                    expect(mockOnIngestionSuccess).toHaveBeenCalled();
                    expect(urlInput).toHaveValue(''); // URL should be cleared after success
                    return [2 /*return*/];
            }
        });
    }); });
    it('shows loading state during processing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch, urlInput, submitButton;
        return __generator(this, function (_a) {
            mockFetch = vitest_1.vi.mocked(fetch);
            mockFetch.mockImplementation(function () { return new Promise(function () { }); }); // Never resolves
            (0, react_1.render)(<IngestionForm_1.IngestionForm onIngestionSuccess={mockOnIngestionSuccess}/>);
            urlInput = react_1.screen.getByPlaceholderText('https://example.com');
            submitButton = react_1.screen.getByText('Process URL');
            react_1.fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
            react_1.fireEvent.click(submitButton);
            expect(react_1.screen.getByText('Processing...')).toBeInTheDocument();
            expect(urlInput).toBeDisabled();
            return [2 /*return*/];
        });
    }); });
    it('handles API error gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockToast, mockFetch, urlInput, submitButton;
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
                            return [2 /*return*/, ({ detail: 'Failed to scrape URL' })];
                        }); }); }
                    });
                    (0, react_1.render)(<IngestionForm_1.IngestionForm onIngestionSuccess={mockOnIngestionSuccess}/>);
                    urlInput = react_1.screen.getByPlaceholderText('https://example.com');
                    submitButton = react_1.screen.getByText('Process URL');
                    react_1.fireEvent.change(urlInput, { target: { value: 'https://invalid-url.com' } });
                    react_1.fireEvent.click(submitButton);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(mockToast).toHaveBeenCalledWith({
                                variant: 'destructive',
                                title: 'Error',
                                description: 'Failed to process URL: Failed to scrape URL',
                            });
                        })];
                case 1:
                    _a.sent();
                    expect(mockOnIngestionSuccess).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles network error', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockToast, mockFetch, urlInput, submitButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockToast = vitest_1.vi.fn();
                    vitest_1.vi.mocked(require('@/components/ui/use-toast')).useToast = function () { return ({
                        toast: mockToast,
                    }); };
                    mockFetch = vitest_1.vi.mocked(fetch);
                    mockFetch.mockRejectedValueOnce(new Error('Network error'));
                    (0, react_1.render)(<IngestionForm_1.IngestionForm onIngestionSuccess={mockOnIngestionSuccess}/>);
                    urlInput = react_1.screen.getByPlaceholderText('https://example.com');
                    submitButton = react_1.screen.getByText('Process URL');
                    react_1.fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
                    react_1.fireEvent.click(submitButton);
                    return [4 /*yield*/, (0, react_1.waitFor)(function () {
                            expect(mockToast).toHaveBeenCalledWith({
                                variant: 'destructive',
                                title: 'Error',
                                description: 'Failed to process URL: Network error',
                            });
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('accepts valid URL input', function () {
        (0, react_1.render)(<IngestionForm_1.IngestionForm onIngestionSuccess={mockOnIngestionSuccess}/>);
        var urlInput = react_1.screen.getByPlaceholderText('https://example.com');
        react_1.fireEvent.change(urlInput, { target: { value: 'https://wikipedia.org' } });
        expect(urlInput).toHaveValue('https://wikipedia.org');
    });
    it('disables form during loading', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockFetch, urlInput, submitButton;
        return __generator(this, function (_a) {
            mockFetch = vitest_1.vi.mocked(fetch);
            mockFetch.mockImplementation(function () { return new Promise(function () { }); }); // Never resolves
            (0, react_1.render)(<IngestionForm_1.IngestionForm onIngestionSuccess={mockOnIngestionSuccess}/>);
            urlInput = react_1.screen.getByPlaceholderText('https://example.com');
            submitButton = react_1.screen.getByText('Process URL');
            react_1.fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
            react_1.fireEvent.click(submitButton);
            expect(urlInput).toBeDisabled();
            expect(submitButton).toBeDisabled();
            return [2 /*return*/];
        });
    }); });
});
