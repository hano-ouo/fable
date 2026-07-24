import { useMemo, useState } from 'react'
import type { Work } from '@/types/work'
import type { Folder } from '@/types/folder'

interface Props {
  open: boolean
  work: Work | null
  folders: Folder[]
  onClose: () => void
  onChange: (work: Work) => void
}

export function WorkInfoDrawer({
  open,
  work,
  folders,
  onClose,
  onChange,
}: Props) {
  const [tagInput, setTagInput] = useState('')

  const tags = useMemo(() => {
    return work?.meta.tags ?? []
  }, [work])

  // ✅ 先判断，再定义函数
  if (!open || !work) return null

  function updateMeta<K extends keyof typeof work.meta>(
    key: K,
    value: (typeof work.meta)[K]
  ) {
    onChange({
      ...work,
      meta: {
        ...work.meta,
        [key]: value,
      },
    })
  }

  function addTag() {
    const tag = tagInput.trim()

    if (!tag) return
    if (tags.includes(tag)) {
      setTagInput('')
      return
    }

    updateMeta('tags', [...tags, tag])
    setTagInput('')
  }

  function removeTag(tag: string) {
    updateMeta(
      'tags',
      tags.filter(t => t !== tag)
    )
  }

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
        onClick={onClose}
      />

      {/* 抽屉 */}
      <aside
        className={`
          fixed right-0 top-0 z-50 h-full w-[380px]
          bg-white dark:bg-zinc-950
          border-l border-zinc-200 dark:border-zinc-800
          shadow-2xl
          transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* 顶部 */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                作品信息
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                修改标题、简介与标签
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 内容 */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 标题 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                标题
              </label>

              <input
                value={work.meta.title}
                onChange={e => updateMeta('title', e.target.value)}
                placeholder="作品标题"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
              />
            </div>

            {/* summary */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                summary
              </label>

              <textarea
                value={work.meta.summary}
                onChange={e => updateMeta('summary', e.target.value)}
                placeholder="例如：没想到多年后，在那个地方又见到了他。"
                rows={4}
                className="w-full resize-none rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 leading-7"
              />
            </div>

            {/* 文件夹选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                文件夹
              </label>

              <select
                value={work.meta.folderId ?? 'uncategorized'}
                onChange={e =>
                  updateMeta(
                    'folderId',
                    e.target.value === 'uncategorized'
                      ? null
                      : e.target.value
                  )
                }
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
              >
                <option value="uncategorized">未分类</option>

                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 标签 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  标签
                </label>

                <span className="text-xs text-zinc-500">
                  {tags.length} 个
                </span>
              </div>

              {/* 已有标签 */}
              <div className="flex flex-wrap gap-2 min-h-[36px]">
                {tags.length === 0 ? (
                  <div className="text-sm text-zinc-400 py-1">
                    暂无标签
                  </div>
                ) : (
                  tags.map(tag => (
                    <div
                      key={tag}
                      className="group flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200"
                    >
                      <span>{tag}</span>

                      <button
                        onClick={() => removeTag(tag)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 新增标签 */}
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="输入标签后回车"
                  className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                />

                <button
                  onClick={addTag}
                  className="rounded-2xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-medium text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                >
                  添加
                </button>
              </div>
            </div>

            {/* 元数据 */}
            <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                元数据
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">创建时间</span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {new Date(work.meta.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">最后编辑</span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {new Date(work.meta.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 底部 */}
          <div className="p-5 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}