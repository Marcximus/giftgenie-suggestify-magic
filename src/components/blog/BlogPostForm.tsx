import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BlogImageUpload } from "./BlogImageUpload";
import { BlogPostPreview } from "./BlogPostPreview";
import { useAIContent } from "@/hooks/useAIContent";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { BlogPostFormData, BlogPostData } from "./types/BlogPostTypes";
import { Progress } from "@/components/ui/progress";
import { Wand2 } from "lucide-react";

interface BlogPostFormProps {
  initialData?: BlogPostData;
}

const BlogPostForm = ({ initialData }: BlogPostFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("edit");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateContent, getFormFieldFromType } = useAIContent();

  const form = useForm<BlogPostFormData>({
    defaultValues: initialData || {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      author: "",
      image_url: "",
      published_at: null,
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      images: [],
      affiliate_links: [],
      image_alt_text: "",
      related_posts: [],
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const fetchNextQueuedTitle = async () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    const { data: queuedPost, error } = await supabase
      .from("blog_post_queue")
      .select("*")
      .eq('status', 'pending')
      .or(`scheduled_date.gt.${currentDate},and(scheduled_date.eq.${currentDate},scheduled_time.gt.${currentTime})`)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching queued title:', error);
      throw error;
    }

    return queuedPost;
  };

  const generateAll = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    try {
      // Step 1: Fetch title and set initial values (10%)
      setGenerationStep("Fetching next queued title...");
      const queuedPost = await fetchNextQueuedTitle();
      if (!queuedPost) {
        throw new Error("No queued posts found");
      }
      
      form.setValue('title', queuedPost.title);
      form.setValue('slug', generateSlug(queuedPost.title));
      form.setValue('author', "Get The Gift Team");
      setGenerationProgress(10);

      // Step 2: Generate Featured Image (30%)
      setGenerationStep("Generating featured image...");
      await form.trigger('title');
      const imageButton = document.querySelector('button:has(.Wand2)') as HTMLButtonElement;
      if (imageButton) {
        await imageButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for image generation
      }
      setGenerationProgress(30);

      // Step 3: Generate Alt Text (40%)
      setGenerationStep("Generating alt text...");
      const currentTitle = form.getValues('title');
      const response = await fetch('/api/generate-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: currentTitle })
      });
      const altText = await response.json();
      form.setValue('image_alt_text', altText);
      setGenerationProgress(40);

      // Step 4: Generate Excerpt (50%)
      setGenerationStep("Generating excerpt...");
      await handleAIGenerate('excerpt');
      setGenerationProgress(50);

      // Step 5: Generate Full Post (70%)
      setGenerationStep("Generating full post content...");
      await handleAIGenerate('improve-content');
      setGenerationProgress(70);

      // Step 6: Generate SEO Settings (90%)
      setGenerationStep("Generating SEO settings...");
      await handleAIGenerate('seo-title');
      await handleAIGenerate('seo-description');
      await handleAIGenerate('seo-keywords');
      setGenerationProgress(90);

      // Step 7: Final checks (100%)
      setGenerationStep("Finalizing...");
      setGenerationProgress(100);

      toast({
        title: "Success",
        description: "Blog post generated successfully! Ready to publish.",
      });
    } catch (error: any) {
      console.error('Error in generate all:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate blog post",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    const { data: existingPost, error } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("slug", baseSlug)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking slug uniqueness:", error);
      toast({
        title: "Error",
        description: "Failed to verify slug uniqueness",
        variant: "destructive",
      });
      throw error;
    }

    if (!existingPost) {
      return baseSlug;
    }

    const timestamp = new Date().getTime();
    return `${baseSlug}-${timestamp}`;
  };

  const onSubmit = async (data: BlogPostFormData, isDraft: boolean = false) => {
    setIsSubmitting(true);
    try {
      const currentTime = new Date().toISOString();
      const publishedAt = isDraft ? null : currentTime;
      
      const uniqueSlug = await generateUniqueSlug(data.slug);
      if (uniqueSlug !== data.slug) {
        data.slug = uniqueSlug;
        toast({
          title: "Notice",
          description: "A similar slug already existed. Generated a unique one.",
        });
      }

      if (initialData?.id) {
        const { error } = await supabase
          .from("blog_posts")
          .update({
            ...data,
            updated_at: currentTime,
            published_at: publishedAt,
          })
          .eq("id", initialData.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: isDraft ? "Draft saved successfully" : "Blog post updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert([{
            ...data,
            created_at: currentTime,
            updated_at: currentTime,
            published_at: publishedAt,
          }]);

        if (error) throw error;
        toast({
          title: "Success",
          description: isDraft ? "Draft saved successfully" : "Blog post created successfully",
        });
      }
      navigate("/blog/admin");
    } catch (error: any) {
      console.error("Error saving blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save blog post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIGenerate = async (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => {
    const currentTitle = form.getValues('title');
    const currentContent = form.getValues('content');
    
    if (!currentTitle && !currentContent) {
      toast({
        title: "Error",
        description: "Please provide some content or a title first.",
        variant: "destructive"
      });
      return;
    }

    const generatedContent = await generateContent(
      type,
      currentContent,
      currentTitle
    );

    if (generatedContent) {
      const formField = getFormFieldFromType(type);
      form.setValue(formField, generatedContent, { shouldDirty: true });
      toast({
        title: "Success",
        description: "Content generated successfully!",
      });
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="edit">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="space-y-6 text-left">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create New Blog Post</h2>
              <Button
                type="button"
                onClick={generateAll}
                disabled={isGenerating}
                className="bg-primary"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate All From Queue
              </Button>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{generationStep}</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
              </div>
            )}

            <BlogPostBasicInfo 
              form={form} 
              generateSlug={generateSlug}
              initialData={initialData}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image</FormLabel>
                  <BlogImageUpload 
                    value={field.value || ''} 
                    setValue={form.setValue}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <BlogPostContent 
              form={form}
              handleAIGenerate={handleAIGenerate}
            />

            <Separator />

            <BlogPostSEO 
              form={form}
              handleAIGenerate={handleAIGenerate}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting || isGenerating}>
                {isSubmitting ? "Saving..." : initialData ? "Update Post" : "Publish Post"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isGenerating}
                onClick={() => onSubmit(form.getValues(), true)}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/blog/admin")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="preview" className="text-left">
        <BlogPostPreview data={form.watch()} />
      </TabsContent>
    </Tabs>
  );
};

export default BlogPostForm;