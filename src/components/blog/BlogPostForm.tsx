import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BlogPostPreview } from "./BlogPostPreview";
import { useAIContent } from "@/hooks/useAIContent";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { BlogPostFormData, BlogPostData, convertToJson } from "./types/BlogPostTypes";
import { BlogPostImageSection } from "./form/BlogPostImageSection";
import { BlogPostFormActions } from "./form/BlogPostFormActions";
import { useAltTextGeneration } from "./form/useAltTextGeneration";
import { useSlugGeneration } from "./form/useSlugGeneration";

interface BlogPostFormProps {
  initialData?: BlogPostData;
}

const BlogPostForm = ({ initialData }: BlogPostFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateContent, getFormFieldFromType } = useAIContent();
  const { generateUniqueSlug, generateSlug } = useSlugGeneration();

  const defaultValues: BlogPostFormData = {
    title: "",
    slug: "",
    content: "",
    excerpt: null,
    author: "",
    image_url: null,
    published_at: null,
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    images: null,
    affiliate_links: null,
    image_alt_text: null,
    related_posts: null,
  };

  const form = useForm<BlogPostFormData>({
    defaultValues: initialData ? {
      ...initialData,
      affiliate_links: Array.isArray(initialData.affiliate_links) 
        ? initialData.affiliate_links 
        : null
    } : defaultValues,
  });

  const { isGeneratingAltText, generateAltText } = useAltTextGeneration(form);

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

      const dataToSubmit = {
        ...data,
        affiliate_links: convertToJson(data.affiliate_links),
        updated_at: currentTime,
        published_at: publishedAt,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("blog_posts")
          .update(dataToSubmit)
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
            ...dataToSubmit,
            created_at: currentTime,
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

      <TabsContent value="edit">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="space-y-6 text-left">
            <BlogPostBasicInfo 
              form={form} 
              generateSlug={generateSlug}
              initialData={initialData}
            />

            <BlogPostImageSection
              form={form}
              isGeneratingAltText={isGeneratingAltText}
              generateAltText={generateAltText}
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

            <BlogPostFormActions
              isSubmitting={isSubmitting}
              onSubmit={(isDraft) => form.handleSubmit((data) => onSubmit(data, isDraft))()}
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