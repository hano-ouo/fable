import { useEffect, useState } from 'react'
import { getDashboardStats, loadAnalytics, getWorkTotalDuration } from '@/lib/analytics'
import type { DashboardStats } from '@/types/analytics'
import type { WorkMeta } from '@/types/work'

interface Props {
  works: WorkMeta[]
  onOpenWork: (id: string) => void
}

export function Dashboard({ works, onOpenWork }: Props) {
  const [stats, setStats] = useState<DashboardStats>({
    todayWords: 0,
    monthWords: 0,
    streakDays: 0,
    totalWords: 0,
  })

  const [heatmap, setHeatmap] = useState<Record<string, number>>({})
  const [workDurations, setWorkDurations] = useState<Record<string, number>>({})

  useEffect(() => {
    getDashboardStats().then(setStats)

    loadAnalytics().then(data => {
      const map: Record<string, number> = {}
      const durationMap: Record<string, number> = {}

      data.sessions.forEach(s => {
        map[s.date] = (map[s.date] || 0) + s.words
        // 累计每篇文章的总时长（秒）
        durationMap[s.workId] = (durationMap[s.workId] || 0) + Math.floor(s.durationMs / 1000)
      })

      setHeatmap(map)
      setWorkDurations(durationMap)
    })
  }, [])

  // 生成最近 365 天
  function getDates() {
    const dates: string[] = []

    for (let i = 364; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().slice(0, 10))
    }

    return dates
  }

  function level(words: number) {
    if (!words) return 0
    if (words < 300) return 1
    if (words < 1000) return 2
    if (words < 2000) return 3
    return 4
  }

  // 格式化时长（秒 → 分钟/小时）
  function formatDuration(seconds: number): string {
    if (seconds < 60) return '<1分钟'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const remainMinutes = minutes % 60
    return remainMinutes > 0 ? `${hours}小时${remainMinutes}分钟` : `${hours}小时`
  }

  const dates = getDates()
  const recentWorks = works.slice(0, 5)

  // 计算总写作时长（所有作品累计）
  const totalDuration = Object.values(workDurations).reduce((sum, d) => sum + d, 0)

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        {/* 标题 */}
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Fable
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            欢迎回来，今天也继续写点什么吧。
          </p>
        </div>

        {/* 统计卡片 - 新增总时长 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="今日字数"
            value={stats.todayWords.toLocaleString()}
            suffix="字"
          />

          <StatCard
            label="本月累计"
            value={stats.monthWords.toLocaleString()}
            suffix="字"
          />

          <StatCard
            label="连续写作"
            value={String(stats.streakDays)}
            suffix="天"
          />

          <StatCard
            label="总字数"
            value={stats.totalWords.toLocaleString()}
            suffix="字"
          />

          <StatCard
            label="总写作时长"
            value={formatDuration(totalDuration)}
            suffix=""
          />
        </div>

        {/* 热力图 */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              写作热力图
            </h2>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>少</span>
              <div className="w-3 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900" />
              <div className="w-3 h-3 rounded bg-green-400 dark:bg-green-700" />
              <div className="w-3 h-3 rounded bg-green-600 dark:bg-green-500" />
              <div className="w-3 h-3 rounded bg-green-800 dark:bg-green-300" />
              <span>多</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-[900px]">
              {dates.map(date => {
                const words = heatmap[date] || 0
                const l = level(words)

                const colors = [
                  'bg-zinc-200 dark:bg-zinc-800',
                  'bg-green-200 dark:bg-green-900',
                  'bg-green-400 dark:bg-green-700',
                  'bg-green-600 dark:bg-green-500',
                  'bg-green-800 dark:bg-green-300',
                ]

                return (
                  <div
                    key={date}
                    title={`${date} · ${words} 字`}
                    className={`
                      w-3.5 h-3.5 rounded-sm
                      ${colors[l]}
                    `}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* 最近作品 - 新增时长显示 */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              最近作品
            </h2>

            <span className="text-sm text-zinc-500">
              {works.length} 篇
            </span>
          </div>

          <div className="space-y-3">
            {recentWorks.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                还没有作品，先创建第一篇吧。
              </div>
            ) : (
              recentWorks.map(work => {
                const duration = workDurations[work.id] || 0

                return (
                  <button
                    key={work.id}
                    onClick={() => onOpenWork(work.id)}
                    className="w-full text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {work.title}
                      </div>

                      {duration > 0 && (
                        <div className="text-xs text-zinc-400">
                          📖 {formatDuration(duration)}
                        </div>
                      )}
                    </div>

                    {work.summary && (
                      <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {work.summary}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-zinc-400">
                      {new Date(work.updatedAt).toLocaleString()}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix: string
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        {label}
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {value}
        </div>

        {suffix && (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {suffix}
          </div>
        )}
      </div>
    </div>
  )
}