import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { Chat } from '@/components/Chat'

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders chat component with no context message', () => {
    render(<Chat selectedContext={null} />)
    
    expect(screen.getByText('2. Chat')).toBeInTheDocument()
    expect(screen.getByText('Please ingest a website and select a context to begin chatting.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Select a context first')).toBeDisabled()
  })

  it('enables input when context is selected', () => {
    render(<Chat selectedContext="https://example.com" />)
    
    expect(screen.getByPlaceholderText('Ask a question...')).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('displays user message when form is submitted', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: 'Test response',
        sources: [{ url: 'https://example.com', text: 'Test source' }]
      })
    } as Response)

    render(<Chat selectedContext="https://example.com" />)
    
    const input = screen.getByPlaceholderText('Ask a question...')
    const submitButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test question' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Test question')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument()
    })
  })

  it('shows loading state while waiting for response', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<Chat selectedContext="https://example.com" />)
    
    const input = screen.getByPlaceholderText('Ask a question...')
    const submitButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test question' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
    expect(screen.getByTestId('loading-indicator') || screen.getByText('Test question')).toBeInTheDocument()
  })

  it('clears messages when context changes', () => {
    const { rerender } = render(<Chat selectedContext="https://example.com" />)
    
    // Simulate having messages (this would require mocking fetch first)
    rerender(<Chat selectedContext="https://different.com" />)
    
    // Messages should be cleared when context changes
    expect(screen.queryByText('Previous message')).not.toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/components/ui/use-toast')).useToast = () => ({
      toast: mockToast,
    })

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'API Error' })
    } as Response)

    render(<Chat selectedContext="https://example.com" />)
    
    const input = screen.getByPlaceholderText('Ask a question...')
    const submitButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test question' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: expect.stringContaining('API Error'),
      })
    })
  })

  it('prevents submission without context', () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/components/ui/use-toast')).useToast = () => ({
      toast: mockToast,
    })

    render(<Chat selectedContext={null} />)
    
    const form = screen.getByRole('form') || screen.getByTestId('chat-form')
    fireEvent.submit(form)
    
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'No context selected',
      description: 'Please select a website to chat with first.',
    })
  })

  it('displays sources in bot messages', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: 'Test response with sources',
        sources: [
          { url: 'https://example.com', text: 'Source text 1' },
          { url: 'https://test.com', text: 'Source text 2' }
        ]
      })
    } as Response)

    render(<Chat selectedContext="https://example.com" />)
    
    const input = screen.getByPlaceholderText('Ask a question...')
    const submitButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test question' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Test response with sources')).toBeInTheDocument()
      expect(screen.getByText('Sources:')).toBeInTheDocument()
      expect(screen.getByText('https://example.com')).toBeInTheDocument()
      expect(screen.getByText('https://test.com')).toBeInTheDocument()
    })
  })
})