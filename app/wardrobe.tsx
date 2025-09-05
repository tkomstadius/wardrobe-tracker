import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Colors } from '../constants'
import ItemList from '../components/ItemList'
import ItemDetail from '../components/ItemDetail'

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

export default function Wardrobe() {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  const [items, setItems] = useState<ClothingItem[]>([])

  const handleItemPress = (item: ClothingItem) => {
    setSelectedItem(item)
  }

  const handleCloseDetail = () => {
    setSelectedItem(null)
  }

  const handleItemUpdated = (updatedItem: ClothingItem) => {
    // Update the item in the list
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    )
    
    // Update the selected item if it's the same
    setSelectedItem(updatedItem)
  }

  return (
    <View style={styles.container}>
      <ItemList onItemPress={handleItemPress} />
      
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={handleCloseDetail}
          onItemUpdated={handleItemUpdated}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
})
