import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Clock } from "lucide-react";

export const ScheduledPostsTab = () => {
  const { toast } = useToast();
  const { data: queuedPosts, isLoading, refetch } = useQuery({
    queryKey: ["blog-post-queue"],
    queryFn: async () => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0];

      // First, get all published post titles
      const { data: publishedPosts } = await supabase
        .from("blog_posts")
        .select("title");

      const publishedTitles = new Set(publishedPosts?.map(post => post.title));

      // Get all pending posts that aren't published yet
      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true, nullsFirst: false })
        .order('scheduled_time', { ascending: true, nullsFirst: false });
      
      if (error) throw error;

      // Filter out posts that are already published
      return (data as Tables<"blog_post_queue">[]).filter(
        post => !publishedTitles.has(post.title)
      );
    },
  });

  const generateRandomTimes = async () => {
    try {
      const { data: times, error } = await supabase
        .rpc('get_random_daily_times');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Random times generated successfully",
      });
      
      refetch();
    } catch (error: any) {
      console.error("Error generating random times:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate random times",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scheduled Posts</h2>
        <Button onClick={generateRandomTimes} variant="outline">
          <Clock className="mr-2 h-4 w-4" /> Generate Random Times
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left w-14">#</TableHead>
              <TableHead className="text-left">Title</TableHead>
              <TableHead className="text-left">Status</TableHead>
              <TableHead className="text-left">Scheduled Date</TableHead>
              <TableHead className="text-left">Scheduled Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queuedPosts?.map((post, index) => (
              <TableRow key={post.id} className={!post.scheduled_date ? 'bg-gray-50' : undefined}>
                <TableCell className="text-left">{index + 1}</TableCell>
                <TableCell className="text-left">{post.title}</TableCell>
                <TableCell className="text-left">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(post.status)}`}>
                    {!post.scheduled_date ? 'unscheduled' : (post.status || 'pending')}
                  </span>
                </TableCell>
                <TableCell className="text-left">
                  {post.scheduled_date ? new Date(post.scheduled_date).toLocaleDateString() : 'Not scheduled'}
                </TableCell>
                <TableCell className="text-left">
                  {post.scheduled_time || 'Not scheduled'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};