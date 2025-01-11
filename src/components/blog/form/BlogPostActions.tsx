import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BlogPostFormData } from "../types/BlogPostTypes";

interface BlogPostActionsProps {
  isSubmitting: boolean;
  isGenerating: boolean;
  onSubmit: (isDraft: boolean) => void;
}

export const BlogPostActions = ({ isSubmitting, isGenerating, onSubmit }: BlogPostActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4">
      <Button type="submit" disabled={isSubmitting || isGenerating}>
        {isSubmitting ? "Saving..." : "Publish Post"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting || isGenerating}
        onClick={() => onSubmit(true)}
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