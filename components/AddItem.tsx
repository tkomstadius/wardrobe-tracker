import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native'
import { router } from 'expo-router'
import { Colors, Spacing, Typography, BorderRadius, GlobalStyles } from '../constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ClothingImagePicker from './ImagePicker'
import { uploadMultipleImages } from '../utils/imageUpload'
import SearchableDropdown from './SearchableDropdown'
import { getSuggestions, addToSuggestionsCache, SuggestionsData } from '../utils/suggestions'

interface ClothingItem {
  name: string
  category: string
  subcategory: string
  brand: string
  color: string
  pattern: string
  material: string
  purchase_date: string
  purchase_price: string
  purchase_location: string
  second_hand: boolean
  dog_wear: boolean
  times_worn: string
  notes: string
  images: string[]
}

const categories = [
  { key: 'tops', name: 'Tops', icon: '👕' },
  { key: 'bottoms', name: 'Bottoms', icon: '👖' },
  { key: 'dresses_jumpsuits', name: 'Dresses & Jumpsuits', icon: '👗' },
  { key: 'shoes', name: 'Shoes', icon: '👟' },
  { key: 'accessories', name: 'Accessories', icon: '👒' },
  { key: 'outerwear', name: 'Outerwear', icon: '🧥' },
  { key: 'underwear', name: 'Underwear', icon: '🩲' },
  { key: 'sleepwear', name: 'Sleepwear', icon: '🩱' },
  { key: 'activewear', name: 'Activewear', icon: '🏃‍♀️' },
]

export default function AddItem() {
  const { user } = useAuth()
  const [item, setItem] = useState<ClothingItem>({
    name: '',
    category: '',
    subcategory: '',
    brand: '',
    color: '',
    pattern: '',
    material: '',
    purchase_date: '',
    purchase_price: '',
    purchase_location: '',
    second_hand: false,
    dog_wear: false,
    times_worn: '0',
    notes: '',
    images: [],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionsData>({ brands: [], subcategories: [] })
  
  // Load suggestions when component mounts
  useEffect(() => {
    if (user) {
      loadSuggestions()
    }
  }, [user])
  
  const loadSuggestions = async () => {
    if (!user) return
    
    try {
      const suggestionsData = await getSuggestions(user.id)
      setSuggestions(suggestionsData)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const handleSave = async () => {
    // Validate required fields
    if (!item.name.trim()) {
      Alert.alert('Error', 'Please enter an item name')
      return
    }

    if (!item.category) {
      Alert.alert('Error', 'Please select a category')
      return
    }

    setIsLoading(true)

    try {
      if (!user) {
        Alert.alert('Error', 'Please sign in to add items')
        return
      }

      // Upload images first if any
      let imageUrls: string[] = []
      if (item.images.length > 0) {
        const uploadResults = await uploadMultipleImages(item.images, user.id)
        
        // Check for upload failures
        const failedUploads = uploadResults.filter(result => !result.success)
        if (failedUploads.length > 0) {
          Alert.alert(
            'Upload Error',
            `Failed to upload ${failedUploads.length} image(s). Continue without images?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Continue', 
                onPress: () => {
                  // Get successful URLs only
                  imageUrls = uploadResults
                    .filter(result => result.success && result.url)
                    .map(result => result.url!)
                  proceedWithSave(imageUrls)
                }
              }
            ]
          )
          return
        }
        
        // All uploads successful
        imageUrls = uploadResults
          .filter(result => result.success && result.url)
          .map(result => result.url!)
      }
      
      await proceedWithSave(imageUrls)

    } catch (error) {
      console.error('Error saving item:', error)
      Alert.alert('Error', 'Failed to add item. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const proceedWithSave = async (imageUrls: string[]) => {
    try {
      // Prepare data for insertion
      const clothingItemData = {
        user_id: user!.id,
        name: item.name.trim(),
        category: item.category,
        subcategory: item.subcategory.trim() || null,
        brand: item.brand.trim() || null,
        color: item.color.trim() || null,
        pattern: item.pattern.trim() || null,
        material: item.material.trim() || null,
        purchase_date: item.purchase_date ? item.purchase_date : null,
        purchase_price: item.purchase_price ? parseFloat(item.purchase_price) : null,
        purchase_location: item.purchase_location.trim() || null,
        second_hand: item.second_hand,
        dog_wear: item.dog_wear,
        times_worn: parseInt(item.times_worn) || 0,
        notes: item.notes.trim() || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      }

      // Insert the clothing item
      const { data, error } = await supabase
        .from('clothing_items')
        .insert(clothingItemData)
        .select()

      if (error) {
        console.error('Error adding item:', error)
        Alert.alert('Error', 'Failed to add item. Please try again.')
        return
      }

      // If there's an initial times_worn count, add wear history entries
      const timesWorn = parseInt(item.times_worn) || 0
      if (timesWorn > 0 && data && data[0]) {
        // Add wear history entries without dates (just to track count)
        const wearHistoryEntries = Array(timesWorn).fill(null).map(() => ({
          user_id: user!.id,
          clothing_item_id: data[0].id,
          date_worn: null, // No specific date for initial count
        }))

        const { error: wearError } = await supabase
          .from('wear_history')
          .insert(wearHistoryEntries)

        if (wearError) {
          console.error('Error adding wear history:', wearError)
          // Don't fail the whole operation for this
        }
      }

      // Add new values to suggestions cache for better UX
      if (item.brand.trim()) {
        addToSuggestionsCache('brand', item.brand.trim())
      }
      if (item.subcategory.trim()) {
        addToSuggestionsCache('subcategory', item.subcategory.trim())
      }
      
      // Update local suggestions state
      setSuggestions(prev => {
        const newBrands = item.brand.trim() && !prev.brands.includes(item.brand.trim())
          ? [...prev.brands, item.brand.trim()].sort()
          : prev.brands
          
        const newSubcategories = item.subcategory.trim() && !prev.subcategories.includes(item.subcategory.trim())
          ? [...prev.subcategories, item.subcategory.trim()].sort()
          : prev.subcategories
          
        return {
          brands: newBrands,
          subcategories: newSubcategories
        }
      })

      Alert.alert('Success', 'Item added successfully!', [
        {
          text: 'Add Another',
          onPress: () => {
            // Reset form
            setItem({
              name: '',
              category: '',
              subcategory: '',
              brand: '',
              color: '',
              pattern: '',
              material: '',
              purchase_date: '',
              purchase_price: '',
              purchase_location: '',
              second_hand: false,
              dog_wear: false,
              times_worn: '0',
              notes: '',
              images: [],
            })
          }
        },
        {
          text: 'View Overview',
          onPress: () => router.push('/')
        },
        {
          text: 'Done',
          style: 'default'
        }
      ])
      
    } catch (error) {
      console.error('Error in proceedWithSave:', error)
      Alert.alert('Error', 'Failed to add item. Please try again.')
    }
  }

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category *</Text>
      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const isSelected = item.category === category.key
          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryButton,
                isSelected && styles.categoryButtonSelected,
                { backgroundColor: isSelected ? Colors.clothing[category.key as keyof typeof Colors.clothing] : Colors.surface }
              ]}
              onPress={() => setItem({ ...item, category: category.key })}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[
                styles.categoryText,
                { color: isSelected ? Colors.textInverse : Colors.textPrimary }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Item</Text>
        <Text style={styles.subtitle}>Add a clothing item to your wardrobe</Text>
      </View>

      {/* Item Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Item Name *</Text>
        <TextInput
          style={styles.input}
          value={item.name}
          onChangeText={(text) => setItem({ ...item, name: text })}
          placeholder="e.g., Blue Cotton T-Shirt"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Category */}
      {renderCategorySelector()}

      {/* Basic Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <SearchableDropdown
          value={item.subcategory}
          onChangeText={(text) => setItem({ ...item, subcategory: text })}
          suggestions={suggestions.subcategories}
          placeholder="Subcategory (e.g., blouse, jeans, sneakers)"
          label="Subcategory"
        />
        <SearchableDropdown
          value={item.brand}
          onChangeText={(text) => setItem({ ...item, brand: text })}
          suggestions={suggestions.brands}
          placeholder="Brand"
          label="Brand"
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={item.color}
            onChangeText={(text) => setItem({ ...item, color: text })}
            placeholder="Color"
            placeholderTextColor={Colors.textTertiary}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={item.pattern}
            onChangeText={(text) => setItem({ ...item, pattern: text })}
            placeholder="Pattern"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
        <TextInput
          style={styles.input}
          value={item.material}
          onChangeText={(text) => setItem({ ...item, material: text })}
          placeholder="Material (e.g., cotton, wool, polyester)"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Purchase Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Purchase Information</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={item.purchase_date}
            onChangeText={(text) => setItem({ ...item, purchase_date: text })}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor={Colors.textTertiary}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            value={item.purchase_price}
            onChangeText={(text) => setItem({ ...item, purchase_price: text })}
            placeholder="Price (SEK)"
            keyboardType="numeric"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
        <TextInput
          style={styles.input}
          value={item.purchase_location}
          onChangeText={(text) => setItem({ ...item, purchase_location: text })}
          placeholder="Where purchased"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Flags */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Options</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Second Hand</Text>
          <Switch
            value={item.second_hand}
            onValueChange={(value) => setItem({ ...item, second_hand: value })}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Dog Wear (suitable for dog walks)</Text>
          <Switch
            value={item.dog_wear}
            onValueChange={(value) => setItem({ ...item, dog_wear: value })}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Times Already Worn</Text>
          <TextInput
            style={[styles.input, styles.smallInput]}
            value={item.times_worn}
            onChangeText={(text) => setItem({ ...item, times_worn: text })}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      </View>

      {/* Images */}
      <View style={styles.section}>
        <ClothingImagePicker
          images={item.images}
          onImagesChange={(images) => setItem({ ...item, images })}
          maxImages={3}
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={item.notes}
          onChangeText={(text) => setItem({ ...item, notes: text })}
          placeholder="Any additional notes..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Save Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Adding...' : 'Add Item'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  header: {
    padding: Spacing.xl,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  
  title: {
    fontSize: Typography.fontSize.xxxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textAccent,
    marginBottom: Spacing.md,
  },
  
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  halfInput: {
    width: '48%',
  },
  
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  categoryButton: {
    width: '48%',
    aspectRatio: 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  categoryButtonSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  
  categoryIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  
  categoryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  
  switchLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  
  inputLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  
  smallInput: {
    width: 80,
    textAlign: 'center',
    marginBottom: 0,
  },
  
  buttonSection: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  
  saveButtonDisabled: {
    opacity: 0.6,
  },
  
  saveButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverse,
  },
})
