import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
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
import { Input } from "@/components/ui/input";
import { Wand2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BlogPostFormProps {
  initialData?: BlogPostData;
}

const BlogPostForm = ({ initialData }: BlogPostFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAltText, setIsGeneratingAltText] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
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

  const fetchNextQueuedTitle = async () => {
    try {
      const { data: queuedPosts, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;
      
      if (queuedPosts) {
        form.setValue('title', queuedPosts.title);
        form.setValue('author', "Get The Gift Team");
        return queuedPosts.title;
      }
      
      throw new Error("No queued posts found");
    } catch (error: any) {
      console.error('Error fetching queued title:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch next queued title",
        variant: "destructive",
      });
      return null;
    }
  };

  const generateAll = async () => {
    setIsGeneratingAll(true);
    setGenerationProgress(0);
    setGenerationStatus("Starting generation process...");
    
    try {
      // 1. Fetch next queued title
      setGenerationStatus("Fetching next queued title...");
      const title = await fetchNextQueuedTitle();
      if (!title) {
        throw new Error("No queued title available");
      }
      setGenerationProgress(10);

      // 2. Generate Featured Image
      setGenerationStatus("Generating featured image...");
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-blog-image', {
        body: { title }
      });
      if (imageError) throw imageError;
      if (imageData?.imageUrl) {
        form.setValue('image_url', imageData.imageUrl);
      }
      setGenerationProgress(30);

      // 3. Generate Alt Text
      setGenerationStatus("Generating alt text...");
      const { data: altData, error: altError } = await supabase.functions.invoke('generate-blog-image', {
        body: { 
          title,
          prompt: "Generate a descriptive alt text for this blog post's featured image" 
        }
      });
      if (altError) throw altError;
      if (altData?.altText) {
        form.setValue('image_alt_text', altData.altText);
      }
      setGenerationProgress(40);

      // 4. Generate Excerpt
      setGenerationStatus("Generating excerpt...");
      const excerpt = await generateContent('excerpt', "", title);
      if (excerpt) {
        form.setValue('excerpt', excerpt);
      }
      setGenerationProgress(50);

      // 5. Generate Full Post
      setGenerationStatus("Generating blog post content...");
      const { data: postData, error: postError } = await supabase.functions.invoke('generate-blog-post', {
        body: { title }
      });
      if (postError) throw postError;
      if (postData?.content) {
        form.setValue('content', postData.content);
        if (postData.affiliateLinks) {
          form.setValue('affiliate_links', postData.affiliateLinks);
        }
      }
      setGenerationProgress(80);

      // 6. Generate SEO Settings
      setGenerationStatus("Generating SEO settings...");
      await handleAIGenerate('seo-title');
      await handleAIGenerate('seo-description');
      await handleAIGenerate('seo-keywords');
      setGenerationProgress(100);
      
      setGenerationStatus("Generation complete! Ready to publish.");
      toast({
        title: "Success",
        description: "All content generated successfully!",
      });
    } catch (error: any) {
      console.error('Error in generate all:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate all content",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const generateAltText = async () => {
    const title = form.getValues('title');
    if (!title) {
      toast({
        title: "Error",
        description: "Please provide a title first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAltText(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: { 
          title,
          prompt: "Generate a descriptive alt text for this blog post's featured image" 
        }
      });

      if (error) throw error;

      if (data?.altText) {
        form.setValue('image_alt_text', data.altText, { 
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true 
        });
        toast({
          title: "Success",
          description: "Alt text generated successfully",
        });
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate alt text",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAltText(false);
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
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
            <div className="flex items-center justify-between mb-6">
              <Button
                type="button"
                onClick={generateAll}
                disabled={isGeneratingAll}
                className="w-full max-w-xs"
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
              {(isGeneratingAll || generationProgress > 0) && (
                <div className="flex-1 ml-4">
                  <Progress value={generationProgress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">{generationStatus}</p>
                </div>
              )}
            </div>

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

            <FormField
              control={form.control}
              name="image_alt_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    Image Alt Text
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateAltText}
                      disabled={isGeneratingAltText}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {isGeneratingAltText ? "Generating..." : "Generate Alt Text"}
                    </Button>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Descriptive text for the featured image"
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the image content for better SEO and accessibility
                  </FormDescription>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : initialData ? "Update Post" : "Publish Post"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
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
