import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  const twMerge = extendTailwindMerge({})
  return twMerge(clsx(inputs))
}