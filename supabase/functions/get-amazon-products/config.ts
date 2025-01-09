export const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const createRapidApiHeaders = (apiKey: string) => ({
  'X-RapidAPI-Key': apiKey,
  'X-RapidAPI-Host': RAPIDAPI_HOST,
});