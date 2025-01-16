import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { QueueItemStatus } from "./QueueItemStatus";
import { QueueItemActions } from "./QueueItemActions";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface QueueTableProps {
  items: Tables<"blog_post_queue">[];
  onDeleteItem: (id: string) => Promise<void>;
}

export const QueueTable = ({ items, onDeleteItem }: QueueTableProps) => {
  const { toast } = useToast();

  const handleManualTrigger = async () => {
    try {
      const { error } = await supabase.functions.invoke('auto-generate-blog');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Blog post generation started",
      });
    } catch (error: any) {
      console.error('Error triggering blog generation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to trigger blog generation",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={handleManualTrigger}>
          <Play className="w-4 h-4 mr-2" />
          Generate Next Post
        </Button>
      </div>
      
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Scheduled Date</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Scheduled Time</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-4 align-middle text-left">{item.title}</td>
                <td className="p-4 align-middle text-left">
                  <QueueItemStatus status={item.status || 'pending'} />
                </td>
                <td className="p-4 align-middle text-left">
                  {formatDate(item.scheduled_date)}
                </td>
                <td className="p-4 align-middle text-left">
                  {formatTime(item.scheduled_time)}
                </td>
                <td className="p-4 align-middle text-left">
                  <QueueItemActions 
                    item={item} 
                    onDelete={onDeleteItem}
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  No items in queue
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};