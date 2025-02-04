import { Routes as RouterRoutes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import BlogAdmin from "@/pages/BlogAdmin";
import BlogNew from "@/pages/BlogNew";
import BlogEdit from "@/pages/BlogEdit";
import Auth from "@/pages/Auth";
import { FloatingNav } from "@/components/FloatingNav";

export const Routes = () => {
  return (
    <>
      <RouterRoutes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/post/:slug" element={<BlogPost />} />
        <Route path="/blog/admin" element={<BlogAdmin />} />
        <Route path="/blog/new" element={<BlogNew />} />
        <Route path="/blog/edit/:slug" element={<BlogEdit />} />
        <Route path="/auth" element={<Auth />} />
      </RouterRoutes>
      <FloatingNav />
    </>
  );
};