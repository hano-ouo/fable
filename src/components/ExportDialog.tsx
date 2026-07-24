import { useState } from 'react'
import { save } from '@tauri-apps/plugin-dialog'
import type { Work } from '@/types/work'
import type { ExportSettings } from '@/types/export'
import { DEFAULT_EXPORT_SETTINGS } from '@/types/export'
import {
  exportToDocx,
  exportToTxt,
  exportToPdf,
  exportLongImage,
  exportPagedImages,
} from '@/lib/export'

interface Props {
  open: boolean
  work: Work
  onClose: () => void
}

export function ExportDialog({
  open,
  work,
  onClose,
}: Props) {
  const [tab, setTab] = useState<'file' | 'image'>('file')
  const [settings, setSettings] = useState<ExportSettings>({
    ...DEFAULT_EXPORT_SETTINGS,
    header: {
      ...DEFAULT_EXPORT_SETTINGS.header,
      text: work.meta.title,
    },
  })
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleExport() {
    setLoading(true)

    try {
      // ===== 文件导出 =====
      if (tab === 'file') {
        const ext =
          settings.fileType === 'docx'
            ? 'docx'
            : settings.fileType === 'txt'
            ? 'txt'
            : 'pdf'

        const path = await save({
          title: '导出文件',
          defaultPath: `${work.meta.title}.${ext}`,
          filters: [
            {
              name:
                settings.fileType === 'docx'
                  ? 'Word'
                  : settings.fileType === 'txt'
                  ? 'Text'
                  : 'PDF',
              extensions: [ext],
            },
          ],
        })

        if (!path) {
          setLoading(false)
          return
        }

        if (settings.fileType === 'docx') {
          await exportToDocx(work, path)
        } else if (settings.fileType === 'txt') {
          await exportToTxt(work, path)
        } else {
          await exportToPdf(work, path)
        }
      }

      // ===== 图片导出 =====
      else {
        const suffix =
          settings.imageMode === 'long'
            ? `${settings.imageSize}-long.png`
            : `${settings.imageSize}-p01.png`

        const path = await save({
          title: '导出图片',
          defaultPath: `${work.meta.title}-${suffix}`,
          filters: [
            {
              name: 'PNG',
              extensions: ['png'],
            },
          ],
        })

        if (!path) {
          setLoading(false)
          return
        }

        if (settings.imageMode === 'long') {
          await exportLongImage(work, settings, path)
        } else {
          await exportPagedImages(work, settings, path)
        }
      }

      onClose()
    } catch (err) {
      console.error(err)
      alert(`导出失败：${String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
          {/* 顶部 */}
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              导出
            </div>

            <div className="mt-3 inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
              <button
                onClick={() => setTab('file')}
                className={`
                  px-4 py-2 rounded-lg text-sm transition-colors
                  ${
                    tab === 'file'
                      ? 'bg-white dark:bg-zinc-700 shadow'
                      : ''
                  }
                `}
              >
                文件导出
              </button>

              <button
                onClick={() => setTab('image')}
                className={`
                  px-4 py-2 rounded-lg text-sm transition-colors
                  ${
                    tab === 'image'
                      ? 'bg-white dark:bg-zinc-700 shadow'
                      : ''
                  }
                `}
              >
                图片导出
              </button>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {tab === 'file' ? (
              <>
                <Section title="文件类型">
                  <RadioRow
                    value={settings.fileType}
                    options={[
                      { value: 'docx', label: 'Word (.docx)' },
                      { value: 'txt', label: 'TXT (.txt)' },
                      { value: 'pdf', label: 'PDF (.pdf)' },
                    ]}
                    onChange={value =>
                      setSettings({
                        ...settings,
                        fileType: value as any,
                      })
                    }
                  />
                </Section>
              </>
            ) : (
              <>
                <Section title="导出形式">
                  <RadioRow
                    value={settings.imageMode}
                    options={[
                      { value: 'long', label: '长图' },
                      { value: 'paged', label: '分页' },
                    ]}
                    onChange={value =>
                      setSettings({
                        ...settings,
                        imageMode: value as any,
                      })
                    }
                  />
                </Section>

                <Section title="适应尺寸">
                  <RadioRow
                    value={settings.imageSize}
                    options={[
                      { value: 'mobile', label: '手机（720px）' },
                      { value: 'pc', label: 'PC（1280px）' },
                    ]}
                    onChange={value =>
                      setSettings({
                        ...settings,
                        imageSize: value as any,
                      })
                    }
                  />
                </Section>

                <PositionedTextEditor
                  label="顶部文字"
                  value={settings.header}
                  onChange={header =>
                    setSettings({
                      ...settings,
                      header,
                    })
                  }
                />

                <PositionedTextEditor
                  label="底部文字"
                  value={settings.footer}
                  onChange={footer =>
                    setSettings({
                      ...settings,
                      footer,
                    })
                  }
                />

                <Section title="日期显示">
                  <RadioRow
                    value={settings.dateDisplay}
                    options={[
                      { value: 'none', label: '不显示' },
                      { value: 'created', label: '创建日期' },
                      { value: 'updated', label: '最近编辑日期' },
                    ]}
                    onChange={value =>
                      setSettings({
                        ...settings,
                        dateDisplay: value as any,
                      })
                    }
                  />
                </Section>

                {settings.imageMode === 'paged' && (
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.showPageNumber}
                      onChange={e =>
                        setSettings({
                          ...settings,
                          showPageNumber: e.target.checked,
                        })
                      }
                    />
                    显示页码
                  </label>
                )}
              </>
            )}
          </div>

          {/* 底部 */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              取消
            </button>

            <button
              onClick={handleExport}
              disabled={loading}
              className="h-10 px-5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium disabled:opacity-50"
            >
              {loading ? '导出中…' : '确认导出'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </div>
      {children}
    </div>
  )
}

function RadioRow({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-4 py-2 rounded-xl border text-sm transition-colors
            ${
              value === option.value
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
    />
  )
}

function PositionedTextEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: { text: string; position: 'left' | 'center' | 'right' }
  onChange: (v: typeof value) => void
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">{label}</div>

      <Input
        placeholder="输入要显示的文字"
        value={value.text}
        onChange={text => onChange({ ...value, text })}
      />

      <div className="flex gap-2">
        {[
          ['left', '左'],
          ['center', '中'],
          ['right', '右'],
        ].map(([pos, label]) => (
          <button
            key={pos}
            onClick={() =>
              onChange({
                ...value,
                position: pos as any,
              })
            }
            className={`
              flex-1 h-10 rounded-xl border text-sm transition-colors
              ${
                value.position === pos
                  ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}