import { useState } from 'react';
import { SearchBox } from '@/components/SearchBox';
import { ProductCard } from '@/components/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

interface GiftSuggestion {
  title: string;
  description: string;
  priceRange: string;
  reason: string;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-gift-suggestions', {
        body: { prompt: query }
      });

      if (error) throw error;

      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to get gift suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="search-container">
        <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        
        {suggestions.length > 0 && (
          <div className="results-grid">
            {suggestions.map((suggestion, index) => (
              <ProductCard
                key={index}
                title={suggestion.title}
                description={`${suggestion.description}\n\nWhy this gift? ${suggestion.reason}`}
                price={suggestion.priceRange}
                amazonUrl="#"
                imageUrl="/placeholder.svg"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;