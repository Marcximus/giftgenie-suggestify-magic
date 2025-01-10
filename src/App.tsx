import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SuggestionSkeleton } from "./components/SuggestionSkeleton";
import { lazy } from "react";

const Index = lazy(() => import("./pages/Index"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogAdmin = lazy(() => import("./pages/BlogAdmin"));
const BlogNew = lazy(() => import("./pages/BlogNew"));
const BlogEdit = lazy(() => import("./pages/BlogEdit"));
const About = lazy(() => import("./pages/About"));

const queryClient = new QueryClient();

const Navigation = () => (
  <nav className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-auto">
    <div className="bg-white/10 backdrop-blur-lg rounded-full px-6 sm:px-12 py-3 sm:py-4 shadow-xl flex items-center justify-center gap-8 sm:gap-16 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
      <Link 
        to="/" 
        className="text-sm sm:text-base text-primary font-medium relative whitespace-nowrap flex items-center justify-center group-hover:scale-105"
      >
        Get The Gift
        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></div>
      </Link>
      <Link 
        to="/blog" 
        className="text-sm sm:text-base text-primary hover:text-primary/80 transition-all duration-300 relative whitespace-nowrap flex items-center justify-center group-hover:scale-105 font-medium"
      >
        Blog
        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></div>
      </Link>
      <Link 
        to="/about" 
        className="text-sm sm:text-base text-primary hover:text-primary/80 transition-all duration-300 relative whitespace-nowrap flex items-center justify-center group-hover:scale-105 font-medium"
      >
        About
        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></div>
      </Link>
    </div>
  </nav>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 md:py-12 max-w-7xl">
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <SuggestionSkeleton key={i} />
              ))}
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/blog/admin" element={<BlogAdmin />} />
            <Route path="/blog/new" element={<BlogNew />} />
            <Route path="/blog/edit/:slug" element={<BlogEdit />} />
            <Route path="/about" element={<About />} />
          </Routes>
          <Navigation />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;