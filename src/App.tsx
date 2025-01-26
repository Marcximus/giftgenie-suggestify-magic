import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { FloatingNav } from "@/components/FloatingNav";
import "./App.css";

// Lazy load all routes except the index page
const Index = lazy(() => import("@/pages/Index"));
const About = lazy(() => import("@/pages/About"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const BlogAdmin = lazy(() => import("@/pages/BlogAdmin"));
const BlogNew = lazy(() => import("@/pages/BlogNew"));
const BlogEdit = lazy(() => import("@/pages/BlogEdit"));
const Auth = lazy(() => import("@/pages/Auth"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/post/:slug" element={<BlogPost />} />
          <Route path="/blog/admin" element={<BlogAdmin />} />
          <Route path="/blog/new" element={<BlogNew />} />
          <Route path="/blog/edit/:slug" element={<BlogEdit />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </Suspense>
      <FloatingNav />
      <Toaster />
    </Router>
  );
}

export default App;