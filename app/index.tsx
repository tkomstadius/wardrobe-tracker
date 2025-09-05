import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Colors, Spacing, Typography, BorderRadius, Shadow } from '../constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatSEK } from '../utils/currency'
import QuickWearTracker from '../components/QuickWearTracker'

interface WardrobeStats {
  totalItems: number
  totalTimesWorn: number
  totalValue: number
  categoryCounts: Record<string, number>
  mostWornItem: {
    name: string
    times_worn: number
  } | null
  recentlyAdded: number
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

export default function Overview() {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState<WardrobeStats>({
    totalItems: 0,
    totalTimesWorn: 0,
    totalValue: 0,
    categoryCounts: {},
    mostWornItem: null,
    recentlyAdded: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showQuickWear, setShowQuickWear] = useState(false)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  // Refresh data when the tab is focused (when user navigates back from other tabs)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchStats()
      }
    }, [user])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  const fetchStats = async () => {
    try {
      // Get all clothing items
      const { data: items, error } = await supabase
        .from('clothing_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching items:', error)
        setIsLoading(false)
        return
      }

      if (!items) {
        setIsLoading(false)
        return
      }

      // Calculate statistics
      const totalItems = items.length
      const totalTimesWorn = items.reduce((sum, item) => sum + (item.times_worn || 0), 0)
      const totalValue = items.reduce((sum, item) => sum + (item.purchase_price || 0), 0)
      
      // Category counts
      const categoryCounts: Record<string, number> = {}
      items.forEach(item => {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
      })

      // Most worn item
      const mostWornItem = items.reduce((max, item) => {
        if (!max || (item.times_worn || 0) > (max.times_worn || 0)) {
          return item
        }
        return max
      }, null as any)

      // Recently added (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentlyAdded = items.filter(item => 
        new Date(item.created_at) > thirtyDaysAgo
      ).length

      setStats({
        totalItems,
        totalTimesWorn,
        totalValue,
        categoryCounts,
        mostWornItem: mostWornItem ? {
          name: mostWornItem.name,
          times_worn: mostWornItem.times_worn
        } : null,
        recentlyAdded,
      })

    } catch (error) {
      console.error('Error calculating stats:', error)
    } finally {
      setIsLoading(false)
    }
  }


  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading your wardrobe...</Text>
        <Text style={styles.loadingSubtext}>Analyzing your style data</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
      {/* Quick Wear Section - Primary Feature */}
      <View style={styles.quickWearSection}>
        <TouchableOpacity 
          style={[
            styles.quickWearCard,
            stats.totalItems === 0 && styles.quickWearCardDisabled
          ]}
          onPress={() => {
            if (stats.totalItems > 0) {
              setShowQuickWear(true)
            } else {
              Alert.alert('No Items', 'Add some clothing items first to start tracking usage!')
            }
          }}
          activeOpacity={stats.totalItems > 0 ? 0.7 : 0.9}
        >
          <View style={styles.quickWearIcon}>
            <Text style={styles.quickWearIconText}>⚡</Text>
          </View>
          <View style={styles.quickWearContent}>
            <Text style={styles.quickWearTitle}>Track Item Usage</Text>
            <Text style={styles.quickWearSubtitle}>
              {stats.totalItems > 0 
                ? 'Quickly log wearing your items' 
                : 'Add items first, then track usage here'}
            </Text>
          </View>
          <View style={styles.quickWearArrow}>
            <Text style={styles.quickWearArrowText}>›</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Main Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalTimesWorn}</Text>
            <Text style={styles.statLabel}>Total Wears</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatSEK(stats.totalValue)}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoryGrid}>
          {Object.entries(stats.categoryCounts).map(([category, count]) => (
            <View 
              key={category}
              style={[
                styles.categoryCard,
                { backgroundColor: Colors.clothing[category as keyof typeof Colors.clothing] || Colors.surface }
              ]}
            >
              <Text style={styles.categoryCount}>{count}</Text>
              <Text style={styles.categoryName}>
                {categoryDisplayNames[category as keyof typeof categoryDisplayNames] || category}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Most Worn Item</Text>
          {stats.mostWornItem ? (
            <View>
              <Text style={styles.insightValue}>{stats.mostWornItem.name}</Text>
              <Text style={styles.insightSubtext}>
                Worn {stats.mostWornItem.times_worn} times
              </Text>
            </View>
          ) : (
            <Text style={styles.insightValue}>No items worn yet</Text>
          )}
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Recently Added</Text>
          <Text style={styles.insightValue}>{stats.recentlyAdded} items</Text>
          <Text style={styles.insightSubtext}>Added in the last 30 days</Text>
        </View>

        {stats.totalValue > 0 && stats.totalTimesWorn > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>Average Cost Per Wear</Text>
            <Text style={styles.insightValue}>
              {formatSEK(stats.totalValue / stats.totalTimesWorn, { showDecimals: true })}
            </Text>
            <Text style={styles.insightSubtext}>Across all items</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Start</Text>
        {stats.totalItems === 0 && (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateText}>
              Your wardrobe is empty! Tap the "Add Item" tab below to add your first clothing item and start tracking your style.
            </Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
      
      {/* Quick Wear Modal */}
      <Modal
        visible={showQuickWear}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuickWear(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quick Wear Tracking</Text>
            <View style={styles.modalSpacer} />
          </View>
          <QuickWearTracker onWearAdded={() => {
            fetchStats() // Refresh stats when wear is added
          }} />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  scrollView: {
    flex: 1,
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  signOutButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },

  signOutButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },

  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },

  loadingSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textTertiary,
  },

  statsSection: {
    padding: Spacing.lg,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },

  statNumber: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },

  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textAccent,
    marginBottom: Spacing.md,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  categoryCard: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },

  categoryCount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },

  categoryName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textInverse,
    textAlign: 'center',
  },

  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },

  insightTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },

  insightValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  insightSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },

  emptyStateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },

  emptyStateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.md * 1.5,
  },

  quickWearSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  quickWearCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.md,
  },
  
  quickWearCardDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.7,
  },

  quickWearIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  quickWearIconText: {
    fontSize: Typography.fontSize.xl,
  },

  quickWearContent: {
    flex: 1,
  },

  quickWearTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },

  quickWearSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textInverse,
    opacity: 0.9,
  },

  quickWearArrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickWearArrowText: {
    fontSize: Typography.fontSize.xxl,
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },

  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },

  modalSpacer: {
    width: 32,
  },
})
