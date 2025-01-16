import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QueueItemStatus } from "./QueueItemStatus";
import { QueueItemActions } from "./QueueItemActions";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const QueueTable = () => {
  const { toast } = useToast();
  const { data: queueItems, refetch } = useQuery({
    queryKey: ['blog-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_post_queue')
        .select('*')
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data as Tables<"blog_post_queue">[];
    }
  });

  const handleManualTrigger = async () => {
    try {
      const { error } = await supabase.functions.invoke('auto-generate-blog');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Blog post generation started",
      });
      
      refetch();
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
            {queueItems?.map((item, index) => (
              <tr key={item.id} className="border-b">
                <td className="p-4 align-middle">{item.title}</td>
                <td className="p-4 align-middle">
                  <QueueItemStatus status={item.status} />
                </td>
                <td className="p-4 align-middle">
                  {item.scheduled_time ? 
                    new Date(item.scheduled_time).toLocaleTimeString() : 
                    'Not scheduled'}
                </td>
                <td className="p-4 align-middle">
                  <QueueItemActions item={item} onUpdate={refetch} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};