import 'react-native-url-polyfill/auto'
import { Tabs } from 'expo-router'
import React from 'react'
import { Text, View, ActivityIndicator } from 'react-native'
import { Colors } from '../constants'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import AuthScreen from '../components/AuthScreen'

function AuthenticatedTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.backgroundSecondary,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: Colors.backgroundSecondary,
          borderBottomColor: Colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size * 0.8, color }}>📊</Text>
          ),
          headerTitle: 'Wardrobe Tracker',
        }}
      />
      <Tabs.Screen
        name="add-item"
        options={{
          title: 'Add Item',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size * 0.8, color }}>➕</Text>
          ),
          headerTitle: 'Add New Item',
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size * 0.8, color }}>👗</Text>
          ),
          headerTitle: 'My Wardrobe',
        }}
      />
    </Tabs>
  )
}

function RootLayoutContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 16 }}>Loading...</Text>
      </View>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <AuthenticatedTabs />
}

export default function TabLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  )
}
