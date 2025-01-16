import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RefreshCw, BookOpen, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ScheduledPostsTab } from "@/components/blog/admin/ScheduledPostsTab";
import { BulkTitleUploader } from "@/components/blog/admin/BulkTitleUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BlogAdmin = () => {
  const { toast } = useToast();
  const { data: posts, isLoading, refetch } = useQuery({
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

  const { data: queueStats } = useQuery({
    queryKey: ["queue-stats"],
    queryFn: async () => {
      const { data: queueData, error } = await supabase
        .from("blog_post_queue")
        .select("status");
      
      if (error) throw error;

      const stats = {
        total: queueData.length,
        pending: queueData.filter(post => post.status === 'pending').length,
        generating: queueData.filter(post => post.status === 'generating').length,
        error: queueData.filter(post => post.status === 'error').length
      };

      return stats;
    },
  });

  const handleDelete = async (postId: string) => {
    try {
      const { error: imagesError } = await supabase
        .from("blog_post_images")
        .delete()
        .eq("blog_post_id", postId);

      if (imagesError) throw imagesError;

      const { error: postError } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postId);

      if (postError) throw postError;

      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
      
      refetch();
    } catch (error: any) {
      console.error("Error deleting blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog post",
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
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
        <h1 className="text-3xl font-bold">Blog Posts</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {queueStats?.pending || 0} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.generating || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Posts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.error || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Published Posts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
          <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Title</TableHead>
                  <TableHead className="text-left">Author</TableHead>
                  <TableHead className="text-left">Status</TableHead>
                  <TableHead className="text-left">Published</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts?.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="text-left font-medium">{post.title}</TableCell>
                    <TableCell className="text-left">{post.author}</TableCell>
                    <TableCell className="text-left">
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
                    <TableCell className="text-left">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-left">
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

        <TabsContent value="scheduled">
          <ScheduledPostsTab />
        </TabsContent>

        <TabsContent value="upload">
          <BulkTitleUploader />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogAdmin;