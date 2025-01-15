import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BlogPostFormActionsProps {
  isSubmitting: boolean;
  onSubmit: (isDraft: boolean) => void;
}

export const BlogPostFormActions = ({ isSubmitting, onSubmit }: BlogPostFormActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4">
      <Button type="submit" disabled={isSubmitting} onClick={() => onSubmit(false)}>
        {isSubmitting ? "Saving..." : "Publish Post"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting}
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