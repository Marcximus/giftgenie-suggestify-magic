import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBox } from '../SearchBox';
import { BrowserRouter } from 'react-router-dom';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('SearchBox', () => {
  const mockOnSearch = vi.fn();
  
  const renderSearchBox = () => {
    return render(
      <BrowserRouter>
        <SearchBox onSearch={mockOnSearch} isLoading={false} />
      </BrowserRouter>
    );
  };

  it('renders correctly', () => {
    renderSearchBox();
    expect(screen.getByPlaceholderText(/tech-savvy dad/i)).toBeInTheDocument();
  });

  it('handles empty search submission', async () => {
    renderSearchBox();
    const submitButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.click(submitButton);
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('debounces search input', async () => {
    renderSearchBox();
    const input = screen.getByPlaceholderText(/tech-savvy dad/i);
    
    await userEvent.type(input, 'test query');
    
    // Wait for debounce
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test query');
    }, { timeout: 1000 });
  });
});