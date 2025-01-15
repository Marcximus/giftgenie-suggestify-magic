import { Json } from '@supabase/supabase-js';
import { AffiliateLink } from '../types/BlogPostTypes';

export const affiliateLinksUtils = {
  parse(json: Json): AffiliateLink[] {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  stringify(links: AffiliateLink[]): Json {
    return JSON.stringify(links) as Json;
  }
};

export const convertKeywordsToArray = (keywords: string | string[] | null): string[] => {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords;
  return keywords.split(',').map(k => k.trim()).filter(Boolean);
};

export const convertKeywordsToString = (keywords: string[] | null): string => {
  if (!keywords) return '';
  return keywords.join(', ');
};