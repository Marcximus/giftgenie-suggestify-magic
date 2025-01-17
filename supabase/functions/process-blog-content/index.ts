import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

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
            
            // Search for Amazon product
            const { data: productData, error: productError } = await supabase.functions.invoke('get-amazon-products', {
              body: { searchTerm }
            });

            if (productError) {
              console.error('Error searching product:', productError);
              processedSections.push(section);
              continue;
            }

            console.log('Product search result:', productData?.product ? 'Found' : 'Not found');

            if (productData?.product) {
              const product = productData.product;
              console.log('Processing product:', {
                title: product.title,
                hasImage: !!product.imageUrl,
                hasAsin: !!product.asin
              });
              
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
                      src="${product.imageUrl}" 
                      alt="${titleMatch[1]}"
                      class="w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] object-contain rounded-lg shadow-md mx-auto" 
                      loading="lazy"
                    />
                  </div>
                  ${product.rating ? `
                    <div class="flex flex-col items-center gap-2 my-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
                      <div class="flex items-center gap-2">
                        ${Array.from({ length: 5 }, (_, i) => 
                          `<span class="text-yellow-400 text-xl">
                            ${i < Math.floor(product.rating) ? '★' : (i < product.rating ? '★' : '☆')}
                          </span>`
                        ).join('')}
                        <span class="font-semibold text-xl text-gray-800">${product.rating.toFixed(1)}</span>
                      </div>
                      ${product.totalRatings ? `
                        <div class="text-base text-gray-600">
                          Based on ${product.totalRatings.toLocaleString()} verified customer reviews
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                  <div class="mt-4 mb-8">
                    <a 
                      href="${affiliateLink}" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="amazon-button"
                    >
                      View on Amazon
                    </a>
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