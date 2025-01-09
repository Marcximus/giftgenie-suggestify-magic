import { Button } from "@/components/ui/button";
import { DollarSign } from 'lucide-react';
import { priceRanges } from '@/data/gift-selector-data';

interface PriceSelectorProps {
  onSelect: (value: string) => void;
}

export const PriceSelector = ({ onSelect }: PriceSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto px-4">
      {priceRanges.map((price) => (
        <Button
          key={price.label}
          variant="outline"
          onClick={() => onSelect(price.range)}
          className="transition-all duration-200 hover:scale-105 text-sm h-10 flex items-center"
        >
          <DollarSign className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1 text-center">{price.label}</span>
        </Button>
      ))}
    </div>
  );
};