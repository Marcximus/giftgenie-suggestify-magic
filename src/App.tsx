import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import BlogNew from "@/pages/BlogNew";
import BlogEdit from "@/pages/BlogEdit";
import BlogAdmin from "@/pages/BlogAdmin";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/post/:slug" element={<BlogPost />} />
        <Route path="/blog/new" element={<BlogNew />} />
        <Route path="/blog/edit/:id" element={<BlogEdit />} />
        <Route path="/blog/admin" element={<BlogAdmin />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;