import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { PublishedPostsTab } from "@/components/blog/admin/PublishedPostsTab";
import { ScheduledPostsTab } from "@/components/blog/admin/ScheduledPostsTab";
import { StatsOverview } from "@/components/blog/admin/StatsOverview";
import { BulkTitleUploader } from "@/components/blog/admin/BulkTitleUploader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

const BlogAdmin = () => {
  const [activeTab, setActiveTab] = useState("published");
  const { toast } = useToast();

  const { data: publishedPosts, refetch: refetchPublished } = useQuery({
    queryKey: ["published-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select()
        .not("published_at", "is", null)
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error fetching published posts:", error);
        toast({
          title: "Error",
          description: "Failed to fetch published posts",
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
  });

  const { data: scheduledPosts, refetch: refetchScheduled } = useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_queue")
        .select()
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching scheduled posts:", error);
        toast({
          title: "Error",
          description: "Failed to fetch scheduled posts",
          variant: "destructive",
        });
        throw error;
      }

      return data || [];
    },
  });

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });

      // Refresh the posts list
      refetchPublished();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Admin</h1>
        <Button asChild>
          <Link to="/blog/new">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      <StatsOverview />

      <div className="mt-8">
        <BulkTitleUploader />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="published">Published Posts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          {publishedPosts && (
            <PublishedPostsTab 
              posts={publishedPosts} 
              onDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          {scheduledPosts && <ScheduledPostsTab posts={scheduledPosts} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogAdmin;