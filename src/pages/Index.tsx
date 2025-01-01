import { useState } from 'react';
import { SearchHeader } from '@/components/SearchHeader';
import { SuggestionsGrid } from '@/components/SuggestionsGrid';
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
  const [lastQuery, setLastQuery] = useState('');
  const { toast } = useToast();

  const generateSuggestions = async (query: string, append: boolean = false) => {
    setIsLoading(true);
    if (!append) {
      setSuggestions([]);
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-gift-suggestions', {
        body: { prompt: query }
      });

      if (error) {
        if (error.status === 429) {
          toast({
            title: "Rate Limit Reached",
            description: "Our service is experiencing high demand. Please wait a moment and try again.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      if (!data?.suggestions || !Array.isArray(data.suggestions)) {
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

  const handleMoreLikeThis = async (title: string) => {
    const query = `Find me more gift suggestions similar to "${title}" with similar features and price range`;
    setLastQuery(query);
    await generateSuggestions(query);
  };

  const handleStartOver = () => {
    setSuggestions([]);
    setLastQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 md:py-12 max-w-7xl">
        <SearchHeader onSearch={handleSearch} isLoading={isLoading} />
        
        {suggestions.length > 0 && (
          <SuggestionsGrid
            suggestions={suggestions}
            onMoreLikeThis={handleMoreLikeThis}
            onGenerateMore={handleGenerateMore}
            onStartOver={handleStartOver}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default Index;