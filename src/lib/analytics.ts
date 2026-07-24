import { invoke } from '@tauri-apps/api/core'
import type {
  AnalyticsData,
  DashboardStats,
  WritingSession,
} from '@/types/analytics'

export async function appendWritingSession(
  session: WritingSession
): Promise<void> {
  await invoke('append_writing_session', { session })
}

export async function loadAnalytics(): Promise<AnalyticsData> {
  return invoke('load_analytics')
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * 获取单篇文章的总写作时长（秒）
 */
export async function getWorkTotalDuration(workId: string): Promise<number> {
  const data = await loadAnalytics()
  
  return data.sessions
    .filter(s => s.workId === workId)
    .reduce((sum, s) => sum + Math.floor(s.durationMs / 1000), 0)
}

/**
 * 获取所有文章的总写作时长（秒）
 */
export async function getTotalDuration(): Promise<number> {
  const data = await loadAnalytics()
  
  return data.sessions.reduce(
    (sum, s) => sum + Math.floor(s.durationMs / 1000),
    0
  )
}

/**
 * 获取每篇文章的时长统计
 */
export async function getWorkDurations(): Promise<Record<string, number>> {
  const data = await loadAnalytics()
  const map: Record<string, number> = {}

  data.sessions.forEach(s => {
    map[s.workId] = (map[s.workId] || 0) + Math.floor(s.durationMs / 1000)
  })

  return map
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const data = await loadAnalytics()
  const sessions = data.sessions

  const today = formatDate(new Date())
  const monthPrefix = today.slice(0, 7)

  // 今日字数
  const todayWords = sessions
    .filter(s => s.date === today)
    .reduce((sum, s) => sum + s.words, 0)

  // 本月字数
  const monthWords = sessions
    .filter(s => s.date.startsWith(monthPrefix))
    .reduce((sum, s) => sum + s.words, 0)

  // 总字数
  const totalWords = sessions.reduce((sum, s) => sum + s.words, 0)

  // 总时长（秒）
  const totalDuration = sessions.reduce(
    (sum, s) => sum + Math.floor(s.durationMs / 1000),
    0
  )

  // 连续天数
  const uniqueDates = [...new Set(sessions.map(s => s.date))]
    .sort()
    .reverse()

  let streakDays = 0
  const cursor = new Date()

  while (true) {
    const dateStr = formatDate(cursor)

    if (uniqueDates.includes(dateStr)) {
      streakDays++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  return {
    todayWords,
    monthWords,
    streakDays,
    totalWords,
    totalDuration,
  }
}