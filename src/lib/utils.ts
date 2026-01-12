import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBusinessRootPath(businessName: string, email: string): string {
  // businessName is kept as argument for compatibility but unused for path generation
  // to ensure data is always under the unique immutable email key
  return `BusinessAccounts/${email}`;
}
