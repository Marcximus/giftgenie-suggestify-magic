import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';
const MAX_RETRIES = 3;
const BATCH_SIZE = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    console.log('Processing blog content, length:', content.length);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Amazon Associate ID
    const { data: associateData, error: associateError } = await supabase.functions.invoke('get-amazon-associate-id');
    if (associateError) {
      console.error('Error getting associate ID:', associateError);
      throw associateError;
    }
    const associateId = associateData.AMAZON_ASSOCIATE_ID;
    console.log('Got Amazon Associate ID:', associateId);

    // Get RapidAPI Key
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    // Split content into sections
    const sections = content.split('<hr class="my-8">');
    console.log('Number of sections:', sections.length);
    
    const processedSections = [];
    const affiliateLinks = [];
    let amazonLookups = 0;
    let reviewsAdded = 0;
    let productSections = 0;
    let successfulReplacements = 0;

    // Process sections in batches
    for (let i = 0; i < sections.length; i += BATCH_SIZE) {
      const batch = sections.slice(i, Math.min(i + BATCH_SIZE, sections.length));
      const batchResults = await Promise.all(batch.map(async (section) => {
        if (!section.includes('<h3>')) {
          return section;
        }

        productSections++;
        const titleMatch = section.match(/<h3>(.*?)<\/h3>/);
        if (!titleMatch) {
          return section;
        }

        const searchTerm = titleMatch[1];
        console.log('Processing product section:', searchTerm);
        amazonLookups++;

        // Implement retry logic for Amazon API calls
        let retryCount = 0;
        let product = null;

        while (retryCount < MAX_RETRIES) {
          try {
            const searchUrl = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchTerm)}&country=US&category_id=aps`;
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
            if (searchData.data?.products?.[0]) {
              product = searchData.data.products[0];
              break;
            }
          } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount === MAX_RETRIES) {
              console.error('Max retries reached for:', searchTerm);
              return section;
            }
            // Add exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }

        if (!product?.asin || !product.product_photo) {
          return section;
        }

        successfulReplacements++;
        let rating, totalRatings;

        try {
          const detailsUrl = `https://${RAPIDAPI_HOST}/product-details?asin=${product.asin}&country=US`;
          const detailsResponse = await fetch(detailsUrl, {
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': RAPIDAPI_HOST,
            }
          });

          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            if (detailsData.data?.product_rating) {
              rating = parseFloat(detailsData.data.product_rating);
              totalRatings = parseInt(detailsData.data.product_num_ratings);
              reviewsAdded++;
            }
          }
        } catch (error) {
          console.error('Error fetching product details:', error);
        }

        const affiliateLink = `https://www.amazon.com/dp/${product.asin}?tag=${associateId}`;
        affiliateLinks.push({
          title: product.title,
          url: affiliateLink,
          asin: product.asin
        });

        const [beforeTitle, afterTitle] = section.split('</h3>');
        return `${beforeTitle}</h3>
          <div class="flex flex-col items-center">
            <div class="w-full max-w-2xl mb-2">
              <img 
                src="${product.product_photo}" 
                alt="${titleMatch[1]}"
                class="w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] object-contain rounded-lg shadow-md mx-auto" 
                loading="lazy"
              />
            </div>
            <div class="product-actions">
              ${rating ? `
                <div class="flex items-center gap-1">
                  ${Array.from({ length: 5 }, (_, i) => 
                    `<span class="text-yellow-400 text-sm">
                      ${i < Math.floor(rating) ? '★' : '☆'}
                    </span>`
                  ).join('')}
                  <span class="text-sm font-medium ml-1">${rating.toFixed(1)}</span>
                  ${totalRatings ? `
                    <span class="text-sm text-gray-500">
                      (${totalRatings.toLocaleString()})
                    </span>
                  ` : ''}
                </div>
              ` : ''}
              <a 
                href="${affiliateLink}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="amazon-button"
              >
                View on Amazon
              </a>
            </div>
          </div>
          ${afterTitle}`;
      }));

      processedSections.push(...batchResults);

      // Add a small delay between batches to prevent rate limiting
      if (i + BATCH_SIZE < sections.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const processedContent = processedSections.join('<hr class="my-8">');
    console.log('Processing complete:', {
      contentLength: processedContent.length,
      affiliateLinks: affiliateLinks.length,
      amazonLookups,
      reviewsAdded,
      productSections,
      successfulReplacements
    });

    return new Response(
      JSON.stringify({
        content: processedContent,
        affiliateLinks,
        stats: {
          amazonLookups,
          reviewsAdded,
          productSections,
          successfulReplacements
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