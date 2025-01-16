import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BlogImageUpload } from "./BlogImageUpload";
import { BlogPostPreview } from "./BlogPostPreview";
import { useAIContent } from "@/hooks/useAIContent";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { BlogPostGeneration } from "./form/BlogPostGeneration";
import { BlogPostActions } from "./form/BlogPostActions";
import { BlogPostFormData, BlogPostData } from "./types/BlogPostTypes";

interface BlogPostFormProps {
  initialData?: BlogPostData;
}

const BlogPostForm = ({ initialData }: BlogPostFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState("edit");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateContent } = useAIContent();

  const form = useForm<BlogPostFormData>({
    defaultValues: initialData || {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      author: "Get The Gift Team",
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
    const { data, error } = await supabase
      .from("blog_post_queue")
      .select("*")
      .eq("status", "pending")
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching next queued title:", error);
      toast({
        title: "Error",
        description: "Failed to fetch next queued title",
        variant: "destructive",
      });
      return null;
    }

    return data;
  };

  const generateAll = async () => {
    setIsGeneratingAll(true);
    try {
      // Fetch next queued title
      setGenerationStatus("Fetching next queued title...");
      const queuedPost = await fetchNextQueuedTitle();
      if (!queuedPost) {
        toast({
          title: "Error",
          description: "No pending posts in queue",
          variant: "destructive",
        });
        return;
      }

      // Set the title and author
      form.setValue("title", queuedPost.title);
      form.setValue("author", "Get The Gift Team");
      form.setValue("slug", generateSlug(queuedPost.title));
      setGenerationStatus("Title and author set...");

      // Generate featured image
      setGenerationStatus("Generating featured image...");
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-blog-image', {
        body: { 
          title: queuedPost.title,
          prompt: "Create an entertaining, interesting, and funny image for a blog post" 
        }
      });

      if (imageError) throw imageError;
      if (imageData?.imageUrl) {
        form.setValue('image_url', imageData.imageUrl);
      }

      // Generate alt text
      setGenerationStatus("Generating alt text...");
      const { data: altData, error: altError } = await supabase.functions.invoke('generate-blog-image', {
        body: { 
          title: queuedPost.title,
          prompt: "Generate a descriptive alt text for this blog post's featured image" 
        }
      });

      if (altError) throw altError;
      if (altData?.altText) {
        form.setValue('image_alt_text', altData.altText);
      }

      // Generate content
      setGenerationStatus("Generating main content...");
      const content = await generateContent('improve-content', "", queuedPost.title);
      if (content) {
        form.setValue('content', content);
      }

      // Generate SEO content
      setGenerationStatus("Generating SEO content...");
      const seoTitle = await generateContent('seo-title', content || "", queuedPost.title);
      const seoDesc = await generateContent('seo-description', content || "", queuedPost.title);
      const seoKeywords = await generateContent('seo-keywords', content || "", queuedPost.title);
      const excerpt = await generateContent('excerpt', content || "", queuedPost.title);

      if (seoTitle) form.setValue('meta_title', seoTitle);
      if (seoDesc) form.setValue('meta_description', seoDesc);
      if (seoKeywords) form.setValue('meta_keywords', seoKeywords);
      if (excerpt) form.setValue('excerpt', excerpt);

      setGenerationStatus("Generation complete! Ready to publish.");
      toast({
        title: "Success",
        description: "Blog post generated successfully!",
      });
    } catch (error: any) {
      console.error("Error generating blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate blog post",
        variant: "destructive",
      });
      setGenerationStatus("Generation failed. Please try again.");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <BlogPostGeneration
        isGeneratingAll={isGeneratingAll}
        generationStatus={generationStatus}
        onGenerateAll={generateAll}
      />

      <TabsContent value="edit">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="space-y-6 text-left">
            <BlogPostBasicInfo 
              form={form} 
              generateSlug={generateSlug}
              initialData={initialData}
            />

            <BlogPostContent 
              form={form}
              handleAIGenerate={async (type) => {
                const content = await generateContent(
                  type,
                  form.getValues('content'),
                  form.getValues('title')
                );
                if (content) {
                  const formField = type === 'excerpt' ? 'excerpt' : 
                                  type === 'seo-title' ? 'meta_title' :
                                  type === 'seo-description' ? 'meta_description' :
                                  type === 'seo-keywords' ? 'meta_keywords' : 'content';
                  form.setValue(formField, content, { shouldDirty: true });
                  toast({
                    title: "Success",
                    description: "Content generated successfully!",
                  });
                }
              }}
            />

            <Separator />

            <BlogPostSEO 
              form={form}
              handleAIGenerate={async (type) => {
                const content = await generateContent(
                  type,
                  form.getValues('content'),
                  form.getValues('title')
                );
                if (content) {
                  const formField = type === 'excerpt' ? 'excerpt' : 
                                  type === 'seo-title' ? 'meta_title' :
                                  type === 'seo-description' ? 'meta_description' :
                                  type === 'seo-keywords' ? 'meta_keywords' : 'content';
                  form.setValue(formField, content, { shouldDirty: true });
                  toast({
                    title: "Success",
                    description: "Content generated successfully!",
                  });
                }
              }}
            />

            <BlogPostActions
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              onCancel={() => navigate("/blog/admin")}
              getValues={form.getValues}
              initialData={initialData}
            />
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