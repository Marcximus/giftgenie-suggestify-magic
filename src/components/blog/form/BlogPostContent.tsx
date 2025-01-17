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

        // Store any product search failures
        if (data.searchFailures?.length > 0) {
          form.setValue('product_search_failures', data.searchFailures, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true
          });

          // Notify user about any failed product searches
          toast({
            title: "Warning",
            description: `${data.searchFailures.length} product searches failed. Check the logs for details.`,
            variant: "warning",
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
      setIsGenerating(false);
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
