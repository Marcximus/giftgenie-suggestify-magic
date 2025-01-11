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
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { BlogPostFormData, BlogPostData } from "./types/BlogPostTypes";

interface BlogPostFormProps {
  initialData?: BlogPostData;
}

const BlogPostForm = ({ initialData }: BlogPostFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const navigate = useNavigate();
  const { toast } = useToast();

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
    },
  });

  const handleAIGenerate = async (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords') => {
    setIsGenerating(true);
    try {
      const title = form.getValues('title');
      const content = form.getValues('content');
      
      if (!title) {
        throw new Error('Please provide a title first');
      }

      const { data, error } = await supabase.functions.invoke('generate-blog-metadata', {
        body: { 
          type,
          title,
          content
        }
      });

      if (error) throw error;

      if (data) {
        switch (type) {
          case 'excerpt':
            form.setValue('excerpt', data.text);
            break;
          case 'seo-title':
            form.setValue('meta_title', data.text);
            break;
          case 'seo-description':
            form.setValue('meta_description', data.text);
            break;
          case 'seo-keywords':
            form.setValue('meta_keywords', data.text);
            break;
        }

        toast({
          title: "Success",
          description: `Generated ${type} successfully`,
        });
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to generate ${type}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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