
import { Link } from 'react-router-dom';

export const SearchTitle = () => {
  return (
    <div className="flex flex-col space-y-2 sm:space-y-3 text-center">
      <Link to="/" className="hover:opacity-80 transition-opacity">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 inline-block text-transparent bg-clip-text">
          Get The Gift
        </h1>
      </Link>
      <p className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground px-2">
        Find the perfect gift with the power of AI
        <br />
        <span className="text-blue-500 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">Type below</span> and let internet magic find the best gift ideas:
      </p>
    </div>
  );
};
