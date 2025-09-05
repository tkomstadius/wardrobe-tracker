import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native'
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatSEK } from '../utils/currency'
import ClothingImagePicker from './ImagePicker'
import { uploadMultipleImages } from '../utils/imageUpload'
import SearchableDropdown from './SearchableDropdown'
import { getSuggestions, addToSuggestionsCache, SuggestionsData } from '../utils/suggestions'

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

interface ItemDetailProps {
  item: ClothingItem
  onClose: () => void
  onItemUpdated: (updatedItem: ClothingItem) => void
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

const { width: screenWidth } = Dimensions.get('window')

export default function ItemDetail({ item, onClose, onItemUpdated }: ItemDetailProps) {
  const { user } = useAuth()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionsData>({ brands: [], subcategories: [] })
  
  // Edit form state
  const [editedItem, setEditedItem] = useState({
    name: item.name,
    brand: item.brand || '',
    subcategory: item.subcategory || '',
    color: item.color || '',
    pattern: item.pattern || '',
    material: item.material || '',
    purchase_location: item.purchase_location || '',
    notes: item.notes || '',
    image_urls: item.image_urls || []
  })
  
  // Load suggestions when entering edit mode
  useEffect(() => {
    if (isEditing && user) {
      loadSuggestions()
    }
  }, [isEditing, user])
  
  const loadSuggestions = async () => {
    if (!user) return
    
    try {
      const suggestionsData = await getSuggestions(user.id)
      setSuggestions(suggestionsData)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const categoryName = categoryDisplayNames[item.category as keyof typeof categoryDisplayNames] || item.category
  const costPerWear = item.purchase_price && item.times_worn > 0 
    ? item.purchase_price / item.times_worn 
    : null

  const handleAddWear = async () => {
    if (!user) return
    
    setIsLoading(true)
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

      // Update the local item
      const updatedItem = {
        ...item,
        times_worn: item.times_worn + 1,
        last_worn_date: new Date().toISOString().split('T')[0]
      }
      
      onItemUpdated(updatedItem)
      Alert.alert('Success', 'Wear added successfully!')
      
    } catch (error) {
      console.error('Error adding wear:', error)
      Alert.alert('Error', 'Failed to add wear. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!user) return
    
    // Validation
    if (!editedItem.name.trim()) {
      Alert.alert('Error', 'Item name is required')
      return
    }
    
    setIsSaving(true)
    try {
      // Handle image uploads if there are new images
      let finalImageUrls = editedItem.image_urls
      
      // Check if there are any local images (file:// URLs) that need uploading
      const localImages = editedItem.image_urls.filter(url => url.startsWith('file://'))
      if (localImages.length > 0) {
        const uploadResults = await uploadMultipleImages(localImages, user.id)
        const failedUploads = uploadResults.filter(result => !result.success)
        
        if (failedUploads.length > 0) {
          Alert.alert(
            'Upload Error',
            `Failed to upload ${failedUploads.length} image(s). Continue saving anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Continue', 
                onPress: () => proceedWithSave(editedItem.image_urls.filter(url => !url.startsWith('file://')))
              }
            ]
          )
          return
        }
        
        // Replace local URLs with uploaded URLs
        finalImageUrls = editedItem.image_urls.map(url => {
          if (url.startsWith('file://')) {
            const uploadResult = uploadResults.find(result => result.success)
            return uploadResult?.url || url
          }
          return url
        })
      }
      
      await proceedWithSave(finalImageUrls)
      
    } catch (error) {
      console.error('Error saving item:', error)
      Alert.alert('Error', 'Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }
  
  const proceedWithSave = async (imageUrls: string[]) => {
    const updateData = {
      name: editedItem.name.trim(),
      brand: editedItem.brand.trim() || null,
      subcategory: editedItem.subcategory.trim() || null,
      color: editedItem.color.trim() || null,
      pattern: editedItem.pattern.trim() || null,
      material: editedItem.material.trim() || null,
      purchase_location: editedItem.purchase_location.trim() || null,
      notes: editedItem.notes.trim() || null,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
    }
    
    const { data, error } = await supabase
      .from('clothing_items')
      .update(updateData)
      .eq('id', item.id)
      .select()
    
    if (error) {
      console.error('Error updating item:', error)
      Alert.alert('Error', 'Failed to save changes. Please try again.')
      return
    }
    
    if (data && data[0]) {
      // Add new values to suggestions cache for better UX
      if (editedItem.brand.trim()) {
        addToSuggestionsCache('brand', editedItem.brand.trim())
      }
      if (editedItem.subcategory.trim()) {
        addToSuggestionsCache('subcategory', editedItem.subcategory.trim())
      }
      
      // Update local suggestions state
      setSuggestions(prev => {
        const newBrands = editedItem.brand.trim() && !prev.brands.includes(editedItem.brand.trim())
          ? [...prev.brands, editedItem.brand.trim()].sort()
          : prev.brands
          
        const newSubcategories = editedItem.subcategory.trim() && !prev.subcategories.includes(editedItem.subcategory.trim())
          ? [...prev.subcategories, editedItem.subcategory.trim()].sort()
          : prev.subcategories
          
        return {
          brands: newBrands,
          subcategories: newSubcategories
        }
      })
      
      const updatedItem = { ...item, ...data[0] }
      onItemUpdated(updatedItem)
      setIsEditing(false)
      Alert.alert('Success', 'Item updated successfully!')
    }
  }
  
  const handleCancelEdit = () => {
    // Reset form to original values
    setEditedItem({
      name: item.name,
      brand: item.brand || '',
      subcategory: item.subcategory || '',
      color: item.color || '',
      pattern: item.pattern || '',
      material: item.material || '',
      purchase_location: item.purchase_location || '',
      notes: item.notes || '',
      image_urls: item.image_urls || []
    })
    setIsEditing(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE') // Swedish date format
  }

  const renderImageViewer = () => {
    if (!item.image_urls || item.image_urls.length === 0) {
      return (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>No images</Text>
        </View>
      )
    }

    return (
      <View style={styles.imageSection}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
            setCurrentImageIndex(index)
          }}
        >
          {item.image_urls.map((imageUrl, index) => (
            <Image
              key={index}
              source={{ uri: imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {item.image_urls.length > 1 && (
          <View style={styles.imageIndicators}>
            {item.image_urls.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {isEditing ? (
            <TouchableOpacity onPress={handleCancelEdit} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Item' : item.name}
          </Text>
          
          {isEditing ? (
            <TouchableOpacity 
              onPress={handleSaveEdit} 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.textInverse} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isEditing ? (
            // Edit Mode
            <View>
              {/* Image Editing */}
              <View style={styles.section}>
                <ClothingImagePicker
                  images={editedItem.image_urls}
                  onImagesChange={(images) => setEditedItem({...editedItem, image_urls: images})}
                  maxImages={3}
                />
              </View>
              
              {/* Editable Fields */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Item Details</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editedItem.name}
                    onChangeText={(text) => setEditedItem({...editedItem, name: text})}
                    placeholder="Item name"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <SearchableDropdown
                    value={editedItem.brand}
                    onChangeText={(text) => setEditedItem({...editedItem, brand: text})}
                    suggestions={suggestions.brands}
                    placeholder="Brand name"
                    label="Brand"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <SearchableDropdown
                    value={editedItem.subcategory}
                    onChangeText={(text) => setEditedItem({...editedItem, subcategory: text})}
                    suggestions={suggestions.subcategories}
                    placeholder="e.g., blouse, jeans, sneakers"
                    label="Subcategory"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Color</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editedItem.color}
                    onChangeText={(text) => setEditedItem({...editedItem, color: text})}
                    placeholder="Item color"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Material</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editedItem.material}
                    onChangeText={(text) => setEditedItem({...editedItem, material: text})}
                    placeholder="e.g., cotton, polyester, wool"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Pattern</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editedItem.pattern}
                    onChangeText={(text) => setEditedItem({...editedItem, pattern: text})}
                    placeholder="e.g., solid, stripes, floral"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Purchase Location</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editedItem.purchase_location}
                    onChangeText={(text) => setEditedItem({...editedItem, purchase_location: text})}
                    placeholder="Where you bought it"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={editedItem.notes}
                    onChangeText={(text) => setEditedItem({...editedItem, notes: text})}
                    placeholder="Any additional notes"
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </View>
          ) : (
            // View Mode
            <View>
              {/* Image Section */}
              {renderImageViewer()}

              {/* Main Info */}
              <View style={styles.section}>
                <View style={styles.titleRow}>
                  <View style={styles.titleInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{categoryName}</Text>
                    {item.subcategory && (
                      <Text style={styles.itemSubcategory}>{item.subcategory}</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.addWearButton}
                    onPress={handleAddWear}
                    disabled={isLoading}
                  >
                    <Text style={styles.addWearButtonText}>
                      {isLoading ? '...' : '+ Wear'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stats Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Usage Stats</Text>
                <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{item.times_worn}</Text>
                <Text style={styles.statLabel}>Times Worn</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{formatDate(item.last_worn_date)}</Text>
                <Text style={styles.statLabel}>Last Worn</Text>
              </View>
              {costPerWear && (
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{formatSEK(costPerWear, { showDecimals: true })}</Text>
                  <Text style={styles.statLabel}>Cost per Wear</Text>
                </View>
              )}
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsGrid}>
              {item.brand && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Brand</Text>
                  <Text style={styles.detailValue}>{item.brand}</Text>
                </View>
              )}
              {item.color && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Color</Text>
                  <Text style={styles.detailValue}>{item.color}</Text>
                </View>
              )}
              {item.pattern && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pattern</Text>
                  <Text style={styles.detailValue}>{item.pattern}</Text>
                </View>
              )}
              {item.material && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Material</Text>
                  <Text style={styles.detailValue}>{item.material}</Text>
                </View>
              )}
              {item.purchase_price && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Purchase Price</Text>
                  <Text style={styles.detailValue}>{formatSEK(item.purchase_price)}</Text>
                </View>
              )}
              {item.purchase_date && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Purchase Date</Text>
                  <Text style={styles.detailValue}>{formatDate(item.purchase_date)}</Text>
                </View>
              )}
              {item.purchase_location && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Purchase Location</Text>
                  <Text style={styles.detailValue}>{item.purchase_location}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Tags Section */}
          {(item.second_hand || item.dog_wear) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsRow}>
                {item.second_hand && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>♻️ Second Hand</Text>
                  </View>
                )}
                {item.dog_wear && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>🐕 Dog Wear</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Notes Section */}
              {item.notes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  closeButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  
  editButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  
  editButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverse,
  },
  
  saveButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  saveButtonDisabled: {
    opacity: 0.7,
  },
  
  saveButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverse,
  },
  
  formGroup: {
    marginBottom: Spacing.md,
  },
  
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  
  headerSpacer: {
    width: 32,
  },
  
  content: {
    flex: 1,
  },
  
  imageSection: {
    position: 'relative',
  },
  
  itemImage: {
    width: screenWidth,
    height: screenWidth,
  },
  
  noImageContainer: {
    width: screenWidth,
    height: screenWidth * 0.6,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  noImageText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textTertiary,
  },
  
  imageIndicators: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    opacity: 0.5,
    marginHorizontal: 4,
  },
  
  activeIndicator: {
    backgroundColor: Colors.primary,
    opacity: 1,
  },
  
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  titleInfo: {
    flex: 1,
  },
  
  itemName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  
  itemCategory: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  
  itemSubcategory: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  
  addWearButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  
  addWearButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverse,
  },
  
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textAccent,
    marginBottom: Spacing.md,
  },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  
  statNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  detailsGrid: {
    gap: Spacing.sm,
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  
  detailValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    flex: 2,
    textAlign: 'right',
  },
  
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  
  tag: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  tagText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  
  notesText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
})
