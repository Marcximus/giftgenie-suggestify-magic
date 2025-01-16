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
      const { data: times } = await supabase.rpc('get_random_daily_times');
      console.log('Random times from DB:', times); // Debug log
      
      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      console.log('Queue items:', data); // Debug log

      // Assign time slots to pending items
      const itemsWithTimes = data.map((item, index) => {
        const timeSlot = times && times[index % 3];
        const scheduledTime = timeSlot ? 
          `${String(timeSlot.hour).padStart(2, '0')}:${String(timeSlot.minute).padStart(2, '0')}` : 
          null;
        console.log(`Item ${index}:`, { status: item.status, timeSlot, scheduledTime }); // Debug log
        return {
          ...item,
          scheduledTime
        };
      });

      return itemsWithTimes;
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
      const { error } = await supabase
        .from("blog_post_queue")
        .insert([{ title, status: "pending" }]);

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
                  {item.scheduledTime || '-'}
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