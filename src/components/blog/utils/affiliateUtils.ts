import { Json } from '@/integrations/supabase/types';
import { AffiliateLink } from '../types/BlogPostTypes';

export const affiliateLinksUtils = {
  parse(json: Json): AffiliateLink[] {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is AffiliateLink => 
        typeof item === 'object' && 
        item !== null && 
        'productUrl' in item && 
        'imageUrl' in item && 
        'title' in item
      );
    } catch {
      console.error('Error parsing affiliate links');
      return [];
    }
  },

  toJson(links: AffiliateLink[]): Json {
    return JSON.stringify(links) as Json;
  }
};