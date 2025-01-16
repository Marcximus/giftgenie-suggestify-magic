import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BulkUploadDialog } from "./BulkUploadDialog";

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

      const availableSlot = timeSlots.find((slot, index) => {
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
      <div className="flex justify-end mb-4 gap-4">
        <BulkUploadDialog onSuccess={refetchQueue} />
        <Button onClick={() => addToQueue()} variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add Single Title
        </Button>
      </div>
      
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
            {queueItems?.map((item: any, index: number) => (
              <TableRow key={item.id}>
                <TableCell className="text-left">{index + 1}</TableCell>
                <TableCell className="text-left">{item.title}</TableCell>
                <TableCell className="text-left">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.status === 'completed' ? 'bg-green-100 text-green-800' :
                      item.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {item.status}
                  </span>
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
                            onClick={() => handleDeleteQueueItem(item.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};