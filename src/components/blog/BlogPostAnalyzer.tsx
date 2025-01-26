import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export const BlogPostAnalyzer = () => {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["blog-posts-analysis"],
    queryFn: async () => {
      console.log("Fetching all blog posts for analysis...");
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching blog posts:", error);
        throw error;
      }

      return data as Tables<"blog_posts">[];
    },
  });

  const analyzeFormatting = (content: string) => {
    const issues: string[] = [];

    // Check for centered Amazon button
    if (!content.includes('class="flex justify-center') && 
        !content.includes('class="text-center') && 
        content.includes('View on Amazon')) {
      issues.push("View on Amazon button might not be centered");
    }

    // Check for centered headline
    if (!content.includes('<h1 class="text-center')) {
      issues.push("Headline might not be centered");
    }

    // Check for left-aligned intro and main body text
    if (!content.includes('class="text-left"') && 
        !content.includes('prose-p:text-left')) {
      issues.push("Text alignment issues in intro or main body");
    }

    return issues;
  };

  const handleAnalyze = () => {
    if (!posts) return;

    console.log("\n=== Blog Post Format Analysis ===\n");
    
    const postsWithIssues = posts.filter(post => {
      const issues = analyzeFormatting(post.content);
      if (issues.length > 0) {
        console.log(`\nPost: "${post.title}"\nSlug: ${post.slug}\nIssues found:`);
        issues.forEach(issue => console.log(`- ${issue}`));
        return true;
      }
      return false;
    });

    if (postsWithIssues.length === 0) {
      toast({
        title: "Analysis Complete",
        description: "No formatting issues found in any blog posts.",
      });
    } else {
      toast({
        title: "Analysis Complete",
        description: `Found ${postsWithIssues.length} posts with potential formatting issues. Check the console for details.`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading blog posts...</div>;
  }

  if (error) {
    return <div>Error loading blog posts: {error.message}</div>;
  }

  return (
    <div className="p-4">
      <Button 
        onClick={handleAnalyze}
        className="bg-primary hover:bg-primary/90"
      >
        Analyze Blog Post Formatting
      </Button>
    </div>
  );
};