import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";
import { useNavigate } from "react-router-dom";

interface BlogPostActionsProps {
  form: UseFormReturn<BlogPostFormData>;
  isSubmitting: boolean;
  onSubmit: (data: BlogPostFormData, isDraft: boolean) => Promise<void>;
}

export const BlogPostActions = ({ form, isSubmitting, onSubmit }: BlogPostActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : form.getValues("id") ? "Update Post" : "Publish Post"}
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
  );
};