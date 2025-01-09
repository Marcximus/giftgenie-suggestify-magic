interface ProductImageProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export const ProductImage = ({ title, imageUrl }: ProductImageProps) => {
  return (
    <div className="aspect-[4/3] relative overflow-hidden">
      <img
        src={imageUrl || 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80'}
        alt={title}
        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};