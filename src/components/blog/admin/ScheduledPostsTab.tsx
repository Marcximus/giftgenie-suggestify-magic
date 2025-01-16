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
      const currentDate = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      const currentTime = now.toTimeString().split(' ')[0]; // Get current time in HH:MM:SS format

      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .not('status', 'eq', 'published')
        .or(`scheduled_date.gt.${currentDate},and(scheduled_date.eq.${currentDate},scheduled_time.gt.${currentTime})`)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });
      
      if (error) throw error;
      return data as Tables<"blog_post_queue">[];
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
              <TableHead className="text-left">Title</TableHead>
              <TableHead className="text-left">Status</TableHead>
              <TableHead className="text-left">Scheduled Date</TableHead>
              <TableHead className="text-left">Scheduled Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queuedPosts?.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="text-left">{post.title}</TableCell>
                <TableCell className="text-left">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(post.status)}`}>
                    {post.status || 'pending'}
                  </span>
                </TableCell>
                <TableCell className="text-left">
                  {post.scheduled_date ? new Date(post.scheduled_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-left">
                  {post.scheduled_time || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};