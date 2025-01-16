import { useState } from "react";
import { useForm } from "react-hook-form";
import { BlogPostFormData, EMPTY_FORM_DATA } from "./types/BlogPostTypes";
import { Form } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostImageSection } from "./form/BlogPostImageSection";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { BlogPostFormActions } from "./form/BlogPostFormActions";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface Props {
  initialData?: BlogPostFormData;
}

export function BlogPostForm({ initialData = EMPTY_FORM_DATA }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAltText, setIsGeneratingAltText] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    reset
  } = useForm<BlogPostFormData>({
    defaultValues: initialData
  });

  const onSubmit = async (data: BlogPostFormData, isDraft: boolean = false) => {
    setIsSubmitting(true);
    try {
      const currentTime = new Date().toISOString();
      const submitData = {
        ...data,
        updated_at: currentTime,
        published_at: isDraft ? null : currentTime
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("blog_posts")
          .update(submitData)
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
            ...submitData,
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

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const generateAltText = async () => {
    setIsGeneratingAltText(true);
    try {
      const title = getValues('title');
      const imageUrl = getValues('image_url');
      
      if (!imageUrl) {
        toast({
          title: "Error",
          description: "Please upload an image first",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-alt-text', {
        body: { title, imageUrl }
      });

      if (error) throw error;

      if (data?.altText) {
        setValue('image_alt_text', data.altText, {
          shouldValidate: true,
          shouldDirty: true
        });
        toast({
          title: "Success",
          description: "Alt text generated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error generating alt text:', error);
      toast({
        title: "Error",
        description: "Failed to generate alt text",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAltText(false);
    }
  };

  const handleAIGenerate = async (type: "excerpt" | "seo-title" | "seo-description" | "seo-keywords" | "improve-content") => {
    try {
      const title = getValues('title');
      const content = getValues('content');

      if (!title && !content) {
        toast({
          title: "Error",
          description: "Please provide some content or a title first",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { type, title, content }
      });

      if (error) throw error;

      if (data?.content) {
        const fieldMap: Record<typeof type, keyof BlogPostFormData> = {
          'excerpt': 'excerpt',
          'seo-title': 'meta_title',
          'seo-description': 'meta_description',
          'seo-keywords': 'meta_keywords',
          'improve-content': 'content'
        };

        setValue(fieldMap[type], data.content, {
          shouldValidate: true,
          shouldDirty: true
        });

        toast({
          title: "Success",
          description: "Content generated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...{ control }}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <BlogPostBasicInfo
          control={control}
          generateSlug={generateSlug}
        />

        <BlogPostImageSection
          control={control}
          isGeneratingAltText={isGeneratingAltText}
          generateAltText={generateAltText}
        />

        <BlogPostContent
          control={control}
          handleAIGenerate={handleAIGenerate}
        />

        <BlogPostSEO
          control={control}
          handleAIGenerate={handleAIGenerate}
        />

        <BlogPostFormActions
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  );
}