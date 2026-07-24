import { useState } from 'react'
import type { Folder } from '@/types/folder'

interface Props {
  open: boolean
  onClose: () => void
  folders: Folder[]
  onSubmit: (data: {
    title: string
    summary: string
    tags: string[]
    folderId: string | null
  }) => Promise<void>
}

export function CreateWorkModal({ open, onClose, folders, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [folderId, setFolderId] = useState<string>('uncategorized')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) return

    setLoading(true)

    try {
      const tags = tagsInput
        .split(/[，,]/)
        .map(t => t.trim())
        .filter(Boolean)

      await onSubmit({
        title: title.trim(),
        summary: summary.trim(),
        tags,
        folderId: folderId === 'uncategorized' ? null : folderId,
      })

      // 重置
      setTitle('')
      setSummary('')
      setTagsInput('')
      setFolderId('uncategorized')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg mx-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">新建作品</h2>
          <p className="mt-1 text-sm text-zinc-400">
            创建一篇新的同人文或短篇作品
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* 标题 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              标题 *
            </label>

            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：雨夜之后"
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </div>

          {/* 简介 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              简介
            </label>

            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="一句话简介（可选）"
              rows={3}
              className="w-full resize-none rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              标签
            </label>

            <input
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="双向暗恋, 破镜重圆, ABO"
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />

            <p className="text-xs text-zinc-500">
              使用逗号分隔多个标签
            </p>
          </div>

          {/* 文件夹选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              文件夹
            </label>

            <select
              value={folderId}
              onChange={e => setFolderId(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            >
              <option value="uncategorized">未分类</option>

              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-700 px-5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            取消
          </button>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="rounded-2xl bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '创建中…' : '创建作品'}
          </button>
        </div>
      </form>
    </div>
  )
}