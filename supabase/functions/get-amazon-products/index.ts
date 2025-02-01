import { corsHeaders } from '../_shared/cors.ts';
import { searchProducts } from './productSearch.ts';
import { validateProduct } from './productDetails.ts';
import { cleanPrice } from './priceUtils.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, priceRange } = await req.json();

    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    console.log('Processing request:', { 
      searchTerm,
      priceRange,
      timestamp: new Date().toISOString()
    });

    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    const product = await searchProducts(searchTerm, RAPIDAPI_KEY, priceRange);
    
    if (!product) {
      console.log('No product found for search term:', searchTerm);
      return new Response(
        JSON.stringify({ product: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validatedProduct = validateProduct(product);
    const cleanedPrice = cleanPrice(validatedProduct.price);

    console.log('Processed product:', {
      title: validatedProduct.title,
      price: cleanedPrice,
      priceRange,
      withinRange: priceRange ? (
        cleanedPrice >= priceRange.min && 
        cleanedPrice <= priceRange.max
      ) : true
    });

    // Only return product if it's within the price range
    const finalProduct = priceRange && cleanedPrice ? (
      cleanedPrice >= priceRange.min && 
      cleanedPrice <= priceRange.max ? 
        validatedProduct : null
    ) : validatedProduct;

    return new Response(
      JSON.stringify({ product: finalProduct }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});