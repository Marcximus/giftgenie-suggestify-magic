import { supabase } from '@/integrations/supabase/client';

let cachedAssociateId: string | null = null;

export const openAmazonLink = async (asin?: string, title?: string) => {
  if (!asin) return;
  
  try {
    // Get or fetch associate ID
    if (!cachedAssociateId) {
      const { data } = await supabase.functions.invoke('get-amazon-associate-id');
      cachedAssociateId = data?.AMAZON_ASSOCIATE_ID || null;
    }
    
    const isValidAsin = asin && /^[A-Z0-9]{10}$/.test(asin);
    if (isValidAsin && cachedAssociateId) {
      const url = `https://www.amazon.com/dp/${asin}/ref=nosim?tag=${cachedAssociateId}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Error opening Amazon link:', error);
  }
};
