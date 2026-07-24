import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { Theme, AppSettings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'
import { loadSettings, saveSettings } from '@/lib/settings'

interface AppSettingsContextValue {
  theme: Theme
  editorFontSize: number
  indentParagraph: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => Promise<void>
  setEditorFontSize: (size: number) => Promise<void>
  setIndentParagraph: (enabled: boolean) => Promise<void>
}

const AppSettingsContext =
  createContext<AppSettingsContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] =
    useState<AppSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    loadSettings().then(loaded => {
      setSettings(loaded)
    })
  }, [])

  useEffect(() => {
    const root = document.documentElement

    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [settings.theme])

  async function persist(next: AppSettings) {
    setSettings(next)

    try {
      await saveSettings(next)
    } catch (err) {
      console.error('save settings failed', err)
    }
  }

  async function setTheme(theme: Theme) {
    await persist({
      ...settings,
      theme,
    })
  }

  async function toggleTheme() {
    await setTheme(
      settings.theme === 'dark' ? 'light' : 'dark'
    )
  }

  async function setEditorFontSize(size: number) {
    await persist({
      ...settings,
      editorFontSize: size,
    })
  }

  async function setIndentParagraph(enabled: boolean) {
    await persist({
      ...settings,
      indentParagraph: enabled,
    })
  }

  return (
    <AppSettingsContext.Provider
      value={{
        theme: settings.theme,
        editorFontSize: settings.editorFontSize,
        indentParagraph: settings.indentParagraph,
        toggleTheme,
        setTheme,
        setEditorFontSize,
        setIndentParagraph,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(AppSettingsContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}