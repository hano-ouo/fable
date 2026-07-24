export type FileExportType = 'docx' | 'txt' | 'pdf'
export type ImageExportMode = 'long' | 'paged'
export type ImageExportSize = 'mobile' | 'pc'
export type DateDisplay = 'none' | 'created' | 'updated'
export type TextPosition = 'left' | 'center' | 'right'

export interface PositionedText {
  text: string
  position: TextPosition
}

export interface ExportSettings {
  exportPath: string

  fileType: FileExportType

  imageMode: ImageExportMode
  imageSize: ImageExportSize

  header: PositionedText
  footer: PositionedText

  dateDisplay: DateDisplay
  showPageNumber: boolean
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  exportPath: '',
  fileType: 'docx',
  imageMode: 'long',
  imageSize: 'pc',
  header: {
    text: '',
    position: 'center',
  },
  footer: {
    text: '',
    position: 'right',
  },
  dateDisplay: 'none',
  showPageNumber: true,
}