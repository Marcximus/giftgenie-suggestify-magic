import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FormActionsProps {
  isSubmitting: boolean;
  onSaveAsDraft: () => void;
  initialData?: any;
}

export const FormActions = ({ isSubmitting, onSaveAsDraft, initialData }: FormActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : initialData ? "Update Post" : "Publish Post"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting}
        onClick={onSaveAsDraft}
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