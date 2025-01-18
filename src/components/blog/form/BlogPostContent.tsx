import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { BlogEditor } from "../editor/BlogEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
      // Extract number of items from title (default to 8 if not found)
      const numMatch = title.toLowerCase().match(/top\s+(\d+)/i);
      const numItems = numMatch ? parseInt(numMatch[1]) : 8;

      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: { 
          title,
          numItems // Pass the number of items to generate
        }
      });

      if (error) throw error;

      if (data?.content) {
        // Clean up the content by removing ```html and ``` tags
        const cleanedContent = data.content.replace(/```html\s*|\s*```/g, '');
        
        form.setValue('content', cleanedContent, { 
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true 
        });

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