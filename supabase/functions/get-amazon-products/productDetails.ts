export const getProductDetails = async (
  asin: string,
  apiKey: string,
  rapidApiHost: string
) => {
  console.log('Fetching details for ASIN:', asin);
  
  const response = await fetch(`https://${rapidApiHost}/product-details`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': rapidApiHost,
      'Content-Type': 'application/json'
    },
    params: {
      asin: asin,
      country: 'US'
    }
  });

  if (!response.ok) {
    console.warn(`Failed to get product details for ASIN ${asin}, status: ${response.status}`);
    return null;
  }

  const detailsData = await response.json();
  console.log('Product details response:', {
    title: detailsData.data?.product_title,
    price: detailsData.data?.product_price,
    originalPrice: detailsData.data?.product_original_price
  });
  return detailsData;
};