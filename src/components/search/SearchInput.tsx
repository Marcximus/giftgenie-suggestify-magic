import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from 'lucide-react';

interface SearchInputProps {
  query: string;
  onQueryChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  isLoading: boolean;
  showSelector: boolean;
}

export const SearchInput = ({ 
  query, 
  onQueryChange, 
  onSubmit, 
  onReset, 
  isLoading, 
  showSelector 
}: SearchInputProps) => {
  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
      <div className="flex-1 min-w-0 group">
        <textarea
          placeholder="E.g., 'Tech-savvy dad who loves cooking'"
          value={query}
          onChange={onQueryChange}
          className="w-full min-h-[40px] max-h-[120px] text-sm sm:text-base p-2 sm:p-3 rounded-md border border-input bg-background/50 backdrop-blur-sm resize-y overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 group-hover:border-primary/50"
          style={{ lineHeight: '1.5' }}
        />
      </div>
      <div className="flex gap-2 shrink-0">
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full sm:w-auto rounded-full backdrop-blur-lg bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_32px_rgba(31,34,245,0.12)] text-white/90 hover:text-white hover:bg-white/20"
        >
          {isLoading ? (
            <div className="loading-spinner">⌛</div>
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        {!showSelector && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onReset}
            className="flex items-center gap-2 w-full sm:w-auto whitespace-nowrap shadow-sm hover:shadow-md transition-all duration-200 hover:bg-secondary/80"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs sm:text-sm">New Search</span>
          </Button>
        )}
      </div>
    </form>
  );
};