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
    setSuggestions([]);

    try {
      console.log('Calling edge function with query:', query);
      
      const { data, error } = await supabase.functions.invoke('generate-gift-suggestions', {
        body: { prompt: query }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.suggestions || !Array.isArray(data.suggestions)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      setSuggestions(data.suggestions);
      toast({
        title: "Success",
        description: "Gift suggestions generated successfully!",
      });

    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get gift suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto px-4 py-8">
        <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        
        {suggestions.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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