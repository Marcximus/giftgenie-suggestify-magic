import { Link } from 'react-router-dom';

export const SearchTitle = () => {
  return (
    <div className="flex flex-col space-y-2 sm:space-y-3 text-center">
      {/* Preload the gradient text */}
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .gradient-text {
            background-size: 200% auto;
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            animation: gradient 3s ease infinite;
            background-image: linear-gradient(
              to right,
              rgb(147, 51, 234, 0.8),
              rgb(59, 130, 246, 0.8),
              rgb(147, 51, 234, 0.8)
            );
          }
        `}
      </style>
      <Link 
        to="/" 
        className="hover:opacity-80 transition-opacity"
        aria-label="Get The Gift - Home"
      >
        <h1 
          className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text"
          style={{ willChange: 'transform' }}
        >
          Get The Gift
        </h1>
      </Link>
      <div className="space-y-1">
        <p 
          className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground px-2"
          style={{ willChange: 'transform' }}
        >
          Find the perfect gift with the power of AI
        </p>
        <p 
          className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground px-2"
          style={{ willChange: 'transform' }}
        >
          <span className="text-blue-500">Type below</span> and let internet magic find the best gift ideas:
        </p>
      </div>
    </div>
  );
};