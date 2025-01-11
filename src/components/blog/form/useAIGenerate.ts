import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export const useAIGenerate = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleAIGenerate = async (
    type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords',
    title: string,
    content?: string
  ): Promise<string | null> => {
    setIsGenerating(true);
    try {
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

      if (data?.text) {
        toast({
          title: "Success",
          description: `Generated ${type} successfully`,
        });
        return data.text;
      }
      return null;
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to generate ${type}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { handleAIGenerate, isGenerating };
};