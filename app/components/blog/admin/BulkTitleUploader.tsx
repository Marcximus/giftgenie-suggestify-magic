import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

export const BulkTitleUploader = () => {
  const [titles, setTitles] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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

      const { error } = await supabase
        .from("blog_post_queue")
        .insert(titleList.map(title => ({
          title,
          status: 'pending'
        })));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${titleList.length} titles uploaded successfully`,
      });
      
      setTitles("");
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bulk Upload Titles</h2>
      </div>
      
      <div className="space-y-4">
        <Textarea
          placeholder="Enter titles (one per line)"
          value={titles}
          onChange={(e) => setTitles(e.target.value)}
          className="min-h-[200px]"
        />
        
        <Button 
          onClick={handleUpload} 
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Titles"}
        </Button>
      </div>
    </div>
  );
};