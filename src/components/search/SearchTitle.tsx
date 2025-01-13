import { Link } from 'react-router-dom';

export const SearchTitle = () => {
  return (
    <div className="flex flex-col space-y-2 sm:space-y-3 text-center">
      <Link to="/" className="group">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white/90 hover:text-white transition-colors duration-200 animate-in fade-in slide-in-from-top-4 duration-700">
          Get The Gift
        </h1>
      </Link>
      <p className="text-[0.7rem] sm:text-xs md:text-sm text-white/80 animate-in fade-in slide-in-from-top-4 duration-700 delay-150 px-2">
        Find the perfect gift with the power of AI
        <br />
        Type and let internet magic find the absolute top ideas:
      </p>
    </div>
  );
};