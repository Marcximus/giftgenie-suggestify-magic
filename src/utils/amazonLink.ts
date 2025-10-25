import { supabase } from '@/integrations/supabase/client';

interface AffiliateData {
  affiliateIds: Record<string, string>;
  detectedCountry: string;
}

let cachedAffiliateData: AffiliateData | null = null;

// Map country codes to Amazon domains
const AMAZON_DOMAINS: Record<string, string> = {
  US: 'amazon.com',
  GB: 'amazon.co.uk',
  DE: 'amazon.de',
  FR: 'amazon.fr',
  CA: 'amazon.ca',
  JP: 'amazon.co.jp',
  IT: 'amazon.it',
  ES: 'amazon.es',
};

// Detect user's country using browser API (fallback if server doesn't detect)
const detectUserCountry = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Map common timezones to country codes
    if (timezone.includes('London') || timezone.includes('Europe/Dublin')) return 'GB';
    if (timezone.includes('Europe/Berlin') || timezone.includes('Europe/Zurich')) return 'DE';
    if (timezone.includes('Europe/Paris')) return 'FR';
    if (timezone.includes('Toronto') || timezone.includes('Vancouver')) return 'CA';
    if (timezone.includes('Tokyo')) return 'JP';
    if (timezone.includes('Rome')) return 'IT';
    if (timezone.includes('Madrid')) return 'ES';
  } catch (error) {
    console.warn('Error detecting timezone:', error);
  }
  return 'US'; // Default to US
};

export const getAmazonAssociateId = async (): Promise<string | null> => {
  if (!cachedAffiliateData) {
    try {
      const { data } = await supabase.functions.invoke('get-amazon-associate-id');
      cachedAffiliateData = data as AffiliateData;
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    }
  }
  
  if (!cachedAffiliateData) return null;

  // Use detected country from server or fallback to browser detection
  const country = cachedAffiliateData.detectedCountry || detectUserCountry();
  
  // Return affiliate ID for detected country, fallback to US
  return cachedAffiliateData.affiliateIds[country] || cachedAffiliateData.affiliateIds.US || null;
};

export const buildAmazonUrl = (asin: string, associateId: string, countryCode?: string): string => {
  const isValidAsin = asin && /^[A-Z0-9]{10}$/.test(asin);
  if (!isValidAsin || !associateId) return '';

  // Use provided country code or detect from cached data
  let country = countryCode;
  if (!country && cachedAffiliateData) {
    country = cachedAffiliateData.detectedCountry || detectUserCountry();
  }
  if (!country) country = 'US';

  // Get appropriate Amazon domain
  const domain = AMAZON_DOMAINS[country] || AMAZON_DOMAINS.US;

  return `https://www.${domain}/dp/${asin}/ref=nosim?tag=${associateId}`;
};
