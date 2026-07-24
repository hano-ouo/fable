export interface WritingSession {
  date: string
  words: number
  durationMs: number
  workId: string
}

export interface AnalyticsData {
  sessions: WritingSession[]
}

export interface DashboardStats {
  todayWords: number
  monthWords: number
  streakDays: number
  totalWords: number
  totalDuration: number
}