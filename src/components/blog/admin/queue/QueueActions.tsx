import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkUploadDialog } from "../BulkUploadDialog";

interface QueueActionsProps {
  onAddSingle: () => void;
  onBulkSuccess: () => void;
}

export const QueueActions = ({ onAddSingle, onBulkSuccess }: QueueActionsProps) => {
  return (
    <div className="flex justify-end mb-4 gap-4">
      <BulkUploadDialog onSuccess={onBulkSuccess} />
      <Button onClick={onAddSingle} variant="outline">
        <Plus className="mr-2 h-4 w-4" /> Add Single Title
      </Button>
    </div>
  );
};