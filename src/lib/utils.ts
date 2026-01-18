import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBusinessRootPath(businessName: string, email: string): string {
  // to ensure data is always under the unique immutable email key
  return `BusinessAccounts/${email}`;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${randomStr}`;
}
