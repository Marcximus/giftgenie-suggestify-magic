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
const About = lazy(() => import("./pages/About"));

const queryClient = new QueryClient();

const Navigation = () => (
  <nav className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-auto">
    <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 sm:px-12 py-2.5 sm:py-3 shadow-lg flex items-center justify-center sm:justify-between gap-6 sm:gap-12">
      <Link to="/" className="text-sm sm:text-base text-[#1EAEDB] hover:text-[#0FA0CE] transition-colors whitespace-nowrap">
        Gift AI
      </Link>
      <Link to="/blog" className="text-sm sm:text-base text-[#1EAEDB] hover:text-[#0FA0CE] transition-colors whitespace-nowrap">
        Blog
      </Link>
      <Link to="/about" className="text-sm sm:text-base text-[#1EAEDB] hover:text-[#0FA0CE] transition-colors whitespace-nowrap">
        About
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
            <Route path="/about" element={<About />} />
          </Routes>
          <Navigation />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;