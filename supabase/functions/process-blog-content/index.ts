import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { formatProductHtml } from './productFormatter.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, associateId } = await req.json();
    console.log('Processing blog content, length:', content.length);

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    if (!associateId) {
      throw new Error('AMAZON_ASSOCIATE_ID not configured');
    }

    // Split content into sections and process product sections
    const sections = content.split('<hr class="my-8">');
    console.log('Total sections found:', sections.length);
    
    const processedSections = [];
    const affiliateLinks = [];
    const searchFailures = [];
    const productReviews = [];
    let productSectionCount = 0;
    let amazonLookupCount = 0;
    let successfulReplacements = 0;

    for (const section of sections) {
      if (section.includes('<h3>')) {
        productSectionCount++;
        try {
          const titleMatch = section.match(/<h3>(.*?)<\/h3>/);
          if (titleMatch) {
            const searchTerm = titleMatch[1].trim();
            console.log('Processing product section:', searchTerm);
            amazonLookupCount++;
            
            const searchUrl = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchTerm)}&country=US&category_id=aps`;
            console.log('Making request to:', searchUrl);
            
            const searchResponse = await fetch(searchUrl, {
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': RAPIDAPI_HOST,
              }
            });

            if (!searchResponse.ok) {
              throw new Error(`Amazon API error: ${searchResponse.status}`);
            }

            const searchData = await searchResponse.json();
            console.log('Search response products:', searchData.data?.products?.length || 0);

            const product = searchData.data?.products?.find(p => p.asin && (p.product_photo || p.thumbnail));
            
            if (!product) {
              console.warn('No valid products found for:', searchTerm);
              searchFailures.push({
                term: searchTerm,
                error: 'No products with required data found'
              });
              processedSections.push(section);
              continue;
            }

            console.log('Found product:', {
              title: product.title,
              asin: product.asin
            });

            // Get detailed product information
            const detailsUrl = `https://${RAPIDAPI_HOST}/product-details?asin=${product.asin}&country=US`;
            const detailsResponse = await fetch(detailsUrl, {
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': RAPIDAPI_HOST,
              }
            });

            let rating, totalRatings, features;
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              rating = detailsData.data?.product_rating ? 
                parseFloat(detailsData.data.product_rating) : undefined;
              totalRatings = detailsData.data?.product_num_ratings ? 
                parseInt(detailsData.data.product_num_ratings, 10) : undefined;
              features = detailsData.data?.product_features || [];
            }

            // Create affiliate link
            const affiliateLink = `https://www.amazon.com/dp/${product.asin}?tag=${associateId}`;
            console.log('Generated affiliate link for:', product.asin);
            
            affiliateLinks.push({
              title: product.title,
              url: affiliateLink,
              asin: product.asin
            });

            // Store review data
            if (rating && totalRatings) {
              productReviews.push({
                title: product.title,
                rating,
                totalRatings,
                asin: product.asin
              });
            }

            // Format the product HTML
            const productHtml = formatProductHtml({
              title: product.title,
              imageUrl: product.product_photo || product.thumbnail,
              price: product.price?.current_price ? 
                parseFloat(product.price.current_price.replace(/[^0-9.]/g, '')) : undefined,
              currency: 'USD',
              rating,
              totalRatings,
              description: product.product_description || '',
              features: features || []
            }, affiliateLink);

            // Split section content and combine with product HTML
            const [beforeH3, afterH3] = section.split('</h3>');
            const description = afterH3.split('<ul')[0];
            processedSections.push(`${beforeH3}</h3>${productHtml}${description}`);
            successfulReplacements++;
            console.log('Successfully processed product section');
          } else {
            processedSections.push(section);
          }
        } catch (error) {
          console.error('Error processing product section:', error);
          searchFailures.push({
            term: section.match(/<h3>(.*?)<\/h3>/)?.[1] || 'Unknown',
            error: error.message
          });
          processedSections.push(section);
        }
      } else {
        processedSections.push(section);
      }
    }

    const processedContent = processedSections.join('<hr class="my-8">');
    console.log('Processing summary:', {
      productSections: productSectionCount,
      amazonLookups: amazonLookupCount,
      successfulReplacements,
      affiliateLinksCount: affiliateLinks.length,
      searchFailuresCount: searchFailures.length
    });

    // Update the response to include product reviews
    return new Response(
      JSON.stringify({
        content: processedContent,
        affiliateLinks,
        searchFailures,
        productReviews,
        processingStatus: {
          product_sections: productSectionCount,
          amazon_lookups: amazonLookupCount,
          successful_replacements: successfulReplacements,
          reviews_added: productReviews.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-blog-content:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'process-blog-content-error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
