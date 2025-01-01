import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductImageProps {
  title: string;
  description: string;
}

// Queue to manage API requests with increased concurrency
const MAX_CONCURRENT_REQUESTS = 3;
const requestQueue: (() => Promise<void>)[] = [];
let activeRequests = 0;

const processQueue = async () => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) return;
  
  activeRequests++;
  try {
    const request = requestQueue.shift();
    if (request) {
      await request();
      // Reduced wait time between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } finally {
    activeRequests--;
    if (requestQueue.length > 0) {
      processQueue();
    }
  }
};

export const ProductImage = ({ title, description }: ProductImageProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [isQueued, setIsQueued] = useState(false);

  const cleanSearchTerm = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\b(the|with|for|and|or|in|on|at|to|of|from|by)\b/gi, '')
      .replace(/\d+(\.\d+)?(\s*)(inch|"|inches|ft|feet|mm|cm|m|gb|tb|mb|hz|watts)/gi, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/[^\w\s]/g, ' ')
      .trim();
  };

  const fetchGoogleImage = async (searchTerm: string) => {
    try {
      console.log('Searching Google Images for:', searchTerm);
      
      const { data, error } = await supabase.functions.invoke('get-google-image', {
        body: { searchTerm }
      });

      if (error) {
        if (error.status === 429) {
          if (!isQueued) {
            return new Promise<string>((resolve) => {
              setIsQueued(true);
              requestQueue.push(async () => {
                const result = await fetchGoogleImage(searchTerm);
                resolve(result);
                setIsQueued(false);
              });
              processQueue();
            });
          }
          return 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80';
        }
        throw error;
      }

      if (!data?.imageUrl) throw new Error('No image URL returned');
      return data.imageUrl;
      
    } catch (error) {
      console.error('Error fetching Google image:', error);
      setImageError(true);
      return 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80';
    }
  };

  useEffect(() => {
    const getImage = async () => {
      const cleanedTitle = cleanSearchTerm(title);
      console.log('Searching with full cleaned title:', cleanedTitle);
      
      let url = await fetchGoogleImage(cleanedTitle);
      
      if (!url || imageError) {
        const words = cleanedTitle.split(' ');
        const shortTitle = words.slice(0, 3).join(' ');
        console.log('Fallback search term:', shortTitle);
        url = await fetchGoogleImage(shortTitle);
      }
      
      setImageUrl(url);
    };

    getImage();
  }, [title, description]);

  return (
    <div className="aspect-[4/3] relative overflow-hidden">
      <img
        src={imageUrl}
        alt={title}
        className={`object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ${isQueued ? 'opacity-50' : ''}`}
        loading="lazy"
        onError={() => setImageError(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {isQueued && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};