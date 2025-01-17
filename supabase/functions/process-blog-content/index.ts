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
    console.log('RapidAPI Key available:', !!rapidApiKey);

    // Split content into sections
    const sections = content.split('<hr class="my-8">');
    console.log('Number of sections split from content:', sections.length);
    
    const processedSections = [];
    const affiliateLinks = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(`Processing section ${i + 1}/${sections.length}`);
      
      if (section.includes('<h3>')) {
        try {
          const titleMatch = section.match(/<h3>(.*?)<\/h3>/);
          if (titleMatch) {
            const searchTerm = titleMatch[1];
            console.log('Found product title:', searchTerm);
            
            // Direct Amazon API call
            console.log('Making direct Amazon API request for:', searchTerm);
            const searchUrl = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchTerm)}&country=US&category_id=aps`;
            
            const searchResponse = await fetch(searchUrl, {
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': RAPIDAPI_HOST,
              }
            });

            console.log('Amazon API response status:', searchResponse.status);

            if (!searchResponse.ok) {
              const responseText = await searchResponse.text();
              console.error('Amazon API error:', {
                status: searchResponse.status,
                statusText: searchResponse.statusText,
                body: responseText
              });
              processedSections.push(section);
              continue;
            }

            const searchData = await searchResponse.json();
            console.log('Amazon API response:', searchData);

            if (searchData.data?.products?.[0]) {
              const product = searchData.data.products[0];
              console.log('Processing product:', {
                title: product.title,
                hasImage: !!product.product_photo,
                hasAsin: !!product.asin
              });

              if (!product.asin || !product.product_photo) {
                console.warn('Product missing required data:', {
                  hasAsin: !!product.asin,
                  hasImage: !!product.product_photo
                });
                processedSections.push(section);
                continue;
              }

              const affiliateLink = `https://www.amazon.com/dp/${product.asin}?tag=${associateId}`;
              affiliateLinks.push({
                title: product.title,
                url: affiliateLink,
                asin: product.asin
              });

              // Format product HTML with image and affiliate link
              const [beforeTitle, afterTitle] = section.split('</h3>');

              const productHtml = `${beforeTitle}</h3>
                <div class="flex flex-col items-center my-8">
                  <div class="relative w-full max-w-2xl mb-6">
                    <img 
                      src="${product.product_photo}" 
                      alt="${titleMatch[1]}"
                      class="w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] object-contain rounded-lg shadow-md mx-auto" 
                      loading="lazy"
                    />
                  </div>
                  <div class="product-actions">
                    <a 
                      href="${affiliateLink}" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="amazon-button"
                    >
                      View on Amazon
                    </a>
                    ${product.product_star_rating ? `
                      <div class="flex items-center gap-2">
                        ${Array.from({ length: 5 }, (_, i) => 
                          `<span class="text-yellow-400">
                            ${i < Math.floor(parseFloat(product.product_star_rating)) ? '★' : '☆'}
                          </span>`
                        ).join('')}
                        <span class="font-medium ml-1">${parseFloat(product.product_star_rating).toFixed(1)}</span>
                        ${product.product_num_ratings ? `
                          <span class="text-gray-500">
                            (${parseInt(product.product_num_ratings).toLocaleString()})
                          </span>
                        ` : ''}
                      </div>
                    ` : ''}
                  </div>
                </div>${afterTitle}`;

              processedSections.push(productHtml);
              console.log('Successfully processed product section');
            } else {
              console.warn('No product found for:', searchTerm);
              processedSections.push(section);
            }
          } else {
            console.log('No product title found in section');
            processedSections.push(section);
          }
        } catch (error) {
          console.error('Error processing product section:', error);
          processedSections.push(section);
        }
      } else {
        console.log('Section does not contain product title');
        processedSections.push(section);
      }
    }

    const processedContent = processedSections.join('<hr class="my-8">');
    console.log('Processed content length:', processedContent.length);
    console.log('Number of affiliate links:', affiliateLinks.length);

    return new Response(
      JSON.stringify({
        content: processedContent,
        affiliateLinks
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
