import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QueueUploader } from "./queue/QueueUploader";
import { QueueTable } from "./queue/QueueTable";

export const QueueTab = () => {
  const { data: queuedPosts, refetch } = useQuery({
    queryKey: ["blog-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_queue")
        .select("*")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <QueueUploader onUploadSuccess={refetch} />
      <QueueTable queuedPosts={queuedPosts || []} />
    </div>
  );
};