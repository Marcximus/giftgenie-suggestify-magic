export const generateAltText = (title: string) => title;

export const generateProductAltText = (productName: string, category?: string) => {
  if (category) {
    return `${productName} - ${category}`;
  }
  return productName;
};
