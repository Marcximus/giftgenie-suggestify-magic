import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wand2 } from "lucide-react";
import { UseFormSetValue } from "react-hook-form";
import { BlogPostFormData } from "./types/BlogPostTypes";

interface AutoFillBlogPostProps {
  setValue: UseFormSetValue<BlogPostFormData>;
  onGenerateImage: () => Promise<void>;
  onGenerateAltText: () => Promise<void>;
  onGenerateExcerpt: () => Promise<void>;
  onGenerateFullPost: () => Promise<void>;
  onGenerateAllSEO: () => Promise<void>;
  generateSlug: (title: string) => string;
}

export const AutoFillBlogPost = ({
  setValue,
  onGenerateImage,
  onGenerateAltText,
  onGenerateExcerpt,
  onGenerateFullPost,
  onGenerateAllSEO,
  generateSlug,
}: AutoFillBlogPostProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const getNextQueuedTitle = async () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    const { data: queuedPost, error } = await supabase
      .from("blog_post_queue")
      .select("title")
      .eq('status', 'pending')
      .or(`scheduled_date.gt.${currentDate},and(scheduled_date.eq.${currentDate},scheduled_time.gt.${currentTime})`)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching queued title:", error);
      throw new Error("Failed to fetch next queued title");
    }

    if (!queuedPost) {
      throw new Error("No queued posts found");
    }

    return queuedPost.title;
  };

  const autoFill = async () => {
    try {
      setIsProcessing(true);
      setProgress(0);

      // Step 1: Get title and set basic fields
      const title = await getNextQueuedTitle();
      setValue("title", title);
      setValue("slug", generateSlug(title));
      setValue("author", "Get The Gift Team");
      setProgress(20);

      // Step 2: Generate image
      await onGenerateImage();
      setProgress(35);

      // Step 3: Generate alt text
      await onGenerateAltText();
      setProgress(50);

      // Step 4: Generate excerpt
      await onGenerateExcerpt();
      setProgress(65);

      // Step 5: Generate full post
      await onGenerateFullPost();
      setProgress(80);

      // Step 6: Generate SEO
      await onGenerateAllSEO();
      setProgress(100);

      toast({
        title: "Auto-fill complete",
        description: "All fields have been filled and content generated",
      });
    } catch (error: any) {
      console.error("Auto-fill error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to auto-fill blog post",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <Button
        type="button"
        onClick={autoFill}
        disabled={isProcessing}
        className="w-full"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        {isProcessing ? "Auto-filling..." : "Auto-fill from Queue"}
      </Button>
      {isProcessing && (
        <Progress value={progress} className="w-full h-2" />
      )}
    </div>
  );
};