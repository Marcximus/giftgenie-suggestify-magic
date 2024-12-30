import { Interest } from '@/types/gift-selector';
import { Smile, Heart, ThumbsUp } from 'lucide-react';

export const commonInterests: Interest[] = [
  { label: 'Reading', icon: <Smile /> },
  { label: 'Music', icon: <Heart /> },
  { label: 'Movies', icon: <ThumbsUp /> },
  { label: 'Travel', icon: <Smile /> },
  { label: 'Sports', icon: <ThumbsUp /> },
  { label: 'Art', icon: <Heart /> },
];