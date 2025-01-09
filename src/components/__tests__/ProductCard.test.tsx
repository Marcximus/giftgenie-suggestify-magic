import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    title: 'Test Product',
    description: 'Test Description',
    price: '99.99',
    amazonUrl: 'https://amazon.com/test',
    imageUrl: 'https://example.com/image.jpg',
    rating: 4.5,
    totalRatings: 100,
    asin: 'B123456789'
  };

  const mockOnMoreLikeThis = vi.fn();

  it('renders product information correctly', () => {
    render(<ProductCard {...mockProduct} onMoreLikeThis={mockOnMoreLikeThis} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('USD 99.99')).toBeInTheDocument();
  });

  it('handles "More like this" button click', () => {
    render(<ProductCard {...mockProduct} onMoreLikeThis={mockOnMoreLikeThis} />);
    
    const moreButton = screen.getByText(/more like this/i);
    fireEvent.click(moreButton);
    
    expect(mockOnMoreLikeThis).toHaveBeenCalledWith(mockProduct.title);
  });

  it('displays rating when provided', () => {
    render(<ProductCard {...mockProduct} onMoreLikeThis={mockOnMoreLikeThis} />);
    
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });
});