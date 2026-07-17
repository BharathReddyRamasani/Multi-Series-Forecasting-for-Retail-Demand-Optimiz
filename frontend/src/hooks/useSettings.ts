import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '../pages/Settings'

const STORAGE_KEY = 'demandai_settings'

export const DEFAULT_SETTINGS: AppSettings = {
  model: 'lightgbm',
  horizon: '30',
  confidence: '95',
  theme: 'system',
  exportFormat: 'csv',
}

function read(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS
}

/** Subscribe to the persisted settings across the app. */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(read)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const save = useCallback((next: AppSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSettings(next)
    if (next.theme === 'system') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    } else {
      document.documentElement.setAttribute('data-theme', next.theme)
    }
  }, [])

  return { settings, save }
}
