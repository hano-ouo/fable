import { useEffect, useMemo, useState, useRef } from 'react'
import { createWork, loadWork, loadWorks, saveWork, deleteWork } from '@/lib/workspace'
import type { Work, WorkMeta } from '@/types/work'
import type { Folder } from '@/types/folder'
import { Editor } from '@/components/Editor'
import { useAutoSave } from '@/hooks/useAutoSave'
import { CreateWorkModal } from '@/components/CreateWorkModal'
import { useTheme } from '@/context/ThemeContext'
import { WorkInfoDrawer } from '@/components/WorkInfoDrawer'
import { appendWritingSession, getWorkTotalDuration } from '@/lib/analytics'
import { Dashboard } from '@/pages/Dashboard'
import { ExportDialog } from '@/components/ExportDialog'
import { loadFolders, createFolder, deleteFolder } from '@/lib/folders'
import { FolderSidebar } from '@/components/FolderSidebar'
import { HelpPopover } from '@/components/HelpPopover'

export default function App() {
  const [works, setWorks] = useState<WorkMeta[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [current, setCurrent] = useState<Work | null>(null)
  const [saving, setSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sessionStartWords, setSessionStartWords] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState(Date.now())
  const [createOpen, setCreateOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [showDashboard, setShowDashboard] = useState(true)
  const [lastSavedWordCount, setLastSavedWordCount] = useState(0)
  const [editorMode, setEditorMode] = useState<'read' | 'edit'>('read')
  const [workTotalDuration, setWorkTotalDuration] = useState(0)
  const [lastTotalDuration, setLastTotalDuration] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)
  const { theme, toggleTheme, indentParagraph } = useTheme()
  const currentIdRef = useRef<string | null>(null)

  // 初始加载
  useEffect(() => {
    refreshWorks()
    refreshFolders()
  }, [])

  // 当 current 变化时，加载总时长并重置基线
  useEffect(() => {
    if (!current) {
      setWorkTotalDuration(0)
      setLastTotalDuration(0)
      currentIdRef.current = null
      return
    }

    // 只有作品 ID 变化时才重置基线
    if (currentIdRef.current !== current.meta.id) {
      currentIdRef.current = current.meta.id

      getWorkTotalDuration(current.meta.id).then(duration => {
        setWorkTotalDuration(duration)
        setLastTotalDuration(duration)
      })
    }
  }, [current])

  async function refreshWorks() {
    const list = await loadWorks()
    setWorks(list)

    // 自动打开最近作品
    if (!current && list.length > 0) {
      const work = await loadWork(list[0].id)
      setCurrent(work)
      setSessionStartWords(work.content.length)
      setLastSavedWordCount(work.content.length)
      setSessionStartTime(Date.now())
    }
  }

  async function refreshFolders() {
    const list = await loadFolders()
    setFolders(list)
  }

  // 新建作品
  async function handleCreate(data: {
    title: string
    summary: string
    tags: string[]
    folderId: string | null
  }) {
    try {
      console.log('creating work', data)

      const meta = await createWork(
        data.title,
        data.summary,
        data.tags
      )

      if (data.folderId) {
        // 这里需要调用 update_work_folder command
      }

      console.log('created meta', meta)

      await refreshWorks()

      const work = await loadWork(meta.id)
      setCurrent(work)
      setSessionStartWords(0)
      setLastSavedWordCount(0)
      setSessionStartTime(Date.now())
      setShowDashboard(false)
      setEditorMode('read')

      console.log('work opened')
    } catch (error) {
      console.error('create work failed:', error)
      alert(`创建失败：${String(error)}`)
    }
  }

  // 打开作品
  async function openWork(id: string) {
    const work = await loadWork(id)
    setCurrent(work)
    setSessionStartWords(work.content.length)
    setLastSavedWordCount(work.content.length)
    setSessionStartTime(Date.now())
    setShowDashboard(false)
    setEditorMode('read')
  }

  // 创建文件夹
  async function handleCreateFolder(parentId?: string) {
    const name = window.prompt('文件夹名称')
    if (!name?.trim()) return
    await createFolder(name.trim(), parentId)
    await refreshFolders()
  }

  // 删除文件夹
  async function handleDeleteFolder(id: string) {
    try {
      await deleteFolder(id)
      await refreshFolders()
      await refreshWorks()
    } catch (error) {
      console.error('delete folder failed:', error)
      alert(`删除文件夹失败：${String(error)}`)
    }
  }

  // 删除作品
  async function handleDeleteWork(id: string) {
    try {
      await deleteWork(id)
      if (current?.meta.id === id) {
        setCurrent(null)
        setShowDashboard(true)
      }
      await refreshWorks()
    } catch (error) {
      console.error('delete work failed:', error)
      alert(`删除失败：${String(error)}`)
    }
  }

  // 自动保存（取消阈值）
  useAutoSave(
    async () => {
      if (!current) return

      try {
        setSaving(true)

        const currentCount = current.content.length
        const netDelta = currentCount - lastSavedWordCount

        await saveWork(current)

        // 只要有字数变化就记录
        if (netDelta !== 0) {
          const durationMs = Date.now() - sessionStartTime

          await appendWritingSession({
            date: new Date().toISOString().slice(0, 10),
            words: netDelta,
            durationMs: durationMs,
            workId: current.meta.id,
          })

          setLastSavedWordCount(currentCount)
          setSessionStartTime(Date.now())

          const duration = await getWorkTotalDuration(current.meta.id)
          setWorkTotalDuration(duration)
        }
      } finally {
        setSaving(false)
      }
    },
    [current],
    1500
  )

  // Ctrl+B 切换侧栏, Ctrl+I 切换信息抽屉, Esc 返回阅读模式
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setSidebarOpen(v => !v)
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        setInfoOpen(v => !v)
      }
      if (e.key === 'Escape') {
        setEditorMode('read')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 统计
  const wordCount = useMemo(() => {
    return current?.content.length ?? 0
  }, [current?.content])

  const sessionDelta = useMemo(() => {
    return Math.max(0, wordCount - sessionStartWords)
  }, [wordCount, sessionStartWords])

  // 单次时长（秒）= 当前总时长 - 会话开始时总时长
  const sessionDurationSeconds = useMemo(() => {
    return Math.max(0, workTotalDuration - lastTotalDuration)
  }, [workTotalDuration, lastTotalDuration])

  // 格式化时长（秒 → 分钟/小时）
  function formatDuration(seconds: number): string {
    if (seconds < 60) return '<1分钟'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const remainMinutes = minutes % 60
    return remainMinutes > 0 ? `${hours}小时${remainMinutes}分钟` : `${hours}小时`
  }

  // 格式化短时长（只显示分钟）
  function formatShortDuration(seconds: number): string {
    if (seconds < 60) return '<1'
    return `${Math.floor(seconds / 60)}`
  }

  return (
    <div
      className={`
        h-screen flex overflow-hidden transition-colors
        bg-white dark:bg-zinc-950
        text-zinc-900 dark:text-zinc-100
        ${editorMode === 'read' ? 'read-mode' : ''}
        ${indentParagraph ? 'indent-enabled' : ''}
      `}
    >
      {/* 左侧作品树 */}
      {sidebarOpen && (
        <aside className="w-72 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white/95 dark:bg-zinc-950/95 transition-colors">
          {/* 顶部 */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold">Fable</h1>
              <div className="text-xs text-zinc-500">Ctrl+B</div>
            </div>

            <button
              onClick={() => setCreateOpen(true)}
              className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 py-2.5 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              ＋ 新建作品
            </button>

            <button
              onClick={() => setShowDashboard(true)}
              className="w-full mt-2 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              主页
            </button>
          </div>

          <FolderSidebar
            folders={folders}
            works={works}
            currentId={current?.meta.id}
            onOpenWork={openWork}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onDeleteWork={handleDeleteWork}
          />

          {/* 侧栏底部 */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur space-y-3">
            <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>作品数</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {works.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>工作区</span>
                <span className="truncate max-w-[120px] text-zinc-600 dark:text-zinc-400">
                  G:/documentsave
                </span>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {theme === 'dark' ? '🌙' : '☀️'}
                </span>
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                  {theme === 'dark' ? '深色模式' : '浅色模式'}
                </span>
              </div>
              <div
                className={`
                  relative h-5 w-9 rounded-full transition-colors
                  ${theme === 'dark' ? 'bg-zinc-600' : 'bg-zinc-300'}
                `}
              >
                <div
                  className={`
                    absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform
                    ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}
                  `}
                />
              </div>
            </button>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <div>Ctrl+B · 替换侧栏</div>
                <div>Esc · 阅读模式</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 主区域 */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
        {showDashboard ? (
          <Dashboard
            works={works}
            onOpenWork={openWork}
          />
        ) : current ? (
          <div
            className="bg-white dark:bg-zinc-950 h-full flex flex-col"
          >
            <header
              className="px-8 pt-6 pb-2 cursor-pointer"
              onClick={() => {
                if (editorMode === 'read') {
                  setEditorMode('edit')
                }
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <input
                    value={current.meta.title}
                    onChange={e =>
                      setCurrent({
                        ...current,
                        meta: {
                          ...current.meta,
                          title: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                    placeholder="未命名作品"
                  />
                  {current.meta.summary && (
                    <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-6">
                      {current.meta.summary}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <HelpPopover />

                  <button
                    onClick={() => setExportOpen(true)}
                    className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    🖫
                  </button>

                  <button
                    onClick={() => setInfoOpen(true)}
                    className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    ⓘ
                  </button>
                </div>
              </div>

              {current.meta.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {current.meta.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {editorMode === 'edit' && (
              <section className="px-8 pb-4">
                <details className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-300 select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    ✦ 灵感 / 大纲
                  </summary>
                  <div className="px-4 pb-4">
                    <textarea
                      value={current.inspiration}
                      onChange={e =>
                        setCurrent({
                          ...current,
                          inspiration: e.target.value,
                        })
                      }
                      placeholder="记录脑洞、台词、伏笔、章节目标……"
                      className="w-full min-h-36 resize-none bg-transparent outline-none leading-7 text-[15px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </details>
              </section>
            )}

            <div className="flex-1 min-h-0">
              <Editor
                value={current.content}
                onChange={content =>
                  setCurrent(prev =>
                    prev
                      ? {
                          ...prev,
                          content,
                        }
                      : prev
                  )
                }
                mode={editorMode}
                onRequestEdit={() => setEditorMode('edit')}
              />
            </div>

            <footer className="h-12 border-t border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400 bg-white/95 dark:bg-zinc-950/95">
              <div className="flex items-center gap-5 overflow-x-auto">
                <span className="whitespace-nowrap">
                  {wordCount.toLocaleString()} 字
                </span>
                <span className="whitespace-nowrap text-emerald-400">
                  本次 +{sessionDelta.toLocaleString()}
                </span>
                <span className="whitespace-nowrap">
                  本次 {formatShortDuration(sessionDurationSeconds)}分钟
                </span>
                <span className="whitespace-nowrap text-zinc-500">
                  总时长 {formatDuration(workTotalDuration)}
                </span>
              </div>

              <div className="flex items-center gap-2 whitespace-nowrap">
                <div
                  className={`
                    w-2 h-2 rounded-full
                    ${saving ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}
                  `}
                />
                <span>{saving ? '保存中…' : '已自动保存'}</span>
              </div>
            </footer>
          </div>
        ) : (
          <Dashboard
            works={works}
            onOpenWork={openWork}
          />
        )}
      </main>

      <CreateWorkModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        folders={folders}
        onSubmit={handleCreate}
      />

      <WorkInfoDrawer
        open={infoOpen}
        work={current}
        folders={folders}
        onClose={() => setInfoOpen(false)}
        onChange={setCurrent}
      />

      {current && (
        <ExportDialog
          open={exportOpen}
          work={current}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  )
}