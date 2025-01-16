import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface QueueItemActionsProps {
  item: {
    id: string;
    title: string;
    error_message?: string | null;
  };
  onDelete: (id: string) => Promise<void>;
}

export const QueueItemActions = ({ item, onDelete }: QueueItemActionsProps) => {
  return (
    <div className="flex gap-2">
      {item.error_message && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => alert(item.error_message)}
        >
          View Error
        </Button>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Queue Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.title}" from the queue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(item.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};