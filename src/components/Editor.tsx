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

function textToHtml(text: string) {
  return text
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function Editor({ value, onChange, mode, onRequestEdit }: Props) {
  const [findOpen, setFindOpen] = useState(false)
  const [replaceMode, setReplaceMode] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const { editorFontSize, indentParagraph } = useTheme()

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
      const text = editor.getText({
        blockSeparator: '\n\n',
      })
      onChange(text)
    },
    immediatelyRender: false,
  })

  // 只在外部真正切换文档时同步，避免输入时覆盖内容
  const lastExternalValue = useRef(value)

  useEffect(() => {
    if (!editor) return
    if (value === lastExternalValue.current) return

    const currentText = editor.getText({
      blockSeparator: '\n\n',
    })

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

  // 使用浏览器原生查找作为 MVP（最稳定）
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

          {/* 阅读模式点击层 - 只阻挡点击，不处理逻辑 */}
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