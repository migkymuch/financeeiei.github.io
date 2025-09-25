import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'THB'): string {
  if (currency === 'THB') {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function parseNumberInput(value: string): number {
  // Handle Thai/English number formats and units
  const cleaned = value
    .replace(/[,\s]/g, '') // Remove commas and spaces
    .replace(/k$/i, '000') // Handle 'k' suffix (1.2k = 1200)
    .replace(/m$/i, '000000') // Handle 'm' suffix (1.2m = 1200000)
    .replace(/[^\d.-]/g, ''); // Remove non-numeric characters except decimal and minus
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

export function calculateBreakEven(fixedCosts: number, contributionMargin: number): number {
  if (contributionMargin <= 0) return Infinity;
  return fixedCosts / contributionMargin;
}

export function calculateSafetyMargin(actualSales: number, breakEvenSales: number): number {
  if (breakEvenSales <= 0) return 100;
  return ((actualSales - breakEvenSales) / actualSales) * 100;
}

export function downloadJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function downloadCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function validatePercentage(value: number, tolerance: number = 0.01): boolean {
  return Math.abs(value - 100) <= tolerance;
}

export function normalizePercentages(values: number[]): number[] {
  const total = values.reduce((sum, val) => sum + val, 0);
  if (total === 0) return values;
  return values.map(val => (val / total) * 100);
}

export function getMonthName(monthIndex: number, locale: string = 'th-TH'): string {
  const date = new Date(2024, monthIndex, 1);
  return date.toLocaleDateString(locale, { month: 'long' });
}

export function getCurrentMonth(): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[new Date().getMonth()];
}