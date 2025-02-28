
import { createContext, useContext } from 'react';

// Maintain a global queue of images being loaded
export const loadingQueue = new Set<string>();
export const preloadQueue: string[] = [];
export const MAX_CONCURRENT_LOADS = 4;

interface ImageLoaderContextType {
  preloadImage: (url: string) => Promise<void>;
}

const ImageLoaderContext = createContext<ImageLoaderContextType | null>(null);

export const useImageLoader = () => {
  const context = useContext(ImageLoaderContext);
  if (!context) {
    throw new Error('useImageLoader must be used within an ImageLoaderProvider');
  }
  return context;
};

export const preloadImage = async (url: string): Promise<void> => {
  if (!url || loadingQueue.has(url)) return;
  
  try {
    loadingQueue.add(url);
    const img = new Image();
    img.src = url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
  } finally {
    loadingQueue.delete(url);
    // Load next image in queue if any
    const nextUrl = preloadQueue.shift();
    if (nextUrl) preloadImage(nextUrl);
  }
};

export const ImageLoaderProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <ImageLoaderContext.Provider value={{ preloadImage }}>
      {children}
    </ImageLoaderContext.Provider>
  );
};
