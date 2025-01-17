import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { formatProductHtml } from './productFormatter.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    console.log('Processing blog content, length:', content.length);

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const associateId = Deno.env.get('AMAZON_ASSOCIATE_ID');
    if (!associateId) {
      throw new Error('AMAZON_ASSOCIATE_ID not configured');
    }

    // Split content into sections and count how many product sections we have
    const sections = content.split('<hr class="my-8">');
    const productSections = sections.filter(section => section.includes('<h3>'));
    console.log('Total product sections found:', productSections.length);
    
    const processedSections = [];
    const affiliateLinks = [];
    const searchFailures = [];

    for (const section of sections) {
      if (section.includes('<h3>')) {
        try {
          const titleMatch = section.match(/<h3>(.*?)<\/h3>/);
          if (titleMatch) {
            const searchTerm = titleMatch[1];
            console.log('Processing product section:', searchTerm);
            
            // Search for product with simplified term
            const searchUrl = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchTerm)}&country=US&category_id=aps`;
            console.log('Making request to:', searchUrl);
            
            const searchResponse = await fetch(searchUrl, {
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': RAPIDAPI_HOST,
              }
            });

            if (!searchResponse.ok) {
              console.error('Amazon API error:', {
                status: searchResponse.status,
                statusText: searchResponse.statusText,
                url: searchUrl
              });
              throw new Error(`Amazon API error: ${searchResponse.status}`);
            }

            const searchData = await searchResponse.json();
            console.log('Search response products:', searchData.data?.products?.length || 0);

            // Take the first product that has an ASIN and image
            const product = searchData.data?.products?.find(p => p.asin && (p.product_photo || p.thumbnail));
            
            if (!product) {
              console.warn('No valid products found for:', searchTerm);
              searchFailures.push({
                term: searchTerm,
                error: 'No products with required data found',
                timestamp: new Date().toISOString()
              });
              processedSections.push(section);
              continue;
            }

            console.log('Selected product:', {
              title: product.title,
              asin: product.asin,
              hasImage: !!(product.product_photo || product.thumbnail)
            });

            // Get detailed product information
            const detailsUrl = `https://${RAPIDAPI_HOST}/product-details?asin=${product.asin}&country=US`;
            console.log('Fetching product details:', detailsUrl);
            
            const detailsResponse = await fetch(detailsUrl, {
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': RAPIDAPI_HOST,
              }
            });

            let rating, totalRatings, features;
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              console.log('Product details received');
              
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

            // Split section content
            const [beforeH3, afterH3] = section.split('</h3>');
            const description = afterH3.split('<ul')[0];

            // Format the product HTML with all available data
            const productHtml = formatProductHtml({
              title: product.title,
              imageUrl: product.product_photo || product.thumbnail,
              price: product.price?.current_price ? parseFloat(product.price.current_price.replace(/[^0-9.]/g, '')) : undefined,
              currency: 'USD',
              rating,
              totalRatings,
              description: product.product_description || '',
              features: features || []
            }, affiliateLink);

            processedSections.push(`${beforeH3}</h3>${productHtml}${description}`);
            console.log('Successfully processed product section');
          } else {
            processedSections.push(section);
          }
        } catch (error) {
          console.error('Error processing product section:', error);
          searchFailures.push({
            term: section.match(/<h3>(.*?)<\/h3>/)?.[1] || 'Unknown',
            error: error.message,
            timestamp: new Date().toISOString()
          });
          processedSections.push(section);
        }
      } else {
        processedSections.push(section);
      }
    }

    const processedContent = processedSections.join('<hr class="my-8">');
    console.log('Processed content length:', processedContent.length);
    console.log('Number of affiliate links:', affiliateLinks.length);
    console.log('Number of search failures:', searchFailures.length);

    return new Response(
      JSON.stringify({
        content: processedContent,
        affiliateLinks,
        searchFailures
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