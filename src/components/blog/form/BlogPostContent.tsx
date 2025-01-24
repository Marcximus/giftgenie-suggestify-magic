import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { BlogEditor } from "../editor/BlogEditor";
import { BlogImageUpload } from "../BlogImageUpload";

interface BlogPostContentProps {
  form: UseFormReturn<BlogPostFormData>;
}

export const BlogPostContent = ({ form }: BlogPostContentProps) => {
  return (
    <div className="space-y-6">
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
            <FormLabel>Image Alt Text</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                value={field.value || ''}
                placeholder="Descriptive text for the featured image"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <BlogEditor 
                value={field.value} 
                onChange={(value) => {
                  field.onChange(value);
                  form.trigger('content');
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};