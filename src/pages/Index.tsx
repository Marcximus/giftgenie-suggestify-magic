import { useState } from 'react';
import { SearchBox } from "@/components/SearchBox";
import { SearchHeader } from "@/components/SearchHeader";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      // Implement your search logic here
      console.log('Searching for:', query);
      // Add your search implementation here
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <SearchHeader onSearch={handleSearch} isLoading={isLoading} />
      <SearchBox onSearch={handleSearch} isLoading={isLoading} />
      <div className="text-center text-sm text-muted-foreground mt-8 mb-4">
        Some links may contain affiliate links from Amazon and other vendors
      </div>
    </div>
  );
};

export default Index;