import { Json } from "@/integrations/supabase/types";
import { AffiliateLink } from '../types/BlogPostTypes';

export const formUtils = {
  parseAffiliateLinks(json: Json): AffiliateLink[] {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  stringifyAffiliateLinks(links: AffiliateLink[]): Json {
    return JSON.stringify(links) as Json;
  },

  parseKeywords(keywordsStr: string | null): string[] {
    if (!keywordsStr) return [];
    return keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
  },

  stringifyKeywords(keywords: string[]): string {
    return (keywords || []).join(', ');
  }
};