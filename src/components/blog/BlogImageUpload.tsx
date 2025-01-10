import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, Wand2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { UseFormSetValue, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { BlogPostFormData } from "./types/BlogPostTypes";

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
        body: { 
          title,
          prompt: "Create a professional featured image for a gift recommendation blog post" 
        }
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
