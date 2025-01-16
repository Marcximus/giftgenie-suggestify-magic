import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAltTextGeneration = (form: UseFormReturn<BlogPostFormData>) => {
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

  return {
    isGeneratingAltText,
    generateAltText
  };
};