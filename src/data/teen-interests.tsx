import { Interest } from '@/types/gift-selector';
import { ThumbsUp, Smile, Heart, Frown } from 'lucide-react';

export const getTeenInterests = (): Interest[] => [
  { label: 'Gaming', icon: <ThumbsUp /> },
  { label: 'Music', icon: <Heart /> },
  { label: 'Fashion', icon: <Smile /> },
  { label: 'Sports', icon: <ThumbsUp /> },
  { label: 'Technology', icon: <Smile /> },
  { label: 'Social Media', icon: <Frown /> },
];