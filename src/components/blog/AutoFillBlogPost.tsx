import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Import } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "./types/BlogPostTypes";

interface AutoFillBlogPostProps {
  form: UseFormReturn<BlogPostFormData>;
  generateSlug: (title: string) => string;
  generateImage: () => Promise<void>;
  generateAltText: () => Promise<void>;
  generateExcerpt: () => Promise<void>;
  generateFullPost: () => Promise<void>;
  generateAllSEO: () => Promise<void>;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AutoFillBlogPost = ({
  form,
  generateSlug,
  generateImage,
  generateAltText,
  generateExcerpt,
  generateFullPost,
  generateAllSEO,
}: AutoFillBlogPostProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const getNextQueuedTitle = async () => {
    console.log('Fetching next queued title...');
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    const { data: queuedPost, error } = await supabase
      .from("blog_post_queue")
      .select("title")
      .eq("status", "pending")
      .or(`scheduled_date.gt.${currentDate},and(scheduled_date.eq.${currentDate},scheduled_time.gt.${currentTime})`)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching queued post:", error);
      throw new Error(`Failed to fetch queued post: ${error.message}`);
    }

    if (!queuedPost) {
      throw new Error("No pending posts found in queue");
    }

    console.log('Found queued post:', queuedPost);
    return queuedPost.title;
  };

  const updateProgress = (step: number) => {
    setProgress(step * 14.28); // 7 steps = ~14.28% each
  };

  const handleAutoFill = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Get title and set basic fields
      console.log('Starting auto-fill process...');
      const title = await getNextQueuedTitle();
      console.log('Setting form values with title:', title);
      
      form.setValue("title", title);
      form.setValue("slug", generateSlug(title));
      form.setValue("author", "Get The Gift Team");
      updateProgress(1);
      await delay(2000); // Base delay between operations

      // Step 2: Generate image
      console.log('Generating image...');
      await generateImage();
      updateProgress(2);
      await delay(3000); // Longer delay after image generation

      // Step 3: Generate alt text
      console.log('Generating alt text...');
      await generateAltText();
      updateProgress(3);
      await delay(2000);

      // Step 4: Generate excerpt
      console.log('Generating excerpt...');
      await generateExcerpt();
      updateProgress(4);
      await delay(2000);

      // Step 5: Generate full post
      console.log('Generating full post...');
      await generateFullPost();
      updateProgress(5);
      await delay(3000); // Longer delay after full post generation

      // Step 6: Generate SEO content
      console.log('Generating SEO content...');
      await generateAllSEO();
      updateProgress(6);

      // Step 7: Final verification
      console.log('Verifying all content...');
      updateProgress(7);

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
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <Button
        type="button"
        variant="outline"
        onClick={handleAutoFill}
        disabled={isProcessing}
        className="w-full"
      >
        <Import className="w-4 h-4 mr-2" />
        {isProcessing ? "Processing..." : "Import from Queue"}
      </Button>
      {isProcessing && (
        <Progress value={progress} className="w-full h-2" />
      )}
    </div>
  );
};