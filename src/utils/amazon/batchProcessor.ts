import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const BATCH_SIZE = 4; // Process 4 products at a time
const BATCH_DELAY = 1000; // 1 second delay between batches

export async function processBatch<T>(
  items: T[],
  processItem: (item: T) => Promise<any>,
  onProgress?: (processed: number, total: number) => void
) {
  const results = [];
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(items.length / BATCH_SIZE)}`);
    
    try {
      const batchPromises = batch.map(item => processItem(item));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      if (onProgress) {
        onProgress(Math.min(i + BATCH_SIZE, items.length), items.length);
      }
      
      // Add delay between batches if not the last batch
      if (i + BATCH_SIZE < items.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    } catch (error) {
      console.error('Error processing batch:', error);
      toast({
        title: "Error processing items",
        description: "Some items could not be processed. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  return results;
}