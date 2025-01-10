import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type ContentType = 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content';

export const useAIContent = () => {
  const { toast } = useToast();

  const generateContent = async (
    type: ContentType,
    content: string,
    title: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { type, content, title }
      });

      if (error) {
        console.error('Error generating content:', error);
        toast({
          title: "Error",
          description: "Failed to generate content. Please try again.",
          variant: "destructive"
        });
        return null;
      }

      return data.content;
    } catch (error) {
      console.error('Error in generateContent:', error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  return { generateContent };
};