import { Helmet } from "react-helmet";
import { BlogPostForm } from "@/components/blog/BlogPostForm";

const BlogEdit = () => {
  return (
    <>
      <Helmet>
        <title>Edit Blog Post - Get The Gift</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://getthegift.ai/blog/edit" />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <BlogPostForm />
      </div>
    </>
  );
};

export default BlogEdit;