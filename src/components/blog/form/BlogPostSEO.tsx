import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";

interface BlogPostSEOProps {
  form: UseFormReturn<BlogPostFormData>;
  handleAIGenerate: (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords', title: string, content?: string) => Promise<string | null>;
}

export const BlogPostSEO = ({ form, handleAIGenerate }: BlogPostSEOProps) => {
  const generateSEOField = async (type: 'seo-title' | 'seo-description' | 'seo-keywords') => {
    const title = form.getValues('title');
    const content = form.getValues('content');
    const generatedText = await handleAIGenerate(type, title, content);
    if (generatedText) {
      switch (type) {
        case 'seo-title':
          form.setValue('meta_title', generatedText);
          break;
        case 'seo-description':
          form.setValue('meta_description', generatedText);
          break;
        case 'seo-keywords':
          form.setValue('meta_keywords', generatedText);
          break;
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">SEO Settings</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await generateSEOField('seo-title');
            await generateSEOField('seo-description');
            await generateSEOField('seo-keywords');
          }}
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Generate All SEO
        </Button>
      </div>
      
      <div className="grid gap-4">
        <FormField
          control={form.control}
          name="meta_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                Meta Title
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateSEOField('seo-title')}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                Appears in search engine results (50-60 characters recommended)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meta_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                Meta Description
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateSEOField('seo-description')}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                Appears in search engine results (150-160 characters recommended)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="meta_keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                Meta Keywords
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateSEOField('seo-keywords')}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                Comma-separated keywords for SEO
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};