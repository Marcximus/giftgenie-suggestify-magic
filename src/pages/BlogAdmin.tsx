import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublishedPostsTab } from "@/components/blog/admin/PublishedPostsTab";
import { ScheduledPostsTab } from "@/components/blog/admin/ScheduledPostsTab";
import { StatsOverview } from "@/components/blog/admin/StatsOverview";
import { BulkTitleUploader } from "@/components/blog/admin/BulkTitleUploader";

const BlogAdmin = () => {
  return (
    <>
      <Helmet>
        <title>Blog Admin - Get The Gift</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://getthegift.ai/blog/admin" />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Blog Administration</h1>
        <StatsOverview />
        <Tabs defaultValue="published" className="mt-8">
          <TabsList>
            <TabsTrigger value="published">Published Posts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="published">
            <PublishedPostsTab />
          </TabsContent>
          <TabsContent value="scheduled">
            <ScheduledPostsTab />
          </TabsContent>
          <TabsContent value="bulk">
            <BulkTitleUploader />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default BlogAdmin;