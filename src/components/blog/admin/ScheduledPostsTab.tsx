import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const ScheduledPostsTab = () => {
  const { data: scheduledPosts, isLoading } = useQuery({
    queryKey: ["scheduled-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .gt("published_at", new Date().toISOString())
        .order("published_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading scheduled posts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Upcoming Posts</h2>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Scheduled For</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledPosts?.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.title}</TableCell>
                <TableCell>{post.author}</TableCell>
                <TableCell>
                  {new Date(post.published_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {!scheduledPosts?.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No scheduled posts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};