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

      // Get random time slots for all titles
      const { data: timeSlots } = await supabase.rpc('get_random_daily_times');
      if (!timeSlots || timeSlots.length === 0) {
        throw new Error("Failed to get time slots");
      }
      
      const currentDate = new Date();
      const newPosts = titles.map((title, index) => {
        const postDate = new Date(currentDate);
        // Distribute posts across days, 3 per day
        postDate.setDate(postDate.getDate() + Math.floor(index / 3));
        
        // Use modulo to cycle through the time slots
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
          Upload a .txt file with one title per line. Posts will be scheduled at 3 per day.
        </p>
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
                <TableCell className="text-left">{getStatusBadge(post.status)}</TableCell>
                <TableCell className="text-left">
                  {post.scheduled_date
                    ? new Date(post.scheduled_date).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="text-left">{post.scheduled_time || "-"}</TableCell>
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