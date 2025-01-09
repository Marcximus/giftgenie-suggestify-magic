import { Button } from "@/components/ui/button";
import { getInterests } from '@/utils/interest-utils';

interface InterestSelectorProps {
  selectedPerson: string;
  selectedAge: string;
  onSelect: (value: string) => void;
}

export const InterestSelector = ({ selectedPerson, selectedAge, onSelect }: InterestSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-3xl mx-auto px-4">
      {getInterests(selectedPerson, selectedAge).map((interest) => (
        <Button
          key={interest.label}
          variant="outline"
          onClick={() => onSelect(interest.label)}
          className="transition-all duration-200 hover:scale-105 text-sm h-10 flex items-center"
        >
          <span className="mr-2 shrink-0">{interest.icon}</span>
          <span className="flex-1 text-center">{interest.label}</span>
        </Button>
      ))}
    </div>
  );
};