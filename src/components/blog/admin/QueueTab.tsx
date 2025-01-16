import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload } from "lucide-react";

export const QueueTab = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const { data: queuedPosts, refetch } = useQuery({
    queryKey: ["blog-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await file.text();
      const titles = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Get existing queue count
      const { count } = await supabase
        .from("blog_post_queue")
        .select("*", { count: "exact" });

      const maxNewPosts = Math.min(titles.length, 10 - (count || 0));

      if (maxNewPosts <= 0) {
        toast({
          title: "Error",
          description: "Queue is full. Maximum 10 posts allowed in queue.",
          variant: "destructive",
        });
        return;
      }

      // Get random time slots for new posts
      const { data: timeSlots } = await supabase.rpc('get_random_daily_times');
      
      const titlesToAdd = titles.slice(0, maxNewPosts);
      const currentDate = new Date();

      const newPosts = titlesToAdd.map((title, index) => {
        const postDate = new Date(currentDate);
        postDate.setDate(postDate.getDate() + Math.floor(index / 3));
        
        const timeSlot = timeSlots[index % timeSlots.length];
        
        return {
          title,
          status: 'pending',
          scheduled_date: postDate.toISOString().split('T')[0],
          scheduled_time: `${timeSlot.hour.toString().padStart(2, '0')}:${timeSlot.minute.toString().padStart(2, '0')}`,
        };
      });

      const { error } = await supabase
        .from("blog_post_queue")
        .insert(newPosts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${newPosts.length} posts to the queue`,
      });

      setFile(null);
      refetch();
    } catch (error: any) {
      console.error("Error uploading titles:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload titles",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge>Published</Badge>;
      case "generating":
        return <Badge variant="secondary">Generating</Badge>;
      default:
        return <Badge variant="outline">In Queue</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Queue Management</h2>
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="max-w-sm"
          />
          <Button onClick={handleUpload} disabled={!file}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Titles
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload a .txt file with one title per line. Maximum 10 posts in queue.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Scheduled Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queuedPosts?.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.title}</TableCell>
                <TableCell>{getStatusBadge(post.status)}</TableCell>
                <TableCell>
                  {post.scheduled_date
                    ? new Date(post.scheduled_date).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell>{post.scheduled_time || "-"}</TableCell>
              </TableRow>
            ))}
            {(!queuedPosts || queuedPosts.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No posts in queue
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};