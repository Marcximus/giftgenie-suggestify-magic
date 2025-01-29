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
  const [isGeneratingDeepSeek, setIsGeneratingDeepSeek] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const generateFullPost = async (provider: 'openai' | 'deepseek' = 'openai') => {
    const title = form.getValues('title');
    if (!title) {
      toast({
        title: "Error",
        description: "Please provide a title first",
        variant: "destructive"
      });
      return;
    }

    if (provider === 'openai') {
      setIsGenerating(true);
    } else {
      setIsGeneratingDeepSeek(true);
    }

    let currentRetry = 0;

    while (currentRetry <= MAX_RETRIES) {
      try {
        console.log(`Generating blog post with ${provider} for title:`, title);
        const endpoint = provider === 'openai' ? 'generate-blog-post' : 'generate-with-deepseek';
        
        const { data, error } = await supabase.functions.invoke(endpoint, {
          body: { title }
        });

        if (error) {
          console.error(`Error from ${provider}:`, error);
          throw error;
        }

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
            description: `Blog post generated with ${data.affiliateLinks?.length || 0} product links using ${provider}`,
          });
          break; // Success - exit the retry loop
        } else {
          throw new Error('No content received from AI');
        }
      } catch (error: any) {
        console.error(`Error generating blog post with ${provider} (attempt ${currentRetry + 1}):`, error);
        
        // If we've exhausted retries or it's not a fetch error, throw
        if (currentRetry === MAX_RETRIES || 
            (!error.message?.includes('Failed to fetch') && !error.message?.includes('FunctionsFetchError'))) {
          toast({
            title: "Error",
            description: `Failed to generate blog post with ${provider}. Please try again later.`,
            variant: "destructive"
          });
          throw error;
        }

        // For fetch errors, retry after delay
        currentRetry++;
        if (currentRetry <= MAX_RETRIES) {
          const delayMs = RETRY_DELAY * Math.pow(2, currentRetry - 1); // Exponential backoff
          console.log(`Retrying in ${delayMs}ms...`);
          toast({
            title: "Retrying",
            description: `Connection failed. Retrying attempt ${currentRetry} of ${MAX_RETRIES}...`,
          });
          await sleep(delayMs);
        }
      }
    }

    if (provider === 'openai') {
      setIsGenerating(false);
    } else {
      setIsGeneratingDeepSeek(false);
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
                  onClick={() => generateFullPost('openai')}
                  disabled={isGenerating || isGeneratingDeepSeek}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate with OpenAI"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateFullPost('deepseek')}
                  disabled={isGenerating || isGeneratingDeepSeek}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isGeneratingDeepSeek ? "Generating..." : "Generate with DeepSeek"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIGenerate('improve-content')}
                  disabled={isGenerating || isGeneratingDeepSeek}
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