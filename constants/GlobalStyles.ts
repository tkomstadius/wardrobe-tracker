import { StyleSheet } from 'react-native'
import { Colors } from './Colors'
import { Spacing, Typography, BorderRadius, Shadow } from './Layout'

/**
 * Common style patterns used throughout the app
 * Use these for consistency and to avoid repetition
 */
export const GlobalStyles = StyleSheet.create({
  // Layout helpers
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  containerPadded: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Card/Surface styles
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  
  cardSmall: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  
  // Typography styles
  h1: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  
  h2: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  
  h3: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  
  bodyLarge: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.normal,
  },
  
  body: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
  },
  
  bodySecondary: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
  },
  
  caption: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  
  // Button styles
  buttonPrimary: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  
  buttonSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  
  buttonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverse,
  },
  
  buttonTextSecondary: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  
  // Form styles
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  
  // Spacing helpers
  mb_xs: { marginBottom: Spacing.xs },
  mb_sm: { marginBottom: Spacing.sm },
  mb_md: { marginBottom: Spacing.md },
  mb_lg: { marginBottom: Spacing.lg },
  mb_xl: { marginBottom: Spacing.xl },
  
  mt_xs: { marginTop: Spacing.xs },
  mt_sm: { marginTop: Spacing.sm },
  mt_md: { marginTop: Spacing.md },
  mt_lg: { marginTop: Spacing.lg },
  mt_xl: { marginTop: Spacing.xl },
  
  p_xs: { padding: Spacing.xs },
  p_sm: { padding: Spacing.sm },
  p_md: { padding: Spacing.md },
  p_lg: { padding: Spacing.lg },
  p_xl: { padding: Spacing.xl },
})
