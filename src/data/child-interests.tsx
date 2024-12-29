import { Interest } from '@/types/gift-selector';
import { Folder } from 'lucide-react';

export const getChildInterests = (): Interest[] => [
  { label: 'Toys', icon: <Folder /> },
  { label: 'Educational', icon: <Folder /> },
  { label: 'Arts & Crafts', icon: <Folder /> },
  { label: 'Books', icon: <Folder /> },
  { label: 'Games', icon: <Folder /> },
  { label: 'Sports', icon: <Folder /> },
];