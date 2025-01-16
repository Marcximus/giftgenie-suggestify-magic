import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsOverview } from "@/components/blog/admin/StatsOverview";
import { PublishedPostsTab } from "@/components/blog/admin/PublishedPostsTab";
import { ScheduledPostsTab } from "@/components/blog/admin/ScheduledPostsTab";
import { BulkTitleUploader } from "@/components/blog/admin/BulkTitleUploader";

const BlogAdmin = () => {
  const { toast } = useToast();
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Tables<"blog_posts">[];
    },
  });

  const { data: queueStats } = useQuery({
    queryKey: ["queue-stats"],
    queryFn: async () => {
      const { data: publishedPosts, error: publishedError } = await supabase
        .from("blog_posts")
        .select("id", { count: 'exact' })
        .not('published_at', 'is', null);

      if (publishedError) throw publishedError;

      const { data: queueData, error: queueError } = await supabase
        .from("blog_post_queue")
        .select("status");
      
      if (queueError) throw queueError;

      const stats = {
        publishedTotal: publishedPosts.length,
        pending: queueData.filter(post => post.status === 'pending').length,
        generating: queueData.filter(post => post.status === 'generating').length,
        error: queueData.filter(post => post.status === 'error').length
      };

      return stats;
    },
  });

  const handleDelete = async (postId: string) => {
    try {
      const { error: imagesError } = await supabase
        .from("blog_post_images")
        .delete()
        .eq("blog_post_id", postId);

      if (imagesError) throw imagesError;

      const { error: postError } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (postError) throw postError;

      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
      
      refetch();
    } catch (error: any) {
      console.error("Error deleting blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog post",
        variant: "destructive",
      });
    }
  };

  const regenerateSitemap = async () => {
    try {
      const response = await fetch('https://ckcqttsdpxfbpkzljctl.functions.supabase.co/functions/v1/generate-sitemap');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      console.log('Sitemap regenerated:', data);
      toast({
        title: "Success",
        description: "Sitemap regenerated successfully",
      });
    } catch (error: any) {
      console.error('Error regenerating sitemap:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate sitemap",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <div className="flex gap-4">
          <Button onClick={regenerateSitemap} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Sitemap
          </Button>
          <Link to="/blog/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </Link>
        </div>
      </div>

      <StatsOverview
        publishedTotal={queueStats?.publishedTotal || 0}
        pendingCount={queueStats?.pending || 0}
        generatingCount={queueStats?.generating || 0}
        errorCount={queueStats?.error || 0}
      />

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Published Posts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
          <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PublishedPostsTab posts={posts || []} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledPostsTab />
        </TabsContent>

        <TabsContent value="upload">
          <BulkTitleUploader />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogAdmin;