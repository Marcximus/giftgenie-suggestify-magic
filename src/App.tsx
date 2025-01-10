import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SuggestionSkeleton } from "./components/SuggestionSkeleton";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, Info } from "lucide-react";
import { lazy } from "react";

const Index = lazy(() => import("./pages/Index"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/About"));

const queryClient = new QueryClient();

const Navigation = () => (
  <nav className="border-b">
    <div className="container mx-auto px-4 py-4 flex items-center gap-4">
      <Link to="/">
        <Button variant="ghost" className="gap-2">
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Button>
      </Link>
      <Link to="/blog">
        <Button variant="ghost" className="gap-2">
          <BookOpen className="h-4 w-4" />
          <span>Blog</span>
        </Button>
      </Link>
      <Link to="/about">
        <Button variant="ghost" className="gap-2">
          <Info className="h-4 w-4" />
          <span>About</span>
        </Button>
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
        <Navigation />
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;