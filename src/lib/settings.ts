import { invoke } from '@tauri-apps/api/core'
import type { AppSettings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'

export async function loadSettings(): Promise<AppSettings> {
  try {
    return await invoke<AppSettings>('load_settings')
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await invoke('save_settings', { settings })
}