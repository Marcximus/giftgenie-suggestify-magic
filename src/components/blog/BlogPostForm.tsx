import { useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BlogPostPreview } from "./BlogPostPreview";
import { useAIContent } from "@/hooks/useAIContent";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { BlogPostFormData, EMPTY_FORM_DATA } from "./types/BlogPostTypes";
import { BlogPostImageSection } from "./form/BlogPostImageSection";
import { BlogPostFormActions } from "./form/BlogPostFormActions";
import { useAltTextGeneration } from "./form/useAltTextGeneration";
import { useSlugGeneration } from "./form/useSlugGeneration";

type FormAction = 
  | { type: 'SET_FIELD'; field: keyof BlogPostFormData; value: any }
  | { type: 'RESET'; data: BlogPostFormData };

function formReducer(state: BlogPostFormData, action: FormAction): BlogPostFormData {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return action.data;
    default:
      return state;
  }
}

interface BlogPostFormProps {
  initialData?: BlogPostFormData;
}

const BlogPostForm = ({ initialData }: BlogPostFormProps) => {
  const [formData, dispatch] = useReducer(formReducer, initialData || EMPTY_FORM_DATA);
  const [activeTab, setActiveTab] = useState("edit");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateContent, getFormFieldFromType } = useAIContent();
  const { generateUniqueSlug, generateSlug } = useSlugGeneration();
  const { isGeneratingAltText, generateAltText } = useAltTextGeneration(formData, dispatch);

  const handleFieldChange = (field: keyof BlogPostFormData, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const handleAIGenerate = async (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => {
    const currentTitle = formData.title;
    const currentContent = formData.content;
    
    if (!currentTitle && !currentContent) {
      toast({
        title: "Error",
        description: "Please provide some content or a title first.",
        variant: "destructive"
      });
      return;
    }

    const generatedContent = await generateContent(
      type,
      currentContent,
      currentTitle
    );

    if (generatedContent) {
      const formField = getFormFieldFromType(type);
      handleFieldChange(formField, generatedContent);
      toast({
        title: "Success",
        description: "Content generated successfully!",
      });
    }
  };

  const onSubmit = async (isDraft: boolean = false) => {
    try {
      const currentTime = new Date().toISOString();
      const publishedAt = isDraft ? null : currentTime;
      
      const uniqueSlug = await generateUniqueSlug(formData.slug);
      if (uniqueSlug !== formData.slug) {
        handleFieldChange('slug', uniqueSlug);
        toast({
          title: "Notice",
          description: "A similar slug already existed. Generated a unique one.",
        });
      }

      const dataToSubmit = {
        ...formData,
        updated_at: currentTime,
        published_at: publishedAt,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("blog_posts")
          .update(dataToSubmit)
          .eq("id", initialData.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: isDraft ? "Draft saved successfully" : "Blog post updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert([{
            ...dataToSubmit,
            created_at: currentTime,
          }]);

        if (error) throw error;
        toast({
          title: "Success",
          description: isDraft ? "Draft saved successfully" : "Blog post created successfully",
        });
      }
      navigate("/blog/admin");
    } catch (error: any) {
      console.error("Error saving blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save blog post",
        variant: "destructive",
      });
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="edit">
        <Form>
          <form className="space-y-6 text-left">
            <BlogPostBasicInfo 
              formData={formData}
              onFieldChange={handleFieldChange}
              generateSlug={generateSlug}
              initialData={initialData}
            />

            <BlogPostImageSection
              formData={formData}
              onFieldChange={handleFieldChange}
              isGeneratingAltText={isGeneratingAltText}
              generateAltText={generateAltText}
            />

            <BlogPostContent 
              formData={formData}
              onFieldChange={handleFieldChange}
              handleAIGenerate={handleAIGenerate}
            />

            <Separator />

            <BlogPostSEO 
              formData={formData}
              onFieldChange={handleFieldChange}
              handleAIGenerate={handleAIGenerate}
            />

            <BlogPostFormActions
              onSubmit={onSubmit}
            />
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="preview" className="text-left">
        <BlogPostPreview data={formData} />
      </TabsContent>
    </Tabs>
  );
};

export default BlogPostForm;