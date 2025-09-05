import { supabase } from '../lib/supabase'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'

export interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload an image to Supabase storage
 * @param uri - Local image URI from device
 * @param userId - User ID for folder organization
 * @param fileName - Optional custom file name
 * @returns Promise with upload result
 */
export const uploadImage = async (
  uri: string,
  userId: string,
  fileName?: string
): Promise<ImageUploadResult> => {
  try {
    console.log('Starting image upload:', { uri, userId, fileName })
    
    // Generate a unique filename if none provided
    const timestamp = Date.now()
    const fileExtension = uri.split('.').pop() || 'jpg'
    const finalFileName = fileName || `image_${timestamp}.${fileExtension}`
    
    // Create the storage path: userId/filename
    const filePath = `${userId}/${finalFileName}`
    console.log('Upload file path:', filePath)

    // For React Native, read the file as base64 and convert to ArrayBuffer
    console.log('Reading file as base64...')
    
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    
    console.log('Converting base64 to ArrayBuffer...')
    const arrayBuffer = decode(base64)
    console.log('ArrayBuffer size:', arrayBuffer.byteLength)

    // Upload to Supabase Storage using ArrayBuffer
    console.log('Starting Supabase upload...')
    const { data, error } = await supabase.storage
      .from('clothing-images')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExtension}`,
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      console.error('Supabase upload error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return {
        success: false,
        error: error.message,
      }
    }

    console.log('Upload successful, data:', data)
    
    // Get the public URL for the uploaded image
    console.log('Getting public URL for:', filePath)
    const { data: { publicUrl } } = supabase.storage
      .from('clothing-images')
      .getPublicUrl(filePath)
    
    console.log('Public URL:', publicUrl)

    return {
      success: true,
      url: publicUrl,
    }

  } catch (error: any) {
    console.error('Image upload error:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    }
  }
}

/**
 * Upload multiple images in sequence
 * @param uris - Array of local image URIs
 * @param userId - User ID for folder organization
 * @returns Promise with array of upload results
 */
export const uploadMultipleImages = async (
  uris: string[],
  userId: string
): Promise<ImageUploadResult[]> => {
  const results: ImageUploadResult[] = []
  
  // Upload images one by one to avoid overwhelming the server
  for (const uri of uris) {
    const result = await uploadImage(uri, userId)
    results.push(result)
  }
  
  return results
}

/**
 * Delete an image from Supabase storage
 * @param filePath - The storage path of the file to delete
 * @returns Promise with deletion result
 */
export const deleteImage = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('clothing-images')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Image deletion error:', error)
    return false
  }
}

/**
 * Get the file path from a Supabase storage URL
 * @param url - The public URL from Supabase storage
 * @returns The file path or null if invalid URL
 */
export const getFilePathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    
    // Find the bucket name in the path and extract everything after it
    const bucketIndex = pathParts.indexOf('clothing-images')
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/')
    }
    
    return null
  } catch (error) {
    console.error('Error parsing URL:', error)
    return null
  }
}
