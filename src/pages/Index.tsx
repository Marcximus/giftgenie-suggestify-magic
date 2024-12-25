import { useState } from 'react';
import { SearchBox } from '@/components/SearchBox';
import { ProductCard } from '@/components/ProductCard';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      // This is where we'll integrate with OpenAI and Amazon APIs
      // For now, showing a toast to indicate we need API keys
      toast({
        title: "API Configuration Required",
        description: "Please configure the OpenAI API key to enable gift suggestions.",
      });
      
      // Placeholder data for demonstration
      setProducts([
        {
          title: "Example Product",
          description: "This is a placeholder product. Configure APIs to see real suggestions.",
          price: "$XX.XX",
          amazonUrl: "#",
          imageUrl: "/placeholder.svg"
        }
      ]);
    } catch (error) {
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
        
        {products.length > 0 && (
          <div className="results-grid">
            {products.map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;