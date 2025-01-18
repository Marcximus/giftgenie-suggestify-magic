import { SearchBox } from "@/components/SearchBox";
import { SearchHeader } from "@/components/SearchHeader";

const Index = () => {
  return (
    <div className="container mx-auto px-4">
      <SearchHeader />
      <SearchBox />
      <div className="text-center text-sm text-muted-foreground mt-8 mb-4">
        Some links may contain affiliate links from Amazon and other vendors
      </div>
    </div>
  );
};

export default Index;