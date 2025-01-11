import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { BlogEditor } from "../editor/BlogEditor";

interface BlogPostContentProps {
  form: UseFormReturn<BlogPostFormData>;
}

export const BlogPostContent = ({ form }: BlogPostContentProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="excerpt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Excerpt</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value || ''} />
            </FormControl>
            <FormDescription>
              A short summary that appears in blog listings
            </FormDescription>
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
                  console.log('Editor content updated:', value);
                  field.onChange(value);
                  form.trigger('content');
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};