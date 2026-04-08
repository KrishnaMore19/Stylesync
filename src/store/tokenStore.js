import { create } from 'zustand'

// Single shared debounce timer per token path
const debounceTimers = {}
function debouncedSave(path, fn, delay = 800) {
  clearTimeout(debounceTimers[path])
  debounceTimers[path] = setTimeout(fn, delay)
}

export const useTokenStore = create((set, get) => ({
  // State
  tokenId: null,
  siteId: null,
  siteMeta: null,
  colors: {},
  typography: {},
  spacing: {},
  lockedPaths: new Set(),
  versionHistory: [],
  loading: false,
  error: null,
  activeTab: 'colors', // colors | typography | spacing
  exportFormat: 'css',

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  loadTokens: async (tokenId) => {
    set({ loading: true, error: null, tokenId })
    try {
      const res = await fetch(`/api/tokens?tokenId=${tokenId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const { token } = data
      const lockedPaths = new Set(token.lockedTokens.map(lt => lt.tokenPath))

      set({
        colors: token.colors || {},
        typography: token.typography || {},
        spacing: token.spacing || {},
        lockedPaths,
        siteMeta: token.site,
        loading: false,
      })

      // Apply CSS variables to document
      get().applyCssVars()
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  updateToken: async (path, value) => {
    const { tokenId, lockedPaths } = get()
    if (lockedPaths.has(path)) return // Don't update locked tokens

    // Optimistic update
    const [category, ...rest] = path.split('.')
    set(state => ({
      [category]: setNestedValue(state[category], rest, value),
    }))

    // Apply CSS variable instantly
    get().applyCssVars()

    // Persist to DB — debounced 800ms to avoid flooding on drag/color pick
    debouncedSave(path, async () => {
      try {
        await fetch('/api/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, path, value }),
        })
      } catch (err) {
        console.error('Failed to persist token update:', err)
      }
    }, 800)
  },

  toggleLock: async (path, value) => {
    const { tokenId, lockedPaths } = get()
    const isLocked = lockedPaths.has(path)
    const newLocked = new Set(lockedPaths)

    if (isLocked) {
      newLocked.delete(path)
    } else {
      newLocked.add(path)
    }

    set({ lockedPaths: newLocked })

    try {
      await fetch('/api/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, tokenPath: path, value, lock: !isLocked }),
      })
    } catch (err) {
      // Rollback
      set({ lockedPaths })
      console.error('Failed to toggle lock:', err)
    }
  },

  applyCssVars: () => {
    const { colors, typography, spacing } = get()
    const root = document.documentElement

    // Colors
    if (colors.primary) root.style.setProperty('--color-primary', colors.primary)
    if (colors.secondary) root.style.setProperty('--color-secondary', colors.secondary)
    if (colors.accent) root.style.setProperty('--color-accent', colors.accent)
    if (colors.background) root.style.setProperty('--color-background', colors.background)
    if (colors.surface) root.style.setProperty('--color-surface', colors.surface)
    if (colors.text) root.style.setProperty('--color-text', colors.text)
    if (colors.textMuted) root.style.setProperty('--color-text-muted', colors.textMuted)
    if (colors.border) root.style.setProperty('--color-border', colors.border)
    if (colors.success) root.style.setProperty('--color-success', colors.success)
    if (colors.error) root.style.setProperty('--color-error', colors.error)
    if (colors.warning) root.style.setProperty('--color-warning', colors.warning)

    // Typography
    if (typography.headingFont) root.style.setProperty('--font-heading', typography.headingFont)
    if (typography.bodyFont) root.style.setProperty('--font-body-extracted', typography.bodyFont)
    if (typography.baseSize) root.style.setProperty('--font-size-base', typography.baseSize)

    // Spacing
    if (spacing.named) {
      Object.entries(spacing.named).forEach(([key, val]) => {
        root.style.setProperty(`--spacing-${key}`, val)
      })
    }
  },

  exportTokens: async (format) => {
    const { tokenId } = get()
    window.open(`/api/export?tokenId=${tokenId}&format=${format}`, '_blank')
  },
}))

function setNestedValue(obj, pathArr, value) {
  if (pathArr.length === 0) return value
  const [head, ...tail] = pathArr
  return { ...obj, [head]: setNestedValue(obj?.[head] || {}, tail, value) }
}