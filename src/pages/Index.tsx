import { useState } from 'react';
import { SearchBox } from '@/components/SearchBox';
import { ProductCard } from '@/components/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface GiftSuggestion {
  title: string;
  description: string;
  priceRange: string;
  reason: string;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const { toast } = useToast();

  const generateSuggestions = async (query: string, append: boolean = false) => {
    setIsLoading(true);
    if (!append) {
      setSuggestions([]);
    }

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

      setSuggestions(prev => append ? [...prev, ...data.suggestions] : data.suggestions);
      toast({
        title: append ? "More Ideas Generated" : "Success",
        description: append ? "Additional gift suggestions added!" : "Gift suggestions generated successfully!",
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

  const handleSearch = async (query: string) => {
    setLastQuery(query);
    await generateSuggestions(query);
  };

  const handleGenerateMore = async () => {
    if (lastQuery) {
      await generateSuggestions(lastQuery, true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 md:py-12 max-w-7xl">
        <div className="max-w-3xl mx-auto mb-8 sm:mb-12 animate-in slide-in-from-top duration-500">
          <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        </div>
        
        {suggestions.length > 0 && (
          <>
            <div className="mt-6 sm:mt-8 md:mt-12 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards' 
                  }}
                >
                  <ProductCard
                    title={suggestion.title}
                    description={`${suggestion.description}\n\nWhy this gift? ${suggestion.reason}`}
                    price={suggestion.priceRange}
                    amazonUrl="#"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-8 sm:mt-12">
              <Button
                onClick={handleGenerateMore}
                disabled={isLoading}
                className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Sparkles className="w-4 h-4 mr-2 animate-pulse group-hover:animate-none" />
                Generate More Ideas
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;