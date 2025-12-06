export const validateProductPrice = (price?: number): boolean => {
  if (!price || price <= 0) {
    console.log('Invalid price:', price);
    return false;
  }

  return true;
};