import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { useEffect } from "react";

interface BlogPostBasicInfoProps {
  form: UseFormReturn<BlogPostFormData>;
  generateSlug: (title: string) => string;
  initialData?: BlogPostFormData;
  defaultAuthor: string;
}

export const BlogPostBasicInfo = ({ form, generateSlug, initialData, defaultAuthor }: BlogPostBasicInfoProps) => {
  useEffect(() => {
    const currentTitle = form.getValues("title");
    if (currentTitle && !initialData && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(currentTitle));
    }
  }, [form.getValues("title")]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    if (!initialData) {
                      form.setValue("slug", generateSlug(e.target.value));
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                The URL-friendly version of the title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="author"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Author</FormLabel>
            <FormControl>
              <Input {...field} value={defaultAuthor} readOnly className="bg-gray-100" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};