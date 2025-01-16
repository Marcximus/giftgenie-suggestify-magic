import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { BlogImageUpload } from "../BlogImageUpload";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BlogPostImageSectionProps {
  form: UseFormReturn<BlogPostFormData>;
}

export const BlogPostImageSection = ({ form }: BlogPostImageSectionProps) => {
  const [isGeneratingAltText, setIsGeneratingAltText] = useState(false);
  const { toast } = useToast();

  const generateAltText = async () => {
    const title = form.getValues('title');
    if (!title) {
      toast({
        title: "Error",
        description: "Please provide a title first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAltText(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: { 
          title,
          prompt: "Generate a descriptive alt text for this blog post's featured image" 
        }
      });

      if (error) throw error;

      if (data?.altText) {
        form.setValue('image_alt_text', data.altText, { 
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true 
        });
        toast({
          title: "Success",
          description: "Alt text generated successfully",
        });
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate alt text",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAltText(false);
    }
  };

  return (
    <>
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
            <FormLabel className="flex items-center justify-between">
              Image Alt Text
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAltText}
                disabled={isGeneratingAltText}
                aria-label="Generate Alt Text"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {isGeneratingAltText ? "Generating..." : "Generate Alt Text"}
              </Button>
            </FormLabel>
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
    </>
  );
};