import { Button } from "@/components/ui/button";
import { Calendar } from 'lucide-react';
import { ageRanges } from '@/data/gift-selector-data';

interface AgeSelectorProps {
  onSelect: (value: string) => void;
}

export const AgeSelector = ({ onSelect }: AgeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto px-4">
      {ageRanges.map((age) => (
        <Button
          key={age.label}
          variant="outline"
          onClick={() => onSelect(age.range)}
          className="transition-all duration-200 hover:scale-105 text-sm h-10 flex items-center"
        >
          <Calendar className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1 text-center">{age.label}</span>
        </Button>
      ))}
    </div>
  );
};