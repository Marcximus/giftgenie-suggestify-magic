import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { searchProduct, getProductDetails, AmazonApiError } from './amazonApi.ts';
import type { ProductResponse } from './types.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RAPIDAPI_KEY) {
      console.error('RapidAPI key not configured');
      throw new Error('RapidAPI key not configured');
    }

    const { searchTerm } = await req.json();
    console.log('Processing request for search term:', searchTerm);
    
    try {
      // First API call: Search for product
      const asin = await searchProduct(searchTerm, RAPIDAPI_KEY);
      
      // Add delay between requests to help prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Second API call: Get product details
      const productDetails = await getProductDetails(asin, RAPIDAPI_KEY);
      
      // Format the response
      const product = productDetails.data;
      let description = '';
      
      if (typeof product.description === 'string') {
        description = product.description;
      } else if (Array.isArray(product.feature_bullets) && product.feature_bullets.length > 0) {
        description = product.feature_bullets.join(' ');
      } else if (Array.isArray(product.product_information)) {
        description = product.product_information.join(' ');
      } else if (typeof product.product_information === 'string') {
        description = product.product_information;
      } else {
        description = 'No description available';
      }

      const productData: ProductResponse = {
        title: product.title,
        description: description,
        price: product.price?.current_price || 0,
        currency: product.price?.currency || 'USD',
        imageUrl: product.main_image,
        rating: product.rating,
        totalRatings: product.ratings_total,
        asin: product.asin,
      };

      return new Response(JSON.stringify(productData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error in Amazon API calls:', error);
      
      if (error instanceof AmazonApiError) {
        if (error.status === 429) {
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded. Please try again in a moment.',
              retryAfter: error.retryAfter,
            }),
            {
              status: 429,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Retry-After': error.retryAfter || '30'
              }
            }
          );
        }
        
        if (error.status === 403) {
          return new Response(
            JSON.stringify({
              error: 'API authentication failed. Please check API key configuration.',
              details: 'Invalid or expired API key'
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
      
      // Return a fallback response for other errors
      return new Response(
        JSON.stringify({ 
          title: searchTerm,
          description: "Product information temporarily unavailable",
          price: 0,
          currency: 'USD',
          imageUrl: '',
          asin: ''
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch Amazon product data'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});