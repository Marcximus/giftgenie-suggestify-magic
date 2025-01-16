import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { AutoFillBlogPost } from "../AutoFillBlogPost";
import { BlogPostBasicInfo } from "./BlogPostBasicInfo";
import { BlogPostImageSection } from "./BlogPostImageSection";
import { BlogPostContent } from "./BlogPostContent";
import { BlogPostSEO } from "./BlogPostSEO";

interface BlogPostFormContentProps {
  form: UseFormReturn<BlogPostFormData>;
  isSubmitting: boolean;
  onSubmit: (data: BlogPostFormData, isDraft?: boolean) => Promise<void>;
  initialData?: BlogPostFormData & { id?: string };
  handleAIGenerate: (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => Promise<void>;
}

export const BlogPostFormContent = ({
  form,
  isSubmitting,
  onSubmit,
  initialData,
  handleAIGenerate
}: BlogPostFormContentProps) => {
  const navigate = useNavigate();
  
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="space-y-6 text-left">
        <AutoFillBlogPost
          form={form}
          generateSlug={generateSlug}
          generateImage={async () => {
            const imageUploadButton = document.querySelector('[aria-label="Generate with AI"]') as HTMLButtonElement;
            if (imageUploadButton) imageUploadButton.click();
          }}
          generateAltText={async () => {
            const altTextButton = document.querySelector('[aria-label="Generate Alt Text"]') as HTMLButtonElement;
            if (altTextButton) altTextButton.click();
          }}
          generateExcerpt={async () => handleAIGenerate('excerpt')}
          generateFullPost={async () => {
            const generateButton = document.querySelector('[aria-label="Generate Full Post"]') as HTMLButtonElement;
            if (generateButton) generateButton.click();
          }}
          generateAllSEO={async () => {
            await handleAIGenerate('seo-title');
            await handleAIGenerate('seo-description');
            await handleAIGenerate('seo-keywords');
          }}
        />

        <BlogPostBasicInfo 
          form={form} 
          generateSlug={generateSlug}
          initialData={initialData}
        />

        <BlogPostImageSection form={form} />

        <BlogPostContent 
          form={form}
          handleAIGenerate={handleAIGenerate}
        />

        <Separator />

        <BlogPostSEO 
          form={form}
          handleAIGenerate={handleAIGenerate}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData ? "Update Post" : "Publish Post"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onSubmit(form.getValues(), true)}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/blog/admin")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};