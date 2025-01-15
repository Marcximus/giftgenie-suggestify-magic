import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormProvider } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BlogPostPreview } from "./BlogPostPreview";
import { useAIContent } from "@/hooks/useAIContent";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { BlogPostFormData, EMPTY_FORM_DATA } from "./types/BlogPostTypes";
import { BlogPostImageSection } from "./form/BlogPostImageSection";
import { BlogPostFormActions } from "./form/BlogPostFormActions";
import { useAltTextGeneration } from "./form/useAltTextGeneration";
import { useSlugGeneration } from "./form/useSlugGeneration";
import { useForm } from "react-hook-form";

interface BlogPostFormProps {
  initialData?: BlogPostFormData;
}

const BlogPostForm = ({ initialData = EMPTY_FORM_DATA }: BlogPostFormProps) => {
  const [activeTab, setActiveTab] = useState("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateContent, getFormFieldFromType } = useAIContent();
  const { generateUniqueSlug, generateSlug } = useSlugGeneration();
  
  const methods = useForm<BlogPostFormData>({
    defaultValues: initialData
  });

  const { isGeneratingAltText, generateAltText } = useAltTextGeneration(methods);

  const handleAIGenerate = async (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => {
    const currentTitle = methods.getValues('title');
    const currentContent = methods.getValues('content');
    
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
      methods.setValue(formField, generatedContent, {
        shouldValidate: true,
        shouldDirty: true
      });
      toast({
        title: "Success",
        description: "Content generated successfully!",
      });
    }
  };

  const onSubmit = async (isDraft: boolean = false) => {
    setIsSubmitting(true);
    try {
      const currentTime = new Date().toISOString();
      const publishedAt = isDraft ? null : currentTime;
      
      const formData = methods.getValues();
      const uniqueSlug = await generateUniqueSlug(formData.slug);
      
      if (uniqueSlug !== formData.slug) {
        methods.setValue('slug', uniqueSlug, {
          shouldValidate: true,
          shouldDirty: true
        });
        toast({
          title: "Notice",
          description: "A similar slug already existed. Generated a unique one.",
        });
      }

      const dataToSubmit = {
        ...formData,
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
    <FormProvider {...methods}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Form>
            <form className="space-y-6 text-left">
              <BlogPostBasicInfo 
                generateSlug={generateSlug}
              />

              <BlogPostImageSection
                isGeneratingAltText={isGeneratingAltText}
                generateAltText={generateAltText}
              />

              <BlogPostContent 
                handleAIGenerate={handleAIGenerate}
              />

              <Separator />

              <BlogPostSEO 
                handleAIGenerate={handleAIGenerate}
              />

              <BlogPostFormActions
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
              />
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview" className="text-left">
          <BlogPostPreview data={methods.getValues()} />
        </TabsContent>
      </Tabs>
    </FormProvider>
  );
};

export default BlogPostForm;