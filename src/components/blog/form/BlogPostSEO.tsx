import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";

interface BlogPostSEOProps {
  form: UseFormReturn<BlogPostFormData>;
  handleAIGenerate: (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => Promise<void>;
}

export const BlogPostSEO = ({ form, handleAIGenerate }: BlogPostSEOProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">SEO Settings</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await handleAIGenerate('seo-title');
            await handleAIGenerate('seo-description');
            await handleAIGenerate('seo-keywords');
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
                  onClick={() => handleAIGenerate('seo-title')}
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
                  onClick={() => handleAIGenerate('seo-description')}
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
                  onClick={() => handleAIGenerate('seo-keywords')}
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