import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { people } from '@/data/gift-selector-data';

interface PersonSelectorProps {
  selectedPerson: string;
  onSelect: (value: string) => void;
}

export const PersonSelector = ({ selectedPerson, onSelect }: PersonSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-start mx-auto max-w-4xl">
      {people.map((person) => (
        <Button
          key={person.label}
          variant="outline"
          onClick={() => onSelect(person.label)}
          className={cn(
            "w-full max-w-[150px] transition-all duration-200 hover:scale-105 flex items-center gap-2",
            selectedPerson === person.label && "bg-primary text-primary-foreground"
          )}
        >
          <span className="text-lg">{person.icon}</span>
          <span className="flex-1 text-center">{person.label}</span>
        </Button>
      ))}
    </div>
  );
};