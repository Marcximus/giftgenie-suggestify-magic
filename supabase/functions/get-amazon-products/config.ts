export const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Price range parsing configuration
export const PRICE_RANGE = {
  DEFAULT_RANGE_PERCENTAGE: 0.2, // ±20% for single price values
  MIN_PRICE: 1, // Minimum allowed price
};