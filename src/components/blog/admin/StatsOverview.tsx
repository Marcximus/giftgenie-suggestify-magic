import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const StatsOverview = () => {
  const { data: stats } = useQuery({
    queryKey: ["blog-stats"],
    queryFn: async () => {
      const [totalPosts, queuedPosts, publishedToday] = await Promise.all([
        supabase
          .from("blog_posts")
          .select("*", { count: "exact" }),
        supabase
          .from("blog_post_queue")
          .select("*", { count: "exact" }),
        supabase
          .from("blog_posts")
          .select("*", { count: "exact" })
          .gte('published_at', new Date().toISOString().split('T')[0])
      ]);

      return {
        totalPosts: totalPosts.count || 0,
        queuedPosts: queuedPosts.count || 0,
        publishedToday: publishedToday.count || 0,
      };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
          <p className="text-xs text-muted-foreground">
            Published blog posts
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.queuedPosts || 0}</div>
          <p className="text-xs text-muted-foreground">
            Posts waiting to be generated
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Published Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.publishedToday || 0}</div>
          <p className="text-xs text-muted-foreground">
            Posts published today
          </p>
        </CardContent>
      </Card>
    </div>
  );
};