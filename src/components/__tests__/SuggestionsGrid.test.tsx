import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionsGrid } from '../SuggestionsGrid';

describe('SuggestionsGrid', () => {
  const mockSuggestions = [
    {
      title: 'Test Product 1',
      description: 'Description 1',
      priceRange: 'USD 99.99',
      reason: 'Test reason 1',
      amazon_asin: 'B123456789',
      amazon_url: 'https://amazon.com/test1',
      amazon_price: 99.99,
      amazon_image_url: 'https://example.com/image1.jpg',
      amazon_rating: 4.5,
      amazon_total_ratings: 100
    }
  ];

  const mockProps = {
    suggestions: mockSuggestions,
    onMoreLikeThis: vi.fn(),
    onGenerateMore: vi.fn(),
    onStartOver: vi.fn(),
    isLoading: false
  };

  it('renders suggestions correctly', () => {
    render(<SuggestionsGrid {...mockProps} />);
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    render(<SuggestionsGrid {...mockProps} isLoading={true} />);
    
    // Check for skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles button clicks correctly', () => {
    render(<SuggestionsGrid {...mockProps} />);
    
    const generateMoreButton = screen.getByText(/generate more ideas/i);
    const startOverButton = screen.getByText(/start over/i);
    
    fireEvent.click(generateMoreButton);
    expect(mockProps.onGenerateMore).toHaveBeenCalled();
    
    fireEvent.click(startOverButton);
    expect(mockProps.onStartOver).toHaveBeenCalled();
  });
});