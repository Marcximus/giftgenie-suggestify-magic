export const generateAmazonLink = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=getthegiftai-20`;

export const buildAmazonUrl = (asin: string, tag?: string) => {
  const affiliateTag = tag || 'getthegiftai-20';
  return `https://www.amazon.com/dp/${asin}?tag=${affiliateTag}`;
};
