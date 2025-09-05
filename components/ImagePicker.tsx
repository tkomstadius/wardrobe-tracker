import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
  Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants'

interface ImagePickerProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export default function ClothingImagePicker({ 
  images, 
  onImagesChange, 
  maxImages = 3 
}: ImagePickerProps) {

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to add images.'
      )
      return false
    }
    return true
  }

  const showImagePicker = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    const options = ['Take Photo', 'Choose from Library', 'Cancel']

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            takePhoto()
          } else if (buttonIndex === 1) {
            pickFromLibrary()
          }
        }
      )
    } else {
      // For Android, show an Alert
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickFromLibrary },
          { text: 'Cancel', style: 'cancel' },
        ]
      )
    }
  }

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri]
        onImagesChange(newImages)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: maxImages > 1 && images.length < maxImages,
        selectionLimit: maxImages - images.length,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImageUris = result.assets.map(asset => asset.uri)
        const newImages = [...images, ...newImageUris].slice(0, maxImages)
        onImagesChange(newImages)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from library')
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const canAddMore = images.length < maxImages

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos</Text>
      
      <View style={styles.imagesContainer}>
        {images.map((imageUri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        {canAddMore && (
          <TouchableOpacity style={styles.addButton} onPress={showImagePicker}>
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.helpText}>
        Add up to {maxImages} photos • Tap and hold to reorder
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textAccent,
    marginBottom: Spacing.md,
  },

  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },

  imageWrapper: {
    position: 'relative',
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },

  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  removeButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 16,
  },

  addButton: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  addButtonIcon: {
    fontSize: 24,
    color: Colors.textTertiary,
    marginBottom: 2,
  },

  addButtonText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
})
