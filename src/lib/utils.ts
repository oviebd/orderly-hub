import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBusinessRootPath(businessName: string, email: string): string {
  const sanitizedBusinessName = businessName.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
  return `businesses/${sanitizedBusinessName}_${sanitizedEmail}`;
}
