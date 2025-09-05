/**
 * Currency formatting utilities for Swedish Krona (SEK)
 */

/**
 * Format a number as Swedish Krona currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatSEK = (
  amount: number,
  options: {
    showDecimals?: boolean
    compact?: boolean
  } = {}
): string => {
  const { showDecimals = false, compact = false } = options

  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 kr'
  }

  // Use Swedish locale for proper formatting
  const formatter = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
    notation: compact ? 'compact' : 'standard',
  })

  return formatter.format(amount)
}

/**
 * Format amount in compact form (e.g., 1.2k kr, 1.5M kr)
 */
export const formatSEKCompact = (amount: number): string => {
  return formatSEK(amount, { compact: true })
}

/**
 * Format amount with decimals
 */
export const formatSEKWithDecimals = (amount: number): string => {
  return formatSEK(amount, { showDecimals: true })
}

/**
 * Parse a currency string back to number (remove currency symbols and parse)
 */
export const parseSEK = (currencyString: string): number => {
  // Remove currency symbols and spaces, replace Swedish decimal separator
  const cleanString = currencyString
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.')
  
  const parsed = parseFloat(cleanString)
  return isNaN(parsed) ? 0 : parsed
}
