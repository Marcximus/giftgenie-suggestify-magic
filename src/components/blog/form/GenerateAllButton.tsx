import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";

interface GenerateAllButtonProps {
  form: UseFormReturn<BlogPostFormData>;
  generateSlug: (title: string) => string;
  generateAltText: () => Promise<void>;
  handleAIGenerate: (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => Promise<void>;
  generateFullPostRef: (() => Promise<void>) | null;
}

export const GenerateAllButton = ({
  form,
  generateSlug,
  generateAltText,
  handleAIGenerate,
  generateFullPostRef
}: GenerateAllButtonProps) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const { toast } = useToast();

  const generateAll = async () => {
    setIsGeneratingAll(true);
    setGenerationProgress(0);
    
    try {
      // 1. Fetch next queued title
      setGenerationStatus("Fetching next queued title...");
      const { data: queuedPost, error: queueError } = await supabase
        .from("blog_post_queue")
        .select("*")
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true })
        .limit(1)
        .single();

      if (queueError) throw queueError;
      if (!queuedPost) {
        toast({
          title: "Error",
          description: "No queued posts found",
          variant: "destructive"
        });
        return;
      }

      // 2. Set title and generate slug
      setGenerationProgress(10);
      form.setValue("title", queuedPost.title);
      form.setValue("slug", generateSlug(queuedPost.title));
      form.setValue("author", "Get The Gift Team");

      // 3. Generate featured image
      setGenerationStatus("Generating featured image...");
      setGenerationProgress(20);
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-blog-image', {
        body: { title: queuedPost.title }
      });
      if (imageError) throw imageError;
      if (imageData?.imageUrl) {
        form.setValue("image_url", imageData.imageUrl);
      }

      // 4. Generate alt text
      setGenerationStatus("Generating alt text...");
      setGenerationProgress(35);
      await generateAltText();

      // 5. Generate excerpt
      setGenerationStatus("Generating excerpt...");
      setGenerationProgress(50);
      await handleAIGenerate('excerpt');

      // 6. Generate full post content using the existing generateFullPost function
      setGenerationStatus("Generating full post content...");
      setGenerationProgress(65);
      if (generateFullPostRef) {
        await generateFullPostRef();
      }

      // 7. Generate SEO content
      setGenerationStatus("Generating SEO content...");
      setGenerationProgress(80);
      await handleAIGenerate('seo-title');
      await handleAIGenerate('seo-description');
      await handleAIGenerate('seo-keywords');

      // 8. Update queue status
      setGenerationStatus("Updating queue status...");
      setGenerationProgress(90);
      const { error: updateError } = await supabase
        .from("blog_post_queue")
        .update({ status: "generated" })
        .eq("id", queuedPost.id);

      if (updateError) throw updateError;

      setGenerationProgress(100);
      setGenerationStatus("Generation complete!");
      toast({
        title: "Success",
        description: "All content generated successfully! Review and publish when ready.",
      });
    } catch (error: any) {
      console.error("Error in generateAll:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate content",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={generateAll}
        disabled={isGeneratingAll}
        className="w-[200px]"
      >
        {isGeneratingAll ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Generate All From Queue
          </>
        )}
      </Button>

      {isGeneratingAll && (
        <div className="space-y-2">
          <Progress value={generationProgress} className="w-full" />
          <p className="text-sm text-muted-foreground">{generationStatus}</p>
        </div>
      )}
    </div>
  );
};