import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { schedulePostBatch } from "@/utils/blog/schedulingUtils";

export const BulkUploadDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [titles, setTitles] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!titles.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one title",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const titleList = titles
        .split("\n")
        .map(title => title.trim())
        .filter(title => title.length > 0);

      const scheduledPosts = await schedulePostBatch(titleList);

      const { error } = await supabase
        .from("blog_post_queue")
        .insert(scheduledPosts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${titleList.length} titles added to queue`,
      });
      setTitles("");
      setIsOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error uploading titles:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload titles",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Blog Titles</DialogTitle>
          <DialogDescription>
            Enter one blog post title per line. These will be added to the generation queue and scheduled automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Enter blog titles (one per line)..."
            value={titles}
            onChange={(e) => setTitles(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Titles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};