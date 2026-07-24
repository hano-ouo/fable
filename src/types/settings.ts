export type Theme = 'light' | 'dark'

export interface AppSettings {
  theme: Theme
  editorFontSize: number
  indentParagraph: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  editorFontSize: 18,
  indentParagraph: true,
}