import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatSEK } from '../utils/currency'

interface ClothingItem {
  id: string
  name: string
  category: string
  subcategory?: string
  brand?: string
  color?: string
  pattern?: string
  material?: string
  purchase_date?: string
  purchase_price?: number
  purchase_location?: string
  second_hand: boolean
  dog_wear: boolean
  times_worn: number
  last_worn_date?: string
  image_urls?: string[]
  notes?: string
  created_at: string
  updated_at: string
}

interface ItemListProps {
  onItemPress: (item: ClothingItem) => void
}

const categoryDisplayNames = {
  'tops': 'Tops',
  'bottoms': 'Bottoms', 
  'dresses_jumpsuits': 'Dresses & Jumpsuits',
  'shoes': 'Shoes',
  'accessories': 'Accessories',
  'outerwear': 'Outerwear',
  'underwear': 'Underwear',
  'sleepwear': 'Sleepwear',
  'activewear': 'Activewear',
}

const categoryIcons = {
  'tops': '👕',
  'bottoms': '👖', 
  'dresses_jumpsuits': '👗',
  'shoes': '👟',
  'accessories': '👒',
  'outerwear': '🧥',
  'underwear': '🩲',
  'sleepwear': '🩱',
  'activewear': '🏃‍♀️',
}

export default function ItemList({ onItemPress }: ItemListProps) {
  const { user } = useAuth()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchItems()
    }
  }, [user])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching items:', error)
        return
      }

      setItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchItems()
    setRefreshing(false)
  }

  const renderItem = ({ item }: { item: ClothingItem }) => {
    const primaryImage = item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null
    const categoryIcon = categoryIcons[item.category as keyof typeof categoryIcons] || '👕'
    const categoryName = categoryDisplayNames[item.category as keyof typeof categoryDisplayNames] || item.category
    
    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => onItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <Image 
              source={{ uri: primaryImage }} 
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            </View>
          )}
          
          {/* Times worn badge */}
          {item.times_worn > 0 && (
            <View style={styles.wornBadge}>
              <Text style={styles.wornText}>{item.times_worn}×</Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.itemCategory}>{categoryName}</Text>
          {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
          {item.purchase_price && (
            <Text style={styles.itemPrice}>{formatSEK(item.purchase_price)}</Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your wardrobe...</Text>
      </View>
    )
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>👗</Text>
        <Text style={styles.emptyTitle}>No items yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first clothing item to get started!
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.listContainer}
      columnWrapperStyle={styles.row}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  listContainer: {
    padding: Spacing.md,
  },
  
  row: {
    justifyContent: 'space-between',
  },
  
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    width: '48%',
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  
  itemImage: {
    width: '100%',
    height: '100%',
  },
  
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  
  categoryIcon: {
    fontSize: 40,
  },
  
  wornBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  
  wornText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },
  
  itemInfo: {
    padding: Spacing.md,
  },
  
  itemName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  
  itemCategory: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  
  itemBrand: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
})
