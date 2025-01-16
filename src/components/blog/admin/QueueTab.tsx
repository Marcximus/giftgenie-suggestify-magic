import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { QueueActions } from "./queue/QueueActions";
import { QueueTable } from "./queue/QueueTable";

export const QueueTab = () => {
  const { toast } = useToast();

  const { data: queueItems, isLoading, refetch: refetchQueue } = useQuery({
    queryKey: ["blog-post-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });
      
      if (error) throw error;
      console.log('Queue items:', data);
      return data;
    },
  });

  const handleDeleteQueueItem = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from("blog_post_queue")
        .delete()
        .eq("id", queueId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Queue item deleted successfully",
      });
      
      refetchQueue();
    } catch (error: any) {
      console.error("Error deleting queue item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete queue item",
        variant: "destructive",
      });
    }
  };

  const addToQueue = async () => {
    const title = window.prompt("Enter blog post title:");
    if (!title) return;

    try {
      // First, get the next available date that has less than 3 posts
      const { data: existingSchedules, error: countError } = await supabase
        .from("blog_post_queue")
        .select("scheduled_date, scheduled_time")
        .order("scheduled_date", { ascending: true });

      if (countError) throw countError;

      // Find the next available date
      let scheduledDate = new Date();
      while (true) {
        const dateStr = scheduledDate.toISOString().split('T')[0];
        const postsOnDate = existingSchedules?.filter(
          item => item.scheduled_date === dateStr
        ).length || 0;

        if (postsOnDate < 3) break;
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      // Get random time slots for this date
      const { data: timeSlots, error: timeSlotsError } = await supabase
        .rpc('get_random_daily_times');
      
      if (timeSlotsError) throw timeSlotsError;

      // Find which slot is available (morning, afternoon, or evening)
      const existingTimesForDate = existingSchedules
        ?.filter(item => item.scheduled_date === scheduledDate.toISOString().split('T')[0])
        .map(item => item.scheduled_time) || [];

      const availableSlot = timeSlots.find((slot) => {
        const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
        return !existingTimesForDate.includes(timeStr);
      });

      if (!availableSlot) throw new Error("No available time slots for this date");

      const scheduledTime = `${String(availableSlot.hour).padStart(2, '0')}:${String(availableSlot.minute).padStart(2, '0')}`;

      const { error } = await supabase
        .from("blog_post_queue")
        .insert([{ 
          title, 
          status: "pending",
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          scheduled_time: scheduledTime
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post added to queue",
      });
      
      refetchQueue();
    } catch (error: any) {
      console.error("Error adding to queue:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add to queue",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading queue items...</div>;
  }

  return (
    <>
      <QueueActions 
        onAddSingle={addToQueue}
        onBulkSuccess={refetchQueue}
      />
      <QueueTable 
        items={queueItems || []}
        onDeleteItem={handleDeleteQueueItem}
      />
    </>
  );
};