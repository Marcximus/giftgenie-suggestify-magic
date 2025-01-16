import { AffiliateLink } from '../types/BlogPostTypes';

export const formUtils = {
  parseAffiliateLinks(json: string): AffiliateLink[] {
    try {
      return JSON.parse(json) || [];
    } catch {
      return [];
    }
  },

  stringifyAffiliateLinks(links: AffiliateLink[]): string {
    return JSON.stringify(links || []);
  },

  parseKeywords(keywordsStr: string | null): string[] {
    if (!keywordsStr) return [];
    return keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
  },

  stringifyKeywords(keywords: string[]): string {
    return (keywords || []).join(', ');
  }
};