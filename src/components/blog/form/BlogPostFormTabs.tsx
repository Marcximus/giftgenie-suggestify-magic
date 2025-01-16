import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { BlogPostPreview } from "../BlogPostPreview";
import { BlogPostFormContent } from "./BlogPostFormContent";
import { UseFormReturn } from "react-hook-form";

interface BlogPostFormTabsProps {
  form: UseFormReturn<BlogPostFormData>;
  activeTab: string;
  setActiveTab: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (data: BlogPostFormData, isDraft?: boolean) => Promise<void>;
  initialData?: BlogPostFormData & { id?: string };
  handleAIGenerate: (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => Promise<void>;
}

export const BlogPostFormTabs = ({ 
  form, 
  activeTab, 
  setActiveTab,
  isSubmitting,
  onSubmit,
  initialData,
  handleAIGenerate
}: BlogPostFormTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="edit">
        <BlogPostFormContent 
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          initialData={initialData}
          handleAIGenerate={handleAIGenerate}
        />
      </TabsContent>

      <TabsContent value="preview" className="text-left">
        <BlogPostPreview data={form.watch()} />
      </TabsContent>
    </Tabs>
  );
};