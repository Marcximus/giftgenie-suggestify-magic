import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    console.log('Processing blog content, length:', content.length);

    // Get Amazon Associate ID
    const { data: associateData, error: associateError } = await supabase.functions.invoke('get-amazon-associate-id');
    if (associateError) throw associateError;
    const associateId = associateData.associateId;

    // Split content into sections
    const sections = content.split('<hr class="my-8">');
    const processedSections = [];
    const affiliateLinks = [];

    for (const section of sections) {
      if (section.includes('<h3>')) {
        try {
          const titleMatch = section.match(/<h3>(.*?)<\/h3>/);
          if (titleMatch) {
            const searchTerm = titleMatch[1];
            console.log('Searching for product:', searchTerm);
            
            // Search for Amazon product
            const { data: productData, error: productError } = await supabase.functions.invoke('get-amazon-products', {
              body: { searchTerm }
            });

            if (productError) {
              console.error('Error searching product:', productError);
              processedSections.push(section);
              continue;
            }

            const product = productData?.products?.[0];
            
            if (product) {
              const affiliateLink = `https://www.amazon.com/dp/${product.asin}?tag=${associateId}`;
              affiliateLinks.push({
                title: product.title,
                url: affiliateLink,
                asin: product.asin
              });
              
              // Format product HTML with image and affiliate link
              const productHtml = `
                <h3>${titleMatch[1]}</h3>
                <div class="flex flex-col items-center my-8">
                  <div class="relative w-full max-w-2xl mb-6">
                    <img 
                      src="${product.main_image}" 
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
                      ${product.ratings_total ? `
                        <div class="text-base text-gray-600">
                          Based on ${product.ratings_total.toLocaleString()} verified customer reviews
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                  <div class="mt-4">
                    <a 
                      href="${affiliateLink}" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="amazon-button"
                    >
                      View on Amazon
                    </a>
                  </div>
                </div>`;

              const processedSection = section.replace(
                /<h3>.*?<\/h3>/,
                productHtml
              );
              processedSections.push(processedSection);
            } else {
              console.warn('No product found for:', searchTerm);
              processedSections.push(section);
            }
          }
        } catch (error) {
          console.error('Error processing product section:', error);
          processedSections.push(section);
        }
      } else {
        processedSections.push(section);
      }
    }

    return new Response(
      JSON.stringify({
        content: processedSections.join('<hr class="my-8">'),
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