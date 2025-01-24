import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BlogImageUpload } from "./BlogImageUpload";
import { BlogPostPreview } from "./BlogPostPreview";
import { useAIContent } from "@/hooks/useAIContent";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { BlogPostActions } from "./form/BlogPostActions";
import { BlogPostFormData, BlogPostFormProps } from "./types/BlogPostTypes";
import { Json } from "@/integrations/supabase/types";

const DEFAULT_AUTHOR = "Get The Gift Team";
const DEFAULT_PROCESSING_STATUS: Json = {
  reviews_added: 0,
  amazon_lookups: 0,
  product_sections: 0,
  successful_replacements: 0
};

const BlogPostForm = ({ initialData, initialTitle }: BlogPostFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<BlogPostFormData>({
    defaultValues: {
      ...(initialData || {
        title: "",
        slug: "",
        content: "",
        excerpt: null,
        author: DEFAULT_AUTHOR,
        image_url: null,
        published_at: null,
        meta_title: null,
        meta_description: null,
        meta_keywords: null,
        images: [],
        affiliate_links: [],
        image_alt_text: null,
        related_posts: [],
        content_format_version: "v1",
        generation_attempts: 0,
        last_generation_error: null,
        processing_status: DEFAULT_PROCESSING_STATUS,
        product_reviews: [],
        product_search_failures: [],
        word_count: null,
        reading_time: null,
        main_entity: null,
        breadcrumb_list: [],
        category_id: null,
        aggregateRating: null,
        operatingSystem: null
      }),
      title: initialTitle || "",
      author: DEFAULT_AUTHOR,
    },
  });

  // Update form when initialTitle changes
  useEffect(() => {
    if (initialTitle) {
      form.setValue('title', initialTitle);
      form.setValue('slug', generateSlug(initialTitle));
    }
  }, [initialTitle, form]);

  // Watch the title field to auto-update slug
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'title' && !initialData) {
        form.setValue('slug', generateSlug(value.title || ''));
      }
    });
    return () => subscription.unsubscribe();
  }, [form, initialData]);

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

      const formattedData = {
        ...data,
        processing_status: data.processing_status as Json,
        images: data.images as Json,
        affiliate_links: data.affiliate_links as Json,
        related_posts: data.related_posts as Json,
        product_reviews: data.product_reviews as Json,
        product_search_failures: data.product_search_failures as Json,
        breadcrumb_list: data.breadcrumb_list as Json,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("blog_posts")
          .update({
            ...formattedData,
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
            ...formattedData,
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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

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
            />

            <BlogPostSEO 
              form={form}
            />

            <BlogPostActions 
              form={form}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
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