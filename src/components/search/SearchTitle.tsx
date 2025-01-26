import { Link } from 'react-router-dom';

export const SearchTitle = () => {
  return (
    <div className="flex flex-col space-y-2 sm:space-y-3 text-center">
      <Link 
        to="/" 
        className="hover:opacity-80 transition-opacity"
        aria-label="Get The Gift - Home"
      >
        {/* Preload the gradient background for faster paint */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 opacity-0 pointer-events-none"
          aria-hidden="true"
        />
        <h1 
          className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 inline-block text-transparent bg-clip-text"
          style={{
            // Force GPU acceleration and reduce paint time
            transform: 'translateZ(0)',
            willChange: 'transform',
            // Optimize text rendering
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased'
          }}
        >
          Get The Gift
        </h1>
      </Link>
      <p 
        className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground px-2 font-medium"
        style={{
          // Optimize text rendering
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased'
        }}
      >
        Find the perfect gift with the power of AI
        <br />
        <span 
          className="text-blue-500"
          style={{ 
            // Remove animation for initial paint to improve LCP
            animation: 'none',
            opacity: 1,
            transform: 'none'
          }}
        >
          Type below
        </span> and let internet magic find the best gift ideas:
      </p>
    </div>
  );
};