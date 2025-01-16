import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueueTab } from "@/components/blog/admin/QueueTab";
import { PostsTab } from "@/components/blog/admin/PostsTab";
import { StatsOverview } from "@/components/blog/admin/StatsOverview";

const BlogAdmin = () => {
  const { toast } = useToast();

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

      <StatsOverview />
      
      <Tabs defaultValue="posts" className="mt-8">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts">
          <PostsTab />
        </TabsContent>
        
        <TabsContent value="queue">
          <QueueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogAdmin;