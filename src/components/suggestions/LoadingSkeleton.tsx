import { SuggestionSkeleton } from '../SuggestionSkeleton';

export const LoadingSkeleton = () => {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <div 
          key={`skeleton-${index}`}
          className="animate-in fade-in duration-300 ease-out"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <SuggestionSkeleton />
        </div>
      ))}
    </>
  );
};