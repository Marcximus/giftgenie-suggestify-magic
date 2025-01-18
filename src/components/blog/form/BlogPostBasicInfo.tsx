import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarClock } from "lucide-react";

interface BlogPostBasicInfoProps {
  form: UseFormReturn<BlogPostFormData>;
  generateSlug: (title: string) => string;
  initialData?: BlogPostFormData;
}

export const BlogPostBasicInfo = ({ form, generateSlug, initialData }: BlogPostBasicInfoProps) => {
  const { data: nextScheduledPost } = useQuery({
    queryKey: ["next-scheduled-post"],
    queryFn: async () => {
      // First, get all published post titles
      const { data: publishedPosts } = await supabase
        .from("blog_posts")
        .select("title");

      const publishedTitles = new Set(publishedPosts?.map(post => post.title));

      // Get the next scheduled post that isn't published yet
      const { data: queuedPosts } = await supabase
        .from("blog_post_queue")
        .select("*")
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(1);
      
      // Return null if no posts found or if the post is already published
      if (!queuedPosts || queuedPosts.length === 0) return null;
      const nextPost = queuedPosts[0];
      return publishedTitles.has(nextPost.title) ? null : nextPost;
    },
  });

  return (
    <div className="space-y-6">
      {nextScheduledPost && (
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertDescription>
            Next scheduled post: <span className="font-medium">{nextScheduledPost.title}</span>
            {nextScheduledPost.scheduled_date && (
              <span className="text-sm text-muted-foreground ml-2">
                (Scheduled for {new Date(nextScheduledPost.scheduled_date).toLocaleDateString()} at {nextScheduledPost.scheduled_time || 'TBD'})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

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
              <Input {...field} placeholder="Enter author name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};