// Hardcoded Amazon Associate ID for instant link generation
const AMAZON_ASSOCIATE_ID = 'marcximus-20';

export const buildAmazonUrl = (asin: string): string => {
  const isValidAsin = asin && /^[A-Z0-9]{10}$/.test(asin);
  if (!isValidAsin) return '';

  return `https://www.amazon.com/dp/${asin}/ref=nosim?tag=${AMAZON_ASSOCIATE_ID}`;
};
