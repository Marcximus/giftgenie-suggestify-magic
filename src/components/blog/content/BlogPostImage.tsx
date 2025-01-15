interface BlogPostImageProps {
  imageUrl: string;
  title: string;
}

export const BlogPostImage = ({ imageUrl, title }: BlogPostImageProps) => {
  const styledImageClass = "w-full max-w-xl h-auto object-contain rounded-lg shadow-md mx-auto my-4";
  return `<img src="${imageUrl}" alt="${title}" class="${styledImageClass}" />`;
};