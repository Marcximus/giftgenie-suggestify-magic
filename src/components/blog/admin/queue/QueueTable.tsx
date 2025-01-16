import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueueItemStatus } from "./QueueItemStatus";
import { QueueItemActions } from "./QueueItemActions";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface QueueItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  error_message?: string | null;
}

interface QueueTableProps {
  items: QueueItem[];
  onDeleteItem: (id: string) => Promise<void>;
}

export const QueueTable = ({ items, onDeleteItem }: QueueTableProps) => {
  const { toast } = useToast();

  const handleGenerateNow = async (queueId: string) => {
    try {
      const { error } = await supabase.functions.invoke('auto-generate-blog', {
        body: { queueId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post generation started",
      });
    } catch (error) {
      console.error('Error triggering generation:', error);
      toast({
        title: "Error",
        description: "Failed to trigger blog post generation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-left">#</TableHead>
            <TableHead className="text-left">Title</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-left">Created At</TableHead>
            <TableHead className="text-left">Scheduled Date</TableHead>
            <TableHead className="text-left">Scheduled Time</TableHead>
            <TableHead className="text-left">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item: QueueItem, index: number) => (
            <TableRow key={item.id}>
              <TableCell className="text-left">{index + 1}</TableCell>
              <TableCell className="text-left">{item.title}</TableCell>
              <TableCell className="text-left">
                <QueueItemStatus status={item.status} />
              </TableCell>
              <TableCell className="text-left">
                {new Date(item.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-left">
                {item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell className="text-left">
                {item.scheduled_time || '-'}
              </TableCell>
              <TableCell className="text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateNow(item.id)}
                    disabled={item.status !== 'pending'}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <QueueItemActions item={item} onDelete={onDeleteItem} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};