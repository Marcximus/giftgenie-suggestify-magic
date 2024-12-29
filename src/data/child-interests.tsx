import { Interest } from '@/types/gift-selector';
import { 
  Puzzle, Bot, Rocket, Trophy, Book, Home, Cat, 
  Music, Tv, Gamepad, Microscope, Brush 
} from 'lucide-react';

export const getChildInterests = (): Interest[] => [
  { label: 'Toys', icon: <Puzzle /> },
  { label: 'Robots', icon: <Bot /> },
  { label: 'Space', icon: <Rocket /> },
  { label: 'Sports', icon: <Trophy /> },
  { label: 'Drawing', icon: <Brush /> },
  { label: 'Board Games', icon: <Puzzle /> },
  { label: 'Science', icon: <Microscope /> },
  { label: 'Gaming', icon: <Gamepad /> },
  { label: 'Building', icon: <Home /> },
  { label: 'Animals', icon: <Cat /> },
  { label: 'Music', icon: <Music /> },
  { label: 'Movies', icon: <Tv /> },
  { label: 'Comics', icon: <Book /> },
];