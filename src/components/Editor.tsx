import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorToolbar } from '@/components/EditorToolbar'
import { useTheme } from '@/context/ThemeContext'

interface Props {
  value: string
  onChange: (value: string) => void
  mode: 'read' | 'edit'
  onRequestEdit: () => void
}

// 纯文本 → HTML（将分割线标记转回 <hr>）
function textToHtml(text: string) {
  // 先用分割线标记分割，再处理段落
  const parts = text.split('---hr---')
  
  return parts
    .map((part, index) => {
      const trimmed = part.trim()
      if (!trimmed && index > 0 && index < parts.length - 1) {
        // 空段落但前后有内容，可能是分割线相邻
        return ''
      }
      // 将段落按 \n\n 分割
      return trimmed
        .split('\n\n')
        .map(p => {
          const para = p.trim()
          if (!para) return ''
          return `<p>${para.replace(/\n/g, '<br>')}</p>`
        })
        .join('')
    })
    .join('<hr>')
}

// HTML → 纯文本（将 <hr> 转为分割线标记）
function htmlToText(html: string): string {
  if (!html) return ''
  
  // 创建临时 DOM 解析 HTML
  const div = document.createElement('div')
  div.innerHTML = html
  
  // 收集文本片段
  const parts: string[] = []
  
  div.childNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.tagName === 'HR') {
        parts.push('---hr---')
      } else {
        const text = el.textContent || ''
        if (text.trim()) {
          parts.push(text)
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text.trim()) {
        parts.push(text)
      }
    }
  })
  
  // 合并：用 \n\n 连接段落，分割线用 ---hr--- 标记
  return parts.join('\n\n')
}

export function Editor({ value, onChange, mode, onRequestEdit }: Props) {
  const [findOpen, setFindOpen] = useState(false)
  const [replaceMode, setReplaceMode] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const { editorFontSize, indentParagraph } = useTheme()
  const lastExternalValue = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      HorizontalRule,
      Placeholder.configure({
        placeholder: '开始写作……',
      }),
      Underline,
      Strike,
    ],
    content: textToHtml(value),
    editable: mode === 'edit',
    editorProps: {
      attributes: {
        class:
          'max-w-4xl mx-auto min-h-[120vh] px-8 py-10 leading-[2] focus:outline-none prose prose-zinc dark:prose-invert',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = htmlToText(html)
      onChange(text)
    },
    immediatelyRender: false,
  })

  // 同步外部 value 变化
  useEffect(() => {
    if (!editor) return
    if (value === lastExternalValue.current) return

    const currentText = htmlToText(editor.getHTML())
    if (currentText !== value) {
      editor.commands.setContent(textToHtml(value), { emitUpdate: false })
      lastExternalValue.current = value
    }
  }, [value, editor])

  // 当 mode 变化时更新编辑器的可编辑状态
  useEffect(() => {
    if (!editor) return
    editor.setEditable(mode === 'edit')
  }, [mode, editor])

  const matchCount = useMemo(() => {
    if (!findText || !value) return 0
    const escaped = findText.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')
    const matches = value.match(new RegExp(escaped, 'gi'))
    return matches?.length ?? 0
  }, [findText, value])

  function triggerBrowserFind() {
    document.execCommand('find')
  }

  function replaceAll() {
    if (!findText) return
    const replaced = value.split(findText).join(replaceText)
    onChange(replaced)

    if (editor) {
      editor.commands.setContent(textToHtml(replaced), { emitUpdate: false })
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setFindOpen(true)
        setReplaceMode(false)
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setFindOpen(true)
        setReplaceMode(true)
      }

      if (e.key === 'Escape') {
        setFindOpen(false)
      }

      if (findOpen && e.key === 'Enter') {
        e.preventDefault()
        triggerBrowserFind()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [findOpen])

  return (
    <div className="relative h-full">
      {findOpen && (
        <div className="absolute top-4 right-4 z-50 w-96 rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur shadow-2xl">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-200">
                {replaceMode ? '查找与替换' : '查找'}
              </div>

              <button
                onClick={() => setFindOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <input
              autoFocus
              value={findText}
              onChange={e => setFindText(e.target.value)}
              placeholder="查找内容"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            />

            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{matchCount} 个匹配</span>

              <button
                onClick={triggerBrowserFind}
                className="rounded-lg border border-zinc-700 px-3 py-1 hover:bg-zinc-800"
              >
                查找
              </button>
            </div>

            {replaceMode && (
              <div className="space-y-2">
                <input
                  value={replaceText}
                  onChange={e => setReplaceText(e.target.value)}
                  placeholder="替换为"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                />

                <button
                  onClick={replaceAll}
                  disabled={!findText}
                  className="w-full rounded-xl bg-zinc-100 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  全部替换
                </button>
              </div>
            )}

            <div className="text-[11px] text-zinc-500">
              Enter：查找　Esc：关闭　Ctrl+H：切换替换模式
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col">
        {mode === 'edit' && (
          <EditorToolbar editor={editor} />
        )}

        <div className="flex-1 overflow-y-auto relative">
          <div
            className="h-full"
            onClick={() => {
              if (mode === 'read') {
                onRequestEdit()

                requestAnimationFrame(() => {
                  editor?.commands.focus('end')
                })
              }
            }}
          >
            <EditorContent
              editor={editor}
              className="h-full fable-editor-content"
              style={{
                fontSize: `${editorFontSize}px`,
                cursor: mode === 'read' ? 'default' : 'text',
              }}
            />
          </div>

          {mode === 'read' && (
            <div
              className="absolute inset-0 z-10"
              aria-hidden="true"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}