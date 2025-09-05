import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native'
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface ClothingItem {
  id: string
  name: string
  category: string
  subcategory?: string
  brand?: string
  color?: string
  times_worn: number
  image_urls?: string[]
  last_worn_date?: string
}

interface QuickWearTrackerProps {
  onWearAdded?: () => void
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

export default function QuickWearTracker({ onWearAdded }: QuickWearTrackerProps) {
  const { user } = useAuth()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [addingWearFor, setAddingWearFor] = useState<string | null>(null)

  const categories = [
    { key: 'all', name: 'All Items', icon: '📁' },
    ...Object.entries(categoryDisplayNames).map(([key, name]) => ({
      key,
      name,
      icon: categoryIcons[key as keyof typeof categoryIcons]
    }))
  ]

  useEffect(() => {
    if (user) {
      fetchItems()
    }
  }, [user])

  useEffect(() => {
    filterItems()
  }, [items, searchQuery, selectedCategory])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('id, name, category, subcategory, brand, color, times_worn, image_urls, last_worn_date')
        .order('name', { ascending: true })

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

  const filterItems = () => {
    let filtered = items

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.brand && item.brand.toLowerCase().includes(query)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(query)) ||
        categoryDisplayNames[item.category as keyof typeof categoryDisplayNames]?.toLowerCase().includes(query)
      )
    }

    setFilteredItems(filtered)
  }

  const handleAddWear = async (item: ClothingItem) => {
    if (!user || addingWearFor === item.id) return
    
    setAddingWearFor(item.id)
    try {
      // Add a wear history entry
      const { error } = await supabase
        .from('wear_history')
        .insert({
          user_id: user.id,
          clothing_item_id: item.id,
          date_worn: new Date().toISOString().split('T')[0] // Today's date
        })

      if (error) {
        console.error('Error adding wear:', error)
        Alert.alert('Error', 'Failed to add wear. Please try again.')
        return
      }

      // Update local state
      const updatedItems = items.map(i => 
        i.id === item.id 
          ? { ...i, times_worn: i.times_worn + 1, last_worn_date: new Date().toISOString().split('T')[0] }
          : i
      )
      setItems(updatedItems)
      
      // Call callback to refresh overview stats
      onWearAdded?.()
      
    } catch (error) {
      console.error('Error adding wear:', error)
      Alert.alert('Error', 'Failed to add wear. Please try again.')
    } finally {
      setAddingWearFor(null)
    }
  }

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilterContainer}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={item => item.key}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item.key && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(item.key)}
          >
            <Text style={styles.categoryIcon}>{item.icon}</Text>
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === item.key && styles.categoryButtonTextActive
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  )

  const renderItem = ({ item }: { item: ClothingItem }) => {
    const primaryImage = item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null
    const categoryIcon = categoryIcons[item.category as keyof typeof categoryIcons] || '👕'
    const isAddingWear = addingWearFor === item.id
    
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemImageContainer}>
          {primaryImage ? (
            <Image 
              source={{ uri: primaryImage }} 
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderIcon}>{categoryIcon}</Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {item.brand && <Text style={styles.itemBrand} numberOfLines={1}>{item.brand}</Text>}
          <View style={styles.itemStats}>
            <Text style={styles.timesWorn}>{item.times_worn} wears</Text>
            {item.last_worn_date && (
              <Text style={styles.lastWorn}>
                Last: {new Date(item.last_worn_date).toLocaleDateString('sv-SE')}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addWearButton, isAddingWear && styles.addWearButtonLoading]}
          onPress={() => handleAddWear(item)}
          disabled={isAddingWear}
        >
          {isAddingWear ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Text style={styles.addWearButtonText}>+1</Text>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quick Wear Tracking</Text>
        <Text style={styles.subtitle}>Tap +1 to log wearing an item today</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCategory !== 'all' 
              ? 'No items match your search' 
              : 'No items found. Add some items first!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textAccent,
    marginBottom: Spacing.xs,
  },
  
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  
  searchContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  categoryFilterContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  
  categoryList: {
    paddingVertical: Spacing.sm,
  },
  
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  
  categoryIcon: {
    fontSize: Typography.fontSize.sm,
    marginRight: Spacing.xs,
  },
  
  categoryButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  
  categoryButtonTextActive: {
    color: Colors.textInverse,
  },
  
  listContainer: {
    padding: Spacing.lg,
  },
  
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  itemImageContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  
  itemImage: {
    width: '100%',
    height: '100%',
  },
  
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  placeholderIcon: {
    fontSize: 24,
  },
  
  itemInfo: {
    flex: 1,
  },
  
  itemName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  
  itemBrand: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  
  itemStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  timesWorn: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
    marginRight: Spacing.sm,
  },
  
  lastWorn: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
  },
  
  addWearButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  addWearButtonLoading: {
    opacity: 0.7,
  },
  
  addWearButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: Spacing.xl,
  },
  
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
})
