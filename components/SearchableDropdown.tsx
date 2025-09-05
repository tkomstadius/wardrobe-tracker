import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native'
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants'

interface SearchableDropdownProps {
  value: string
  onChangeText: (text: string) => void
  suggestions: string[]
  placeholder?: string
  label?: string
  maxSuggestions?: number
}

const { width: screenWidth } = Dimensions.get('window')

export default function SearchableDropdown({
  value,
  onChangeText,
  suggestions,
  placeholder = 'Type to search...',
  label,
  maxSuggestions = 8
}: SearchableDropdownProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions
        .filter(suggestion => 
          suggestion.toLowerCase().includes(value.toLowerCase()) &&
          suggestion.toLowerCase() !== value.toLowerCase()
        )
        .slice(0, maxSuggestions)
      
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0 && inputFocused)
    } else {
      setFilteredSuggestions([])
      setShowSuggestions(false)
    }
  }, [value, suggestions, inputFocused, maxSuggestions])

  const handleInputChange = (text: string) => {
    onChangeText(text)
  }

  const handleSuggestionSelect = (suggestion: string) => {
    onChangeText(suggestion)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleFocus = () => {
    setInputFocused(true)
    if (value && filteredSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow for suggestion selection
    setTimeout(() => {
      setInputFocused(false)
      setShowSuggestions(false)
    }, 150)
  }

  const renderSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            showSuggestions && styles.textInputWithSuggestions
          ]}
          value={value}
          onChangeText={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="words"
          autoCorrect={false}
        />
        
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={filteredSuggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item, index) => `${item}-${index}`}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    zIndex: 1000,
  },
  
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  
  inputContainer: {
    position: 'relative',
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
  
  textInputWithSuggestions: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: 'transparent',
  },
  
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.border,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    maxHeight: 200,
    zIndex: 1000,
    ...Shadow.md,
  },
  
  suggestionsList: {
    flex: 1,
  },
  
  suggestionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  
  suggestionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
})
