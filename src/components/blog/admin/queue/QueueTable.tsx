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
              <th className="h-12 px-4 text-left align-middle font-medium">Scheduled Time</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-4 align-middle">{item.title}</td>
                <td className="p-4 align-middle">
                  <QueueItemStatus status={item.status || 'pending'} />
                </td>
                <td className="p-4 align-middle">
                  {item.scheduled_time ? 
                    new Date(`1970-01-01T${item.scheduled_time}`).toLocaleTimeString() : 
                    'Not scheduled'}
                </td>
                <td className="p-4 align-middle">
                  <QueueItemActions 
                    item={item} 
                    onDelete={onDeleteItem}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};