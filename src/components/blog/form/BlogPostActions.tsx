import { Button } from "@/components/ui/button";
import { BlogPostFormData } from "../types/BlogPostTypes";

interface BlogPostActionsProps {
  isSubmitting: boolean;
  onSubmit: (data: BlogPostFormData, isDraft: boolean) => Promise<void>;
  onCancel: () => void;
  getValues: () => BlogPostFormData;
  initialData?: BlogPostFormData;
}

export const BlogPostActions = ({
  isSubmitting,
  onSubmit,
  onCancel,
  getValues,
  initialData
}: BlogPostActionsProps) => {
  return (
    <div className="flex gap-4">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : initialData ? "Update Post" : "Publish Post"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting}
        onClick={() => onSubmit(getValues(), true)}
      >
        Save as Draft
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
};