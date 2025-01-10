interface ProductImageProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export const ProductImage = ({ title, imageUrl }: ProductImageProps) => {
  // Use a more relevant fallback image for products
  const fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

  return (
    <div className="aspect-[4/3] relative overflow-hidden">
      <img
        src={imageUrl || fallbackImage}
        alt={`Product image of ${title}`}
        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
        onError={(e) => {
          // If the Amazon image fails to load, fall back to the default image
          const target = e.target as HTMLImageElement;
          if (target.src !== fallbackImage) {
            target.src = fallbackImage;
          }
        }}
      />
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
        aria-hidden="true"
      />
    </div>
  );
};