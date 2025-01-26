import { clsx, type ClassValue } from "clsx"
import { twMerge as twMergeOriginal } from "tailwind-merge/dist/bundle-esm.mjs"

export function cn(...inputs: ClassValue[]) {
  return twMergeOriginal(clsx(inputs))
}