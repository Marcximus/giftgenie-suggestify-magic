import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, Wand2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { UseFormSetValue, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";

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

interface BlogImageUploadProps {
  value: string;
  setValue: UseFormSetValue<BlogPostFormData>;
}

export const BlogImageUpload = ({ value, setValue }: BlogImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const form = useFormContext<BlogPostFormData>();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to upload images');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      setValue('image_url', publicUrl);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    try {
      const title = form.getValues('title');
      if (!title) {
        throw new Error('Please provide a title first');
      }

      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: { title }  // Remove the hardcoded prompt, let the Edge Function handle it
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setValue('image_url', data.imageUrl);
        toast({
          title: "Success",
          description: "Image generated successfully",
        });
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input value={value} readOnly />
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isUploading || isGenerating}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
        >
          {isUploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Image
            </>
          )}
        </label>
        <Button
          type="button"
          variant="secondary"
          onClick={handleGenerateImage}
          disabled={isGenerating || isUploading}
        >
          {isGenerating ? (
            "Generating..."
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate with AI
            </>
          )}
        </Button>
        {value && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="w-4 h-4" />
            Image {isGenerating ? 'generating' : 'uploaded'}
          </div>
        )}
      </div>
    </div>
  );
};
