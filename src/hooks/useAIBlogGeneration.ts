import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAIBlogGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateBlogContent = async (title: string, occasion: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { title, occasion }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog content generated successfully!",
      });

      return data;
    } catch (error) {
      console.error('Error generating blog content:', error);
      toast({
        title: "Error",
        description: "Failed to generate blog content. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateBlogContent,
    isGenerating
  };
};