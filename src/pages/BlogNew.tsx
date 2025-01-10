import { BlogPostForm } from "@/components/blog/BlogPostForm";

const BlogNew = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Blog Post</h1>
      <BlogPostForm />
    </div>
  );
};

export default BlogNew;