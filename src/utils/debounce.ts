// Define the type for a debounced function
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  // Create the debounced function
  function executedFunction(this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (options.trailing !== false && lastArgs) {
        func.apply(this, lastArgs);
        lastArgs = null;
      }
    };

    const callNow = options.leading && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(this, args);
      lastArgs = null;
    } else {
      lastArgs = args;
    }
  }

  // Add cancel method to the function
  executedFunction.cancel = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      lastArgs = null;
    }
  };

  return executedFunction;
}