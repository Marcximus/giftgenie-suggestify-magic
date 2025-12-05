export const formatDescription = (desc: string) => desc;
export const getDescriptionFromCache = (id: string) => null;

export const generateCustomDescription = (productName: string, features?: string[]) => {
  if (features && features.length > 0) {
    return `${productName}: ${features.join(', ')}`;
  }
  return productName;
};
