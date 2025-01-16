import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const BulkUploadDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [titles, setTitles] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!titles.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one title",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const titleList = titles
        .split("\n")
        .map(title => title.trim())
        .filter(title => title.length > 0);

      // First, get all existing schedules
      const { data: existingSchedules, error: countError } = await supabase
        .from("blog_post_queue")
        .select("scheduled_date, scheduled_time")
        .order("scheduled_date", { ascending: true });

      if (countError) throw countError;

      // Process each title and find available slots
      const scheduledPosts = [];
      let currentDate = new Date();

      for (const title of titleList) {
        // Find the next available date
        while (true) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const postsOnDate = existingSchedules?.filter(
            item => item.scheduled_date === dateStr
          ).length || 0;

          if (postsOnDate < 3) {
            // Get random time slots for this date
            const { data: timeSlots, error: timeSlotsError } = await supabase
              .rpc('get_random_daily_times');
            
            if (timeSlotsError) throw timeSlotsError;

            // Find which slot is available
            const existingTimesForDate = existingSchedules
              ?.filter(item => item.scheduled_date === dateStr)
              .map(item => item.scheduled_time) || [];

            const availableSlot = timeSlots.find((slot) => {
              const timeStr = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
              return !existingTimesForDate.includes(timeStr);
            });

            if (availableSlot) {
              const scheduledTime = `${String(availableSlot.hour).padStart(2, '0')}:${String(availableSlot.minute).padStart(2, '0')}`;
              
              scheduledPosts.push({
                title,
                status: "pending",
                scheduled_date: dateStr,
                scheduled_time: scheduledTime
              });
              
              // Add to existing schedules for next iteration
              existingSchedules?.push({
                scheduled_date: dateStr,
                scheduled_time: scheduledTime
              });
              
              break;
            }
          }
          
          // Move to next day if no slots available
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      const { error } = await supabase
        .from("blog_post_queue")
        .insert(scheduledPosts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${titleList.length} titles added to queue`,
      });
      setTitles("");
      setIsOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error uploading titles:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload titles",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Blog Titles</DialogTitle>
          <DialogDescription>
            Enter one blog post title per line. These will be added to the generation queue and scheduled automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Enter blog titles (one per line)..."
            value={titles}
            onChange={(e) => setTitles(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Titles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};