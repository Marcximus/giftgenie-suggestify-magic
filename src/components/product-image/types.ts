import { GiftSuggestion } from '@/types/suggestions';

export interface ProductImageProps {
  title: string;
  description: string;
  imageUrl?: string;
  product?: GiftSuggestion;
  asin?: string;
}
