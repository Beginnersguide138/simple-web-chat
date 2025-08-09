import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { ContextSelector } from '@/components/ContextSelector'

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('ContextSelector', () => {
  const mockOnContextChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders loading state initially', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <ContextSelector 
        selectedContext={null} 
        onContextChange={mockOnContextChange} 
      />
    )
    
    expect(screen.getByText('Select a context to chat with:')).toBeInTheDocument()
    expect(screen.getByText('Loading contexts...')).toBeInTheDocument()
  })

  it('displays contexts when loaded successfully', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['https://example.com', 'https://test.com']
    } as Response)

    render(
      <ContextSelector 
        selectedContext={null} 
        onContextChange={mockOnContextChange} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument()
      expect(screen.getByText('https://test.com')).toBeInTheDocument()
    })
  })

  it('automatically selects first context when none is selected', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['https://example.com', 'https://test.com']
    } as Response)

    render(
      <ContextSelector 
        selectedContext={null} 
        onContextChange={mockOnContextChange} 
      />
    )

    await waitFor(() => {
      expect(mockOnContextChange).toHaveBeenCalledWith('https://example.com')
    })
  })

  it('handles API error gracefully', async () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/components/ui/use-toast')).useToast = () => ({
      toast: mockToast,
    })

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    render(
      <ContextSelector 
        selectedContext={null} 
        onContextChange={mockOnContextChange} 
      />
    )

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load the list of ingested websites.',
      })
    })
  })

  it('shows empty state when no contexts available', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    } as Response)

    render(
      <ContextSelector 
        selectedContext={null} 
        onContextChange={mockOnContextChange} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('No websites ingested yet.')).toBeInTheDocument()
    })
  })

  it('allows context selection', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['https://example.com', 'https://test.com']
    } as Response)

    render(
      <ContextSelector 
        selectedContext="https://example.com" 
        onContextChange={mockOnContextChange} 
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument()
    })

    // Simulate selecting a different context
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    await waitFor(() => {
      const testOption = screen.getByText('https://test.com')
      fireEvent.click(testOption)
    })

    expect(mockOnContextChange).toHaveBeenCalledWith('https://test.com')
  })

  it('disables select when loading or no contexts', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    } as Response)

    render(
      <ContextSelector 
        selectedContext={null} 
        onContextChange={mockOnContextChange} 
      />
    )

    const select = screen.getByRole('combobox')
    
    await waitFor(() => {
      expect(select).toBeDisabled()
    })
  })

  it('handles HTTP error response', async () => {
    const mockToast = vi.fn()
    vi.mocked(require('@/components/ui/use-toast')).useToast = () => ({
      toast: mockToast,
    })

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Server error' })
    } as Response)

    render(
      <ContextSelector 
        selectedContext={null} 
        onContextChange={mockOnContextChange} 
      />
    )

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load the list of ingested websites.',
      })
    })
  })
})