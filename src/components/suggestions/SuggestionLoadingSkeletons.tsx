
import { SuggestionSkeleton } from '../SuggestionSkeleton';

interface SuggestionLoadingSkeletonsProps {
  count: number;
}

export const SuggestionLoadingSkeletons = ({ count }: SuggestionLoadingSkeletonsProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={`skeleton-${index}`} 
          className="animate-in fade-in duration-300 ease-out"
          style={{ animationDelay: `${index * 100}ms` }}
          aria-hidden="true"
        >
          <SuggestionSkeleton />
        </div>
      ))}
    </>
  );
};
