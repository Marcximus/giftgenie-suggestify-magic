import { supabase } from '@/integrations/supabase/client';

let cachedAssociateId: string | null = null;

export const getAmazonAssociateId = async (): Promise<string | null> => {
  if (!cachedAssociateId) {
    try {
      const { data } = await supabase.functions.invoke('get-amazon-associate-id');
      cachedAssociateId = data?.associateId || null;
    } catch (error) {
      console.error('Error fetching affiliate ID:', error);
    }
  }
  
  return cachedAssociateId;
};

export const buildAmazonUrl = (asin: string, associateId: string): string => {
  const isValidAsin = asin && /^[A-Z0-9]{10}$/.test(asin);
  if (!isValidAsin || !associateId) return '';

  return `https://www.amazon.com/dp/${asin}/ref=nosim?tag=${associateId}`;
};
