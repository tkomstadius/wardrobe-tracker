import { supabase } from '../lib/supabase'

export interface SuggestionsData {
  brands: string[]
  subcategories: string[]
}

// Cache for suggestions to avoid repeated queries
let suggestionsCache: SuggestionsData | null = null
let lastCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getSuggestions(userId: string, forceRefresh = false): Promise<SuggestionsData> {
  const now = Date.now()
  
  // Return cached data if it's fresh and we're not forcing a refresh
  if (!forceRefresh && suggestionsCache && (now - lastCacheTime) < CACHE_DURATION) {
    return suggestionsCache
  }
  
  try {
    // Fetch all items for the user to extract unique values
    const { data: items, error } = await supabase
      .from('clothing_items')
      .select('brand, subcategory')
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error fetching suggestions:', error)
      return { brands: [], subcategories: [] }
    }
    
    if (!items || items.length === 0) {
      const emptySuggestions = { brands: [], subcategories: [] }
      suggestionsCache = emptySuggestions
      lastCacheTime = now
      return emptySuggestions
    }
    
    // Extract unique brands (filter out null/empty values)
    const brands = Array.from(new Set(
      items
        .map(item => item.brand)
        .filter((brand): brand is string => 
          Boolean(brand && brand.trim())
        )
        .map(brand => brand.trim())
    )).sort()
    
    // Extract unique subcategories (filter out null/empty values)
    const subcategories = Array.from(new Set(
      items
        .map(item => item.subcategory)
        .filter((subcategory): subcategory is string => 
          Boolean(subcategory && subcategory.trim())
        )
        .map(subcategory => subcategory.trim())
    )).sort()
    
    const suggestions = { brands, subcategories }
    
    // Update cache
    suggestionsCache = suggestions
    lastCacheTime = now
    
    return suggestions
    
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return { brands: [], subcategories: [] }
  }
}

// Get only brands
export async function getBrandSuggestions(userId: string, forceRefresh = false): Promise<string[]> {
  const suggestions = await getSuggestions(userId, forceRefresh)
  return suggestions.brands
}

// Get only subcategories
export async function getSubcategorySuggestions(userId: string, forceRefresh = false): Promise<string[]> {
  const suggestions = await getSuggestions(userId, forceRefresh)
  return suggestions.subcategories
}

// Get subcategories for a specific category (if we want to be more specific in the future)
export async function getSubcategorySuggestionsForCategory(
  userId: string, 
  category: string, 
  forceRefresh = false
): Promise<string[]> {
  try {
    const { data: items, error } = await supabase
      .from('clothing_items')
      .select('subcategory')
      .eq('user_id', userId)
      .eq('category', category)
    
    if (error || !items) {
      console.error('Error fetching category-specific suggestions:', error)
      return []
    }
    
    const subcategories = Array.from(new Set(
      items
        .map(item => item.subcategory)
        .filter((subcategory): subcategory is string => 
          Boolean(subcategory && subcategory.trim())
        )
        .map(subcategory => subcategory.trim())
    )).sort()
    
    return subcategories
    
  } catch (error) {
    console.error('Error fetching category-specific suggestions:', error)
    return []
  }
}

// Clear the cache (useful when new items are added)
export function clearSuggestionsCache(): void {
  suggestionsCache = null
  lastCacheTime = 0
}

// Add a new value to the cache without refetching (for performance)
export function addToSuggestionsCache(type: 'brand' | 'subcategory', value: string): void {
  if (!suggestionsCache || !value.trim()) return
  
  const trimmedValue = value.trim()
  
  if (type === 'brand' && !suggestionsCache.brands.includes(trimmedValue)) {
    suggestionsCache.brands.push(trimmedValue)
    suggestionsCache.brands.sort()
  } else if (type === 'subcategory' && !suggestionsCache.subcategories.includes(trimmedValue)) {
    suggestionsCache.subcategories.push(trimmedValue)
    suggestionsCache.subcategories.sort()
  }
}
