import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

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
    const searchFailures = [];

    for (const section of sections) {
      if (section.includes('<h3>')) {
        try {
          const titleMatch = section.match(/<h3>(.*?)<\/h3>/);
          if (titleMatch) {
            const searchTerm = titleMatch[1];
            console.log('Processing product section:', searchTerm);
            
            const searchUrl = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchTerm)}&country=US&category_id=aps`;
            const searchResponse = await fetch(searchUrl, {
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': RAPIDAPI_HOST,
              }
            });

            if (!searchResponse.ok) {
              console.error('Amazon API error:', searchResponse.status);
              searchFailures.push({
                term: searchTerm,
                error: `API error: ${searchResponse.status}`,
                timestamp: new Date().toISOString()
              });
              processedSections.push(section);
              continue;
            }

            const searchData = await searchResponse.json();
            const product = searchData.data?.products?.[0];

            if (!product?.asin || !product?.product_photo) {
              console.warn('Invalid product data for:', searchTerm);
              searchFailures.push({
                term: searchTerm,
                error: 'Missing required product data',
                timestamp: new Date().toISOString()
              });
              processedSections.push(section);
              continue;
            }

            // Validate ASIN format
            if (!/^[A-Z0-9]{10}$/.test(product.asin)) {
              console.warn('Invalid ASIN format:', product.asin);
              searchFailures.push({
                term: searchTerm,
                error: 'Invalid ASIN format',
                timestamp: new Date().toISOString()
              });
              processedSections.push(section);
              continue;
            }

            // Get detailed product information
            const detailsUrl = `https://${RAPIDAPI_HOST}/product-details?asin=${product.asin}&country=US`;
            const detailsResponse = await fetch(detailsUrl, {
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': RAPIDAPI_HOST,
              }
            });

            if (!detailsResponse.ok) {
              console.warn('Failed to get product details:', detailsResponse.status);
              searchFailures.push({
                term: searchTerm,
                error: `Details API error: ${detailsResponse.status}`,
                timestamp: new Date().toISOString()
              });
              processedSections.push(section);
              continue;
            }

            const detailsData = await detailsResponse.json();
            console.log('Product details:', detailsData);

            // Create affiliate link with validated ASIN
            const affiliateLink = `https://www.amazon.com/dp/${product.asin}?tag=${associateId}`;
            
            // Validate the affiliate link structure
            const linkData = {
              title: product.title,
              url: affiliateLink,
              asin: product.asin
            };

            // Only add valid affiliate links
            const { data: isValid } = await supabase.rpc('validate_affiliate_link', {
              link: linkData
            });

            if (isValid) {
              affiliateLinks.push(linkData);
              
              const [beforeTitle, afterTitle] = section.split('</h3>');
              const productHtml = `${beforeTitle}</h3>
                <div class="flex flex-col items-center my-8">
                  <div class="w-full max-w-2xl mb-4">
                    <img 
                      src="${product.product_photo}" 
                      alt="${product.title}"
                      class="w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] object-contain rounded-lg shadow-md mx-auto" 
                      loading="lazy"
                    />
                  </div>
                  ${product.product_star_rating ? `
                    <div class="flex items-center gap-2 mb-4">
                      <div class="flex">
                        ${Array.from({ length: 5 }, (_, i) => 
                          `<span class="text-yellow-400">
                            ${i < Math.floor(parseFloat(product.product_star_rating)) ? '★' : '☆'}
                          </span>`
                        ).join('')}
                      </div>
                      <span class="font-medium">${parseFloat(product.product_star_rating).toFixed(1)}</span>
                      ${product.product_num_ratings ? `
                        <span class="text-gray-500">
                          (${parseInt(product.product_num_ratings).toLocaleString()})
                        </span>
                      ` : ''}
                    </div>
                  ` : ''}
                  <a 
                    href="${affiliateLink}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="inline-block px-6 py-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium rounded-md transition-colors text-sm text-center"
                  >
                    View on Amazon
                  </a>
                </div>
                ${afterTitle}`;

              processedSections.push(productHtml);
              console.log('Successfully processed product section');
            } else {
              console.warn('Invalid affiliate link structure');
              searchFailures.push({
                term: searchTerm,
                error: 'Invalid affiliate link structure',
                timestamp: new Date().toISOString()
              });
              processedSections.push(section);
            }
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