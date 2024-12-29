import { Interest } from '@/types/gift-selector';
import { Folder } from 'lucide-react';

export const getTeenInterests = (): Interest[] => [
  { label: 'Gaming', icon: <Folder /> },
  { label: 'Music', icon: <Folder /> },
  { label: 'Fashion', icon: <Folder /> },
  { label: 'Sports', icon: <Folder /> },
  { label: 'Technology', icon: <Folder /> },
  { label: 'Social Media', icon: <Folder /> },
];