import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsOverview } from "@/components/blog/admin/StatsOverview";
import { PublishedPostsTab } from "@/components/blog/admin/PublishedPostsTab";
import { ScheduledPostsTab } from "@/components/blog/admin/ScheduledPostsTab";
import { BulkTitleUploader } from "@/components/blog/admin/BulkTitleUploader";

const Blog = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center text-sm text-muted-foreground mt-8 mb-4">
        Some links may contain affiliate links from Amazon and other vendors
      </div>
      <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>
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

export default Blog;
