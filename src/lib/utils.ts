import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function textDecoder(text: string) {
  return new TextDecoder().decode(new Uint8Array([...text].map(char => char.charCodeAt(0))));
};