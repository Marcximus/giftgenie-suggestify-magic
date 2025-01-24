import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { BlogEditor } from "../editor/BlogEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface BlogPostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author: string;
  image_url: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  images: any[] | null;
  affiliate_links: any[] | null;
  image_alt_text: string | null;
  related_posts: any[] | null;
  content_format_version: string | null;
  generation_attempts: number | null;
  last_generation_error: string | null;
  processing_status: {
    reviews_added: number;
    amazon_lookups: number;
    product_sections: number;
    successful_replacements: number;
  } | null;
  product_reviews: any[] | null;
  product_search_failures: any[] | null;
  word_count: number | null;
  reading_time: number | null;
  main_entity: string | null;
  breadcrumb_list: any[] | null;
  category_id: string | null;
}

interface BlogPostContentProps {
  form: UseFormReturn<BlogPostFormData>;
  handleAIGenerate: (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => Promise<void>;
}

export const BlogPostContent = ({ form, handleAIGenerate }: BlogPostContentProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFullPost = async () => {
    const title = form.getValues('title');
    if (!title) {
      toast({
        title: "Error",
        description: "Please provide a title first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Generating blog post for title:', title);
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: { title }
      });

      if (error) throw error;

      console.log('Received generated content:', data);

      if (data?.content) {
        // Update the form's content field with processed content
        form.setValue('content', data.content, { 
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true 
        });

        // If there are affiliate links, update those too
        if (data.affiliateLinks) {
          form.setValue('affiliate_links', data.affiliateLinks, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true
          });
        }
        
        toast({
          title: "Success",
          description: `Blog post generated with ${data.affiliateLinks?.length || 0} product links`,
        });
      } else {
        throw new Error('No content received from AI');
      }
    } catch (error) {
      console.error('Error generating blog post:', error);
      toast({
        title: "Error",
        description: "Failed to generate blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <FormField
        control={form.control}
        name="excerpt"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              Excerpt
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAIGenerate('excerpt')}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Excerpt
              </Button>
            </FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value || ''} />
            </FormControl>
            <FormDescription>
              A short summary that appears in blog listings
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              Content
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateFullPost}
                  disabled={isGenerating}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate Full Post"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIGenerate('improve-content')}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Improve Content
                </Button>
              </div>
            </FormLabel>
            <FormControl>
              <BlogEditor 
                value={field.value} 
                onChange={(value) => {
                  console.log('Editor content updated:', value);
                  field.onChange(value);
                  form.trigger('content');
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};