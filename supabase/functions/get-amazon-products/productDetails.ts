
export const getProductDetails = async (
  asin: string,
  apiKey: string,
  rapidApiHost: string
) => {
  console.log('Fetching details for ASIN:', asin);
  
  const detailsResponse = await fetch(
    `https://${rapidApiHost}/product-details?asin=${asin}&country=US`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': rapidApiHost,
      }
    }
  );

  if (!detailsResponse.ok) {
    console.warn(`Failed to get product details for ASIN ${asin}, status: ${detailsResponse.status}`);
    return null;
  }

  const detailsData = await detailsResponse.json();
  console.log('Product details response:', {
    title: detailsData.data?.product_title,
    price: detailsData.data?.product_price,
    originalPrice: detailsData.data?.product_original_price,
    allFields: detailsData.data ? Object.keys(detailsData.data) : []
  });
  return detailsData;
};
