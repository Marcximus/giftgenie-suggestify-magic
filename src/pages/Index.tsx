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
  imageUrl?: string;
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
        if (error.status === 429) {
          toast({
            title: "Rate Limit Reached",
            description: "Our service is experiencing high demand. Please wait a moment and try again.",
            variant: "destructive"
          });
          return;
        }
        
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.suggestions || !Array.isArray(data.suggestions)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      // Generate image URLs for each suggestion
      const suggestionsWithImages = await Promise.all(
        data.suggestions.map(async (suggestion) => {
          try {
            const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-gift-image', {
              body: { prompt: `${suggestion.title} - ${suggestion.description}` }
            });

            if (imageError) {
              console.error('Error generating image:', imageError);
              return suggestion;
            }

            return {
              ...suggestion,
              imageUrl: imageData?.imageUrl
            };
          } catch (error) {
            console.error('Error generating image:', error);
            return suggestion;
          }
        })
      );

      setSuggestions(suggestionsWithImages);
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
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
        <div className="max-w-3xl mx-auto mb-12">
          <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        </div>
        
        {suggestions.length > 0 && (
          <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {suggestions.map((suggestion, index) => (
              <ProductCard
                key={index}
                title={suggestion.title}
                description={`${suggestion.description}\n\nWhy this gift? ${suggestion.reason}`}
                price={suggestion.priceRange}
                amazonUrl="#"
                imageUrl={suggestion.imageUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;