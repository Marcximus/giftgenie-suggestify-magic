import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QueueUploaderProps {
  onUploadSuccess: () => void;
}

export const QueueUploader = ({ onUploadSuccess }: QueueUploaderProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

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

      const { data: timeSlots } = await supabase.rpc('get_random_daily_times');
      if (!timeSlots || timeSlots.length === 0) {
        throw new Error("Failed to get time slots");
      }
      
      const currentDate = new Date();
      const newPosts = titles.map((title, index) => {
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
      onUploadSuccess();
    } catch (error: any) {
      console.error("Error uploading titles:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload titles",
        variant: "destructive",
      });
    }
  };

  return (
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
  );
};