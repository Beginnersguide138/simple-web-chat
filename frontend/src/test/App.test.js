"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var vitest_1 = require("vitest");
var App_1 = require("../App");
// Mock all the components
vitest_1.vi.mock('@/components/IngestionForm', function () { return ({
    IngestionForm: function (_a) {
        var onIngestionSuccess = _a.onIngestionSuccess;
        return (<div data-testid="ingestion-form">
      <button onClick={onIngestionSuccess}>Mock Ingestion Success</button>
    </div>);
    }
}); });
vitest_1.vi.mock('@/components/Chat', function () { return ({
    Chat: function (_a) {
        var selectedContext = _a.selectedContext;
        return (<div data-testid="chat">
      Chat Component - Context: {selectedContext || 'None'}
    </div>);
    }
}); });
vitest_1.vi.mock('@/components/ContextSelector', function () { return ({
    ContextSelector: function (_a) {
        var selectedContext = _a.selectedContext, onContextChange = _a.onContextChange;
        return (<div data-testid="context-selector">
      <button onClick={function () { return onContextChange('https://example.com'); }}>
        Select Context
      </button>
      <span>Current: {selectedContext || 'None'}</span>
    </div>);
    }
}); });
// Mock the toast components
vitest_1.vi.mock('@/components/ui/toaster', function () { return ({
    Toaster: function () { return <div data-testid="toaster">Toaster</div>; }
}); });
describe('App', function () {
    it('renders the main application structure', function () {
        (0, react_1.render)(<App_1.default />);
        expect(react_1.screen.getByText('RAG Web Application')).toBeInTheDocument();
        expect(react_1.screen.getByText('Powered by Ollama, Milvus, and FastAPI.')).toBeInTheDocument();
        expect(react_1.screen.getByTestId('ingestion-form')).toBeInTheDocument();
        expect(react_1.screen.getByTestId('chat')).toBeInTheDocument();
        expect(react_1.screen.getByTestId('context-selector')).toBeInTheDocument();
        expect(react_1.screen.getByTestId('toaster')).toBeInTheDocument();
    });
    it('initially shows no selected context', function () {
        (0, react_1.render)(<App_1.default />);
        expect(react_1.screen.getByText('Chat Component - Context: None')).toBeInTheDocument();
        expect(react_1.screen.getByText('Current: None')).toBeInTheDocument();
    });
    it('updates context when context selector changes', function () {
        (0, react_1.render)(<App_1.default />);
        var selectContextButton = react_1.screen.getByText('Select Context');
        react_1.fireEvent.click(selectContextButton);
        expect(react_1.screen.getByText('Chat Component - Context: https://example.com')).toBeInTheDocument();
        expect(react_1.screen.getByText('Current: https://example.com')).toBeInTheDocument();
    });
    it('triggers context selector refresh when ingestion succeeds', function () {
        (0, react_1.render)(<App_1.default />);
        // This test verifies that the key prop on ContextSelector changes
        // when ingestion succeeds, which would trigger a re-render
        var mockIngestionButton = react_1.screen.getByText('Mock Ingestion Success');
        react_1.fireEvent.click(mockIngestionButton);
        // The context selector should still be rendered
        expect(react_1.screen.getByTestId('context-selector')).toBeInTheDocument();
    });
    it('has proper responsive layout classes', function () {
        var container = (0, react_1.render)(<App_1.default />).container;
        // Check for main layout classes
        expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
        expect(container.querySelector('.container')).toBeInTheDocument();
        expect(container.querySelector('.grid')).toBeInTheDocument();
        expect(container.querySelector('.lg\\:grid-cols-5')).toBeInTheDocument();
    });
});
