import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const StatsOverview = () => {
  const { data: stats } = useQuery({
    queryKey: ['blog-stats'],
    queryFn: async () => {
      const [published, queue, failed] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('count')
          .not('published_at', 'is', null)
          .single(),
        supabase
          .from('blog_post_queue')
          .select('count')
          .eq('status', 'pending')
          .single(),
        supabase
          .from('blog_post_queue')
          .select('count')
          .eq('status', 'failed')
          .single()
      ]);

      return {
        published: published?.count || 0,
        queue: queue?.count || 0,
        failed: failed?.count || 0
      };
    }
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium w-full text-center">
            Published Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-center">{stats?.published || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium w-full text-center">
            In Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-center">{stats?.queue || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium w-full text-center">
            Failed Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-center">{stats?.failed || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
};