import { Interest } from '@/types/gift-selector';
import { 
  Gamepad, Trophy, Computer, Music, Shirt, Video,
  Smartphone, Dumbbell, Headphones, Tv, Monitor, 
  Microscope, Book 
} from 'lucide-react';

export const getTeenInterests = (): Interest[] => [
  { label: 'Gaming', icon: <Gamepad /> },
  { label: 'Sports', icon: <Trophy /> },
  { label: 'Tech', icon: <Computer /> },
  { label: 'Music', icon: <Music /> },
  { label: 'Fashion', icon: <Shirt /> },
  { label: 'Videos', icon: <Video /> },
  { label: 'Phones', icon: <Smartphone /> },
  { label: 'Fitness', icon: <Dumbbell /> },
  { label: 'Headphones', icon: <Headphones /> },
  { label: 'Movies', icon: <Tv /> },
  { label: 'PC Gaming', icon: <Monitor /> },
  { label: 'Science', icon: <Microscope /> },
  { label: 'Books', icon: <Book /> },
];