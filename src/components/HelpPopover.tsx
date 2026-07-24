import { useState } from 'react'

const SHORTCUTS = [
  {
    group: '界面',
    items: [
      ['Ctrl + B', '切换侧栏显示'],
      ['Ctrl + I', '打开/关闭作品信息'],
      ['Esc', '返回阅读模式'],
    ],
  },
  {
    group: '编辑',
    items: [
      ['Ctrl + F', '查找正文内容'],
      ['Ctrl + H', '查找并替换'],
      ['点击正文空白', '进入编辑模式'],
    ],
  },
  {
    group: '格式',
    items: [
      ['H1 / H2 / H3', '插入标题'],
      ['B / I', '粗体 / 斜体'],
      ['分隔线', '插入章节分隔'],
      ['引用', '插入引用块'],
    ],
  },
  {
    group: '写作',
    items: [
      ['Enter', '新段落'],
      ['Shift + Enter', '行内换行'],
      ['段首缩进', '在工具栏中开关'],
    ],
  },
]

export function HelpPopover() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setOpen(true)}
        className="h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
        title="快捷键与帮助"
        aria-label="快捷键与帮助"
      >
        <span className="text-lg font-semibold">?</span>
      </button>

      {open && (
        <>
          {/* 点击外部关闭 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* 浮层 */}
          <div className="absolute right-0 top-12 z-50 w-[360px] rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
            {/* 标题 */}
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                快捷键与帮助
              </div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                常用操作速查
              </div>
            </div>

            {/* 内容 */}
            <div className="max-h-[70vh] overflow-y-auto p-4 space-y-5">
              {SHORTCUTS.map(section => (
                <div key={section.group} className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {section.group}
                  </div>

                  <div className="space-y-1">
                    {section.items.map(([key, desc]) => (
                      <div
                        key={key}
                        className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <kbd className="shrink-0 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                          {key}
                        </kbd>

                        <div className="flex-1 text-right text-sm text-zinc-600 dark:text-zinc-300 leading-5">
                          {desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 底部提示 */}
            <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
              提示：阅读模式下点击正文任意空白区域即可进入编辑模式。
            </div>
          </div>
        </>
      )}
    </div>
  )
}