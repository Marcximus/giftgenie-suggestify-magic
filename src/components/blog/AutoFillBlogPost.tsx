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

  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 2000,
    operationName: string
  ): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add increasing delay between retries
        if (attempt > 1) {
          const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
          console.log(`${operationName}: Retry attempt ${attempt}, waiting ${delayMs}ms...`);
          await delay(delayMs);
        }
        
        const result = await operation();
        console.log(`${operationName}: Operation successful`);
        return result;
      } catch (error: any) {
        console.error(`${operationName}: Attempt ${attempt} failed:`, error);
        
        // Special handling for rate limiting
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          const delayMs = initialDelayMs * Math.pow(2, attempt);
          console.log(`${operationName}: Rate limited, waiting ${delayMs}ms before retry...`);
          await delay(delayMs);
        }
        
        if (attempt === maxRetries) {
          console.error(`${operationName}: All retry attempts failed`);
          throw error;
        }
      }
    }
    throw new Error(`${operationName}: All retry attempts failed`);
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

      // Step 2: Generate image with retry
      console.log('Generating image...');
      await retryOperation(generateImage, 3, 5000, "Image Generation");
      updateProgress(2);
      await delay(5000); // Longer delay after image generation

      // Step 3: Generate alt text with retry
      console.log('Generating alt text...');
      await retryOperation(generateAltText, 3, 3000, "Alt Text Generation");
      updateProgress(3);
      await delay(3000);

      // Step 4: Generate excerpt with retry
      console.log('Generating excerpt...');
      await retryOperation(generateExcerpt, 3, 3000, "Excerpt Generation");
      updateProgress(4);
      await delay(3000);

      // Step 5: Generate full post with retry
      console.log('Generating full post...');
      await retryOperation(generateFullPost, 3, 5000, "Full Post Generation");
      updateProgress(5);
      await delay(5000); // Longer delay after full post generation

      // Step 6: Generate SEO content with retry
      console.log('Generating SEO content...');
      await retryOperation(generateAllSEO, 3, 3000, "SEO Content Generation");
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