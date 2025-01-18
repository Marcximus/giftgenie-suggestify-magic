import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const getStatusBadgeClass = (status: string | null) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const generateRandomTimes = async () => {
  const { data: queuedPosts } = await supabase
    .from("blog_post_queue")
    .select("*")
    .is('scheduled_date', null);

  if (!queuedPosts?.length) return;

  const { data: randomTimes } = await supabase
    .rpc('get_random_daily_times');

  if (!randomTimes?.length) return;

  const today = new Date();
  const updates = queuedPosts.map((post, index) => {
    const time = randomTimes[index % randomTimes.length];
    const date = new Date(today);
    date.setDate(date.getDate() + index);
    
    return {
      id: post.id,
      scheduled_date: date.toISOString().split('T')[0],
      scheduled_time: `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`,
    };
  });

  for (const update of updates) {
    await supabase
      .from("blog_post_queue")
      .update(update)
      .eq('id', update.id);
  }
};

export const ScheduledPostsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState<Tables<"blog_post_queue"> | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  const { data: queuedPosts, isLoading, refetch } = useQuery({
    queryKey: ["blog-post-queue"],
    queryFn: async () => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0];

      const { data: publishedPosts } = await supabase
        .from("blog_posts")
        .select("title");

      const publishedTitles = new Set(publishedPosts?.map(post => post.title));

      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true, nullsFirst: false })
        .order('scheduled_time', { ascending: true, nullsFirst: false });
      
      if (error) throw error;

      return (data as Tables<"blog_post_queue">[]).filter(
        post => !publishedTitles.has(post.title)
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string, title: string }) => {
      const { error } = await supabase
        .from("blog_post_queue")
        .update({ title })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post title updated successfully",
      });
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ["blog-post-queue"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update post title",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_post_queue")
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["blog-post-queue"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (post: Tables<"blog_post_queue">) => {
    setEditingPost(post);
    setEditedTitle(post.title);
  };

  const handleSave = async () => {
    if (editingPost && editedTitle.trim()) {
      await updateMutation.mutate({ id: editingPost.id, title: editedTitle.trim() });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      await deleteMutation.mutate(id);
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
        <Button onClick={() => generateRandomTimes()} variant="outline">
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
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(post)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post Title</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Enter new title"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
