import type { Editor } from '@tiptap/react'
import { useTheme } from '@/context/ThemeContext'
import { useState } from 'react'

interface Props {
  editor: Editor | null
}

const PUNCTUATIONS = [
  '——',
  '……',
  '·',
  '「」',
  '『』',
  '（）',
  '【】',
  '！？',
]

export function EditorToolbar({ editor }: Props) {
  const {
    editorFontSize,
    setEditorFontSize,
    indentParagraph,
    setIndentParagraph,
  } = useTheme()
  const [helpOpen, setHelpOpen] = useState(false)

  if (!editor) return null

  function insertText(text: string) {
    if (!editor) return  // 添加空值检查
    editor.chain().focus().insertContent(text).run()
  }

  function button(
    label: string,
    onClick: () => void,
    active = false
  ) {
    return (
      <button
        onClick={onClick}
        className={`
          h-9 px-3 rounded-lg text-sm transition-colors whitespace-nowrap
          ${
            active
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }
        `}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur relative">
      {/* 第一行：Markdown 结构 */}
      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
        {button('H1', () =>
          editor.chain().focus().toggleHeading({ level: 1 }).run(),
          editor.isActive('heading', { level: 1 })
        )}

        {button('H2', () =>
          editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive('heading', { level: 2 })
        )}

        {button('H3', () =>
          editor.chain().focus().toggleHeading({ level: 3 }).run(),
          editor.isActive('heading', { level: 3 })
        )}

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />

        {button('B', () =>
          editor.chain().focus().toggleBold().run(),
          editor.isActive('bold')
        )}

        {button('I', () =>
          editor.chain().focus().toggleItalic().run(),
          editor.isActive('italic')
        )}

        {button('U', () =>
          editor.chain().focus().toggleUnderline().run(),
          editor.isActive('underline')
        )}

        {button('S', () =>
          editor.chain().focus().toggleStrike().run(),
          editor.isActive('strike')
        )}

        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />

        {button('分隔线', () =>
          editor.chain().focus().setHorizontalRule().run()
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500">字号</span>

          <select
            value={editorFontSize}
            onChange={e =>
              setEditorFontSize(Number(e.target.value))
            }
            className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 text-sm outline-none"
          >
            {[14, 16, 18, 20, 22, 24].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={indentParagraph}
              onChange={e => setIndentParagraph(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600"
            />
            段首缩进
          </label>

          {/* Help 按钮 */}
          <button
            onClick={() => setHelpOpen(!helpOpen)}
            className={`
              h-9 px-3 rounded-lg text-sm transition-colors
              ${helpOpen 
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' 
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }
            `}
            title="快捷键帮助"
          >
            ?
          </button>
        </div>
      </div>

      {/* 第二行：常用标点 */}
      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-zinc-100 dark:border-zinc-800">
        {PUNCTUATIONS.map(p => (
          <button
            key={p}
            onClick={() => insertText(p)}
            className="h-8 px-3 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Help 下拉面板 */}
      {helpOpen && (
        <div className="absolute right-4 top-full mt-2 z-50 w-72 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              ⌨️ 快捷键
            </h3>
            <button
              onClick={() => setHelpOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">切换侧栏</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">⌘B</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">作品信息</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">⌘I</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">查找</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">⌘F</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">替换</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">⌘H</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">退出编辑模式</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Esc</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">加粗</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">⌘B</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">斜体</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">⌘I</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">下划线</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">⌘U</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">删除线</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">⌘⇧S</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] text-zinc-400">
              点击编辑器任意位置进入编辑模式
            </p>
          </div>
        </div>
      )}
    </div>
  )
}