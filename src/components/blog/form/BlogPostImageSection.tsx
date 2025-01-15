import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { BlogImageUpload } from "../BlogImageUpload";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";

interface BlogPostImageSectionProps {
  form: UseFormReturn<BlogPostFormData>;
  isGeneratingAltText: boolean;
  generateAltText: () => Promise<void>;
}

export const BlogPostImageSection = ({ 
  form, 
  isGeneratingAltText, 
  generateAltText 
}: BlogPostImageSectionProps) => {
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