import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BulkUploadDialog } from "@/components/blog/admin/BulkUploadDialog";
import { ScheduledPostsTab } from "@/components/blog/admin/ScheduledPostsTab";

const BlogAdmin = () => {
  const { toast } = useToast();

  // Query for published posts
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Tables<"blog_posts">[];
    },
  });

  // Query for queue items
  const { data: queueItems, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ["blog-post-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (postId: string) => {
    try {
      const { error: postError } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (postError) throw postError;

      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
      
      refetchPosts();
    } catch (error: any) {
      console.error("Error deleting blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog post",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQueueItem = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from("blog_post_queue")
        .delete()
        .eq("id", queueId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Queue item deleted successfully",
      });
      
      refetchQueue();
    } catch (error: any) {
      console.error("Error deleting queue item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete queue item",
        variant: "destructive",
      });
    }
  };

  const addToQueue = async () => {
    const title = window.prompt("Enter blog post title:");
    if (!title) return;

    try {
      const { error } = await supabase
        .from("blog_post_queue")
        .insert([{ title, status: "pending" }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post added to queue",
      });
      
      refetchQueue();
    } catch (error: any) {
      console.error("Error adding to queue:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add to queue",
        variant: "destructive",
      });
    }
  };

  const regenerateSitemap = async () => {
    try {
      const response = await fetch('https://ckcqttsdpxfbpkzljctl.functions.supabase.co/functions/v1/generate-sitemap');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      console.log('Sitemap regenerated:', data);
      toast({
        title: "Success",
        description: "Sitemap regenerated successfully",
      });
    } catch (error: any) {
      console.error('Error regenerating sitemap:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate sitemap",
        variant: "destructive",
      });
    }
  };

  if (postsLoading || queueLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <div className="flex gap-4">
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Management</h1>
        <div className="flex gap-4">
          <Button onClick={regenerateSitemap} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Sitemap
          </Button>
          <Link to="/blog/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Published Posts</TabsTrigger>
          <TabsTrigger value="queue">Generation Queue</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts?.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>{post.title}</TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell>
                      {post.published_at ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Draft
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link to={`/blog/edit/${post.slug}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{post.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(post.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <div className="flex justify-end mb-4 gap-4">
            <BulkUploadDialog onSuccess={refetchQueue} />
            <Button onClick={() => addToQueue()} variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Add Single Title
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueItems?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{item.retries || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {item.error_message && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => alert(item.error_message)}
                          >
                            View Error
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Queue Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.title}" from the queue?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteQueueItem(item.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledPostsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogAdmin;