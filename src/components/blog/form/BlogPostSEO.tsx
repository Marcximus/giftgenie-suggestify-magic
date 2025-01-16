import { Control } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { formUtils } from "../utils/formUtils";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface Props {
  control: Control<BlogPostFormData>;
  handleAIGenerate: (type: "excerpt" | "seo-title" | "seo-description" | "seo-keywords" | "improve-content") => Promise<void>;
}

export function BlogPostSEO({ control, handleAIGenerate }: Props) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="meta_title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meta Title</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ''} />
            </FormControl>
            <FormDescription>
              Title that appears in search engine results (50-60 characters recommended)
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="meta_description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meta Description</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value || ''} />
            </FormControl>
            <FormDescription>
              Description that appears in search engine results (150-160 characters recommended)
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="meta_keywords"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              Keywords
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAIGenerate("seo-keywords")}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ''}
                onChange={e => {
                  const keywords = formUtils.parseKeywords(e.target.value);
                  field.onChange(formUtils.stringifyKeywords(keywords));
                }}
              />
            </FormControl>
            <FormDescription>
              Comma-separated keywords for SEO
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}