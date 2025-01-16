import { Control } from "react-hook-form";
import { BlogPostFormData } from "./types/BlogPostTypes";
import { formUtils } from "./utils/formUtils";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface Props {
  control: Control<BlogPostFormData>;
  handleAIGenerate: (type: "excerpt" | "seo-title" | "seo-description" | "seo-keywords" | "improve-content") => Promise<void>;
}

export function BlogPostContent({ control, handleAIGenerate }: Props) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-[200px]"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleAIGenerate("improve-content")}
      >
        <Wand2 className="w-4 h-4 mr-2" />
        Improve Content
      </Button>
    </div>
  );
}