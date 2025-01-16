import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

export const StatsOverview = () => {
  const { data: stats } = useQuery({
    queryKey: ["blog-stats"],
    queryFn: async () => {
      const [publishedPosts, queueItems, scheduledPosts, failedItems] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("count", { count: "exact" }),
        supabase
          .from("blog_post_queue")
          .select("count", { count: "exact" })
          .eq("status", "pending"),
        supabase
          .from("blog_posts")
          .select("count", { count: "exact" })
          .gt("published_at", new Date().toISOString()),
        supabase
          .from("blog_post_queue")
          .select("count", { count: "exact" })
          .eq("status", "failed"),
      ]);

      return {
        publishedCount: publishedPosts.count || 0,
        queueCount: queueItems.count || 0,
        scheduledCount: scheduledPosts.count || 0,
        failedCount: failedItems.count || 0,
      };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Published Posts</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.publishedCount || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Queue</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.queueCount || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.scheduledCount || 0}</div>
        </CardContent>
      </Card>

      <Card className={stats?.failedCount ? "bg-red-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed Items</CardTitle>
          <AlertCircle className={`h-4 w-4 ${stats?.failedCount ? "text-red-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.failedCount || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
};