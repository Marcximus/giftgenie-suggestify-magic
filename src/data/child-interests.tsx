import { Interest } from '@/types/gift-selector';
import { Smile, ThumbsUp, Heart } from 'lucide-react';

export const getChildInterests = (): Interest[] => [
  { label: 'Toys', icon: <Smile /> },
  { label: 'Educational', icon: <ThumbsUp /> },
  { label: 'Arts & Crafts', icon: <Heart /> },
  { label: 'Books', icon: <Smile /> },
  { label: 'Games', icon: <ThumbsUp /> },
  { label: 'Sports', icon: <Heart /> },
];