import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export const FloatingNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-lg rounded-full" />
        <div className="relative flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:ring-2 focus:ring-blue-400"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div
            className={cn(
              "absolute bottom-full left-0 w-full p-4 mb-2 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 transition-all duration-200 overflow-hidden",
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            )}
          >
            <div className="space-y-2">
              <Link
                to="/"
                className={cn(
                  "block px-4 py-2 rounded-md transition-colors",
                  isActive('/') ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/blog"
                className={cn(
                  "block px-4 py-2 rounded-md transition-colors",
                  isActive('/blog') ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
                onClick={() => setIsOpen(false)}
              >
                <span className="inline-flex items-center">
                  Ideas
                  <span className="ml-2 text-xs animate-pulse-text">New!</span>
                </span>
              </Link>
              <Link
                to="/about"
                className={cn(
                  "block px-4 py-2 rounded-md transition-colors",
                  isActive('/about') ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};