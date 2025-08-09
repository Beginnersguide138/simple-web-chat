import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { IngestionForm } from '@/components/IngestionForm'

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('IngestionForm', () => {
  const mockOnIngestionSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders ingestion form correctly', () => {
    render(<IngestionForm onIngestionSuccess={mockOnIngestionSuccess} />)
    
    expect(screen.getByText('1. Ingest a Website')).toBeInTheDocument()
    expect(screen.getByText('Enter a URL to scrape and add its content to the knowledge base.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument()
    expect(screen.getByText('Process URL')).toBeInTheDocument()
  })

  it('shows validation error when submitting empty URL', () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/components/ui/use-toast')).useToast = () => ({
      toast: mockToast,
    })

    render(<IngestionForm onIngestionSuccess={mockOnIngestionSuccess} />)
    
    const submitButton = screen.getByText('Process URL')
    fireEvent.click(submitButton)
    
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: 'URL is required',
      description: 'Please enter a URL to process.',
    })
  })

  it('successfully processes a URL', async () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/components/ui/use-toast')).useToast = () => ({
      toast: mockToast,
    })

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        url: 'https://example.com',
        message: 'Successfully processed',
        text_length: 1000,
        vector_dim: 384,
        milvus_insert_count: 1
      })
    } as Response)

    render(<IngestionForm onIngestionSuccess={mockOnIngestionSuccess} />)
    
    const urlInput = screen.getByPlaceholderText('https://example.com')
    const submitButton = screen.getByText('Process URL')
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success!',
        description: 'Successfully processed and stored content from https://example.com.',
      })
    })
    
    expect(mockOnIngestionSuccess).toHaveBeenCalled()
    expect(urlInput).toHaveValue('') // URL should be cleared after success
  })

  it('shows loading state during processing', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<IngestionForm onIngestionSuccess={mockOnIngestionSuccess} />)
    
    const urlInput = screen.getByPlaceholderText('https://example.com')
    const submitButton = screen.getByText('Process URL')
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(urlInput).toBeDisabled()
  })

  it('handles API error gracefully', async () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/components/ui/use-toast')).useToast = () => ({
      toast: mockToast,
    })

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Failed to scrape URL' })
    } as Response)

    render(<IngestionForm onIngestionSuccess={mockOnIngestionSuccess} />)
    
    const urlInput = screen.getByPlaceholderText('https://example.com')
    const submitButton = screen.getByText('Process URL')
    
    fireEvent.change(urlInput, { target: { value: 'https://invalid-url.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process URL: Failed to scrape URL',
      })
    })
    
    expect(mockOnIngestionSuccess).not.toHaveBeenCalled()
  })

  it('handles network error', async () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/components/ui/use-toast')).useToast = () => ({
      toast: mockToast,
    })

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<IngestionForm onIngestionSuccess={mockOnIngestionSuccess} />)
    
    const urlInput = screen.getByPlaceholderText('https://example.com')
    const submitButton = screen.getByText('Process URL')
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process URL: Network error',
      })
    })
  })

  it('accepts valid URL input', () => {
    render(<IngestionForm onIngestionSuccess={mockOnIngestionSuccess} />)
    
    const urlInput = screen.getByPlaceholderText('https://example.com')
    
    fireEvent.change(urlInput, { target: { value: 'https://wikipedia.org' } })
    
    expect(urlInput).toHaveValue('https://wikipedia.org')
  })

  it('disables form during loading', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<IngestionForm onIngestionSuccess={mockOnIngestionSuccess} />)
    
    const urlInput = screen.getByPlaceholderText('https://example.com')
    const submitButton = screen.getByText('Process URL')
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } })
    fireEvent.click(submitButton)
    
    expect(urlInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })
})