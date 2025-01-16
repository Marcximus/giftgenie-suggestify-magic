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

  const getRandomTimeForDate = async (dateStr: string, existingTimes: string[]) => {
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .rpc('get_random_daily_times');
    
    if (timeSlotsError) throw timeSlotsError;
    
    // Shuffle the time slots array
    const shuffledSlots = timeSlots.sort(() => Math.random() - 0.5);
    
    // Find an available time slot
    for (const slot of shuffledSlots) {
      const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}:00`;
      if (!existingTimes.includes(timeStr)) {
        return timeStr;
      }
    }
    
    return null;
  };

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
      // First, get all existing schedules
      const { data: existingSchedules, error: countError } = await supabase
        .from("blog_post_queue")
        .select("scheduled_date, scheduled_time")
        .order("scheduled_date", { ascending: true });

      if (countError) throw countError;

      // Find the next available date
      let scheduledDate = new Date();
      let scheduledTime: string | null = null;
      
      while (!scheduledTime) {
        const dateStr = scheduledDate.toISOString().split('T')[0];
        const postsOnDate = existingSchedules?.filter(
          item => item.scheduled_date === dateStr
        ).length || 0;

        if (postsOnDate < 3) {
          // Get existing times for this date
          const existingTimesForDate = existingSchedules
            ?.filter(item => item.scheduled_date === dateStr)
            .map(item => item.scheduled_time) || [];
          
          // Try to get a random available time
          scheduledTime = await getRandomTimeForDate(dateStr, existingTimesForDate);
          
          if (scheduledTime) {
            const { error } = await supabase
              .from("blog_post_queue")
              .insert([{ 
                title, 
                status: "pending",
                scheduled_date: dateStr,
                scheduled_time: scheduledTime
              }]);

            if (error) throw error;
            break;
          }
        }
        
        // Move to next day if no slots available
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

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