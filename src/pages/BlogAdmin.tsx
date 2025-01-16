import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PublishedPostsTab } from "@/components/blog/admin/PublishedPostsTab";
import { QueueTab } from "@/components/blog/admin/QueueTab";
import { ScheduledPostsTab } from "@/components/blog/admin/ScheduledPostsTab";

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
        <h1 className="text-3xl font-bold">Blog Management</h1>
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

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Published Posts</TabsTrigger>
          <TabsTrigger value="queue">Generation Queue</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PublishedPostsTab />
        </TabsContent>

        <TabsContent value="queue">
          <QueueTab />
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledPostsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogAdmin;