import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, Loader2 } from "lucide-react";

interface BlogPostGenerationProps {
  isGeneratingAll: boolean;
  generationStatus: string;
  onGenerateAll: () => void;
}

export const BlogPostGeneration = ({
  isGeneratingAll,
  generationStatus,
  onGenerateAll
}: BlogPostGenerationProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <Button
        type="button"
        onClick={onGenerateAll}
        disabled={isGeneratingAll}
        className="flex items-center gap-2"
      >
        {isGeneratingAll ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        Generate All from Queue
      </Button>
      {generationStatus && (
        <Badge variant={generationStatus.includes("complete") ? "secondary" : "default"}>
          {generationStatus}
        </Badge>
      )}
    </div>
  );
};