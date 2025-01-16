import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UseFormSetValue } from "react-hook-form";
import { BlogPostFormData } from "./types/BlogPostTypes";
import { useToast } from "@/components/ui/use-toast";

interface AutoFillBlogPostProps {
  setValue: UseFormSetValue<BlogPostFormData>;
  onGenerateImage: () => Promise<void>;
  onGenerateAltText: () => Promise<void>;
  onGenerateExcerpt: () => Promise<void>;
  onGenerateFullPost: () => Promise<void>;
  onGenerateAllSEO: () => Promise<void>;
}

export const AutoFillBlogPost = ({
  setValue,
  onGenerateImage,
  onGenerateAltText,
  onGenerateExcerpt,
  onGenerateFullPost,
  onGenerateAllSEO,
}: AutoFillBlogPostProps) => {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const getNextQueuedTitle = async () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    const { data, error } = await supabase
      .from("blog_post_queue")
      .select("title")
      .eq('status', 'pending')
      .or(`scheduled_date.gt.${currentDate},and(scheduled_date.eq.${currentDate},scheduled_time.gt.${currentTime})`)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true })
      .limit(1)
      .single();

    if (error) throw error;
    return data?.title;
  };

  const autoFillAndTrigger = async () => {
    setIsProcessing(true);
    setProgress(0);
    try {
      // Step 1: Get and set title
      const title = await getNextQueuedTitle();
      if (!title) {
        toast({
          title: "Error",
          description: "No queued titles found",
          variant: "destructive",
        });
        return;
      }
      setValue("title", title);
      setProgress(10);

      // Step 2: Generate and set slug
      const slug = generateSlug(title);
      setValue("slug", slug);
      setProgress(20);

      // Step 3: Set author
      setValue("author", "Get The Gift Team");
      setProgress(30);

      // Step 4: Generate image
      await onGenerateImage();
      setProgress(45);

      // Step 5: Generate alt text
      await onGenerateAltText();
      setProgress(60);

      // Step 6: Generate excerpt
      await onGenerateExcerpt();
      setProgress(75);

      // Step 7: Generate full post
      await onGenerateFullPost();
      setProgress(90);

      // Step 8: Generate SEO
      await onGenerateAllSEO();
      setProgress(100);

      toast({
        title: "Success",
        description: "All fields have been filled and content generated",
      });
    } catch (error: any) {
      console.error('Auto-fill error:', error);
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
    <div className="space-y-4">
      <Button
        type="button"
        onClick={autoFillAndTrigger}
        disabled={isProcessing}
        className="w-full"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        {isProcessing ? "Processing..." : "Auto-Fill From Queue"}
      </Button>
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Progress: {progress}%
          </p>
        </div>
      )}
    </div>
  );
};