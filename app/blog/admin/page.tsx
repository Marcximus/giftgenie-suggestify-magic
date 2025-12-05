'use client'

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsOverview } from "@/components/blog/admin/StatsOverview";
import { PublishedPostsTab } from "@/components/blog/admin/PublishedPostsTab";
import { ScheduledPostsTab } from "@/components/blog/admin/ScheduledPostsTab";
import { BulkTitleUploader } from "@/components/blog/admin/BulkTitleUploader";

export default function BlogAdmin() {
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
      // First, get all published post titles
      const { data: publishedPosts, error: publishedError } = await supabase
        .from("blog_posts")
        .select("title");

      if (publishedError) throw publishedError;

      const publishedTitles = new Set(publishedPosts?.map(post => post.title));

      // Then get queue data and filter out published posts
      const { data: queueData, error: queueError } = await supabase
        .from("blog_post_queue")
        .select("status, title");

      if (queueError) throw queueError;

      // Filter out posts that are already published
      const unpublishedQueueData = queueData.filter(post => !publishedTitles.has(post.title));

      const pendingCount = unpublishedQueueData.filter(post => post.status === 'pending').length;
      const processingCount = unpublishedQueueData.filter(post => post.status === 'processing').length;

      return {
        pending: pendingCount,
        processing: processingCount,
        total: unpublishedQueueData.length
      };
    },
  });

  const publishedPosts = posts?.filter(post => post.published_at) || [];
  const scheduledPosts = posts?.filter(post => !post.published_at) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Blog Admin</h1>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/blog/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      <StatsOverview
        publishedTotal={publishedPosts.length}
        pendingCount={queueStats?.pending || 0}
        generatingCount={queueStats?.processing || 0}
        errorCount={0}
      />

      <BulkTitleUploader />

      <Tabs defaultValue="published" className="mt-8">
        <TabsList>
          <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Drafts ({scheduledPosts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          <PublishedPostsTab posts={publishedPosts} onDelete={async () => {}} />
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledPostsTab posts={scheduledPosts} onUpdate={refetch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
