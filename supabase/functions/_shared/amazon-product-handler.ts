import { AmazonProduct } from "./types.ts";

export async function searchAmazonProduct(searchTerm: string): Promise<AmazonProduct | null> {
  try {
    const { data, error } = await fetch('https://api.supabase.com/functions/v1/get-amazon-products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchTerm }),
    }).then(res => res.json());

    if (error) {
      console.error('Error from get-amazon-products:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in searchAmazonProduct:', error);
    return null;
  }
}

export function generateAffiliateLink(asin: string, associateId: string): string {
  return `https://www.amazon.com/dp/${asin}/ref=nosim?tag=${associateId}`;
}