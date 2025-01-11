import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface BlogPostActionsProps {
  isSubmitting: boolean;
  isGenerating: boolean;
  onSubmit: (isDraft: boolean) => void;
  onGenerate?: () => void;
}

export const BlogPostActions = ({ 
  isSubmitting, 
  isGenerating,
  onSubmit,
  onGenerate 
}: BlogPostActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-end mt-8">
      <Button
        type="button"
        variant="outline"
        onClick={onGenerate}
        disabled={isGenerating || isSubmitting}
        className="w-full sm:w-auto"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        {isGenerating ? "Generating..." : "Generate with AI"}
      </Button>
      
      <Button
        type="button"
        variant="outline"
        onClick={() => onSubmit(true)}
        disabled={isSubmitting || isGenerating}
        className="w-full sm:w-auto"
      >
        Save as Draft
      </Button>
      
      <Button
        type="submit"
        disabled={isSubmitting || isGenerating}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? "Publishing..." : "Publish"}
      </Button>
    </div>
  );
};