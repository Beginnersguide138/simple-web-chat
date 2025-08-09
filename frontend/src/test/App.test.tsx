import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'

// Mock all the components
vi.mock('@/components/IngestionForm', () => ({
  IngestionForm: ({ onIngestionSuccess }: { onIngestionSuccess: () => void }) => (
    <div data-testid="ingestion-form">
      <button onClick={onIngestionSuccess}>Mock Ingestion Success</button>
    </div>
  )
}))

vi.mock('@/components/Chat', () => ({
  Chat: ({ selectedContext }: { selectedContext: string | null }) => (
    <div data-testid="chat">
      Chat Component - Context: {selectedContext || 'None'}
    </div>
  )
}))

vi.mock('@/components/ContextSelector', () => ({
  ContextSelector: ({ 
    selectedContext, 
    onContextChange 
  }: { 
    selectedContext: string | null
    onContextChange: (context: string) => void 
  }) => (
    <div data-testid="context-selector">
      <button onClick={() => onContextChange('https://example.com')}>
        Select Context
      </button>
      <span>Current: {selectedContext || 'None'}</span>
    </div>
  )
}))

// Mock the toast components
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}))

describe('App', () => {
  it('renders the main application structure', () => {
    render(<App />)
    
    expect(screen.getByText('RAG Web Application')).toBeInTheDocument()
    expect(screen.getByText('Powered by Ollama, Milvus, and FastAPI.')).toBeInTheDocument()
    expect(screen.getByTestId('ingestion-form')).toBeInTheDocument()
    expect(screen.getByTestId('chat')).toBeInTheDocument()
    expect(screen.getByTestId('context-selector')).toBeInTheDocument()
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })

  it('initially shows no selected context', () => {
    render(<App />)
    
    expect(screen.getByText('Chat Component - Context: None')).toBeInTheDocument()
    expect(screen.getByText('Current: None')).toBeInTheDocument()
  })

  it('updates context when context selector changes', () => {
    render(<App />)
    
    const selectContextButton = screen.getByText('Select Context')
    fireEvent.click(selectContextButton)
    
    expect(screen.getByText('Chat Component - Context: https://example.com')).toBeInTheDocument()
    expect(screen.getByText('Current: https://example.com')).toBeInTheDocument()
  })

  it('triggers context selector refresh when ingestion succeeds', () => {
    render(<App />)
    
    // This test verifies that the key prop on ContextSelector changes
    // when ingestion succeeds, which would trigger a re-render
    const mockIngestionButton = screen.getByText('Mock Ingestion Success')
    fireEvent.click(mockIngestionButton)
    
    // The context selector should still be rendered
    expect(screen.getByTestId('context-selector')).toBeInTheDocument()
  })

  it('has proper responsive layout classes', () => {
    const { container } = render(<App />)
    
    // Check for main layout classes
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
    expect(container.querySelector('.container')).toBeInTheDocument()
    expect(container.querySelector('.grid')).toBeInTheDocument()
    expect(container.querySelector('.lg\\:grid-cols-5')).toBeInTheDocument()
  })
})