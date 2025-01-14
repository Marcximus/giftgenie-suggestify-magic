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

interface BlogPostFormProps {
  initialData?: BlogPostData;
}

const BlogPostForm = ({ initialData }: BlogPostFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const onSubmit = async (data: BlogPostFormData, isDraft: boolean = false) => {
    setIsSubmitting(true);
    try {
      const currentTime = new Date().toISOString();
      const publishedAt = isDraft ? null : currentTime;
      
      if (initialData?.id) {
        // Update existing post
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
        // Create new post
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
                  <FormLabel>Image Alt Text</FormLabel>
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
