import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge/dist/bundle-mjs"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}