import { useMemo, useState } from 'react'
import type { Folder } from '@/types/folder'
import type { WorkMeta } from '@/types/work'

interface Props {
  folders: Folder[]
  works: WorkMeta[]
  currentId?: string
  onOpenWork: (id: string) => void
  onCreateFolder: (parentId?: string) => void
  onDeleteFolder: (id: string) => void
  onDeleteWork: (id: string) => void
}

export function FolderSidebar({
  folders,
  works,
  currentId,
  onOpenWork,
  onCreateFolder,
  onDeleteFolder,
  onDeleteWork,
}: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null)
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 构建文件夹树
  const folderTree = useMemo(() => {
    const map: Record<string, Folder[]> = {}
    const rootFolders: Folder[] = []

    folders.forEach(f => {
      if (f.parentId) {
        if (!map[f.parentId]) {
          map[f.parentId] = []
        }
        map[f.parentId].push(f)
      } else {
        rootFolders.push(f)
      }
    })

    const sortByOrder = (list: Folder[]) => {
      list.sort((a, b) => a.order - b.order)
      list.forEach(f => {
        if (map[f.id]) {
          sortByOrder(map[f.id])
        }
      })
    }
    sortByOrder(rootFolders)

    return { root: rootFolders, children: map }
  }, [folders])

  // 获取文件夹下的作品（包括子文件夹的作品）
  const getWorksByFolder = useMemo(() => {
    const map: Record<string, WorkMeta[]> = {
      uncategorized: [],
    }

    folders.forEach(f => {
      map[f.id] = []
    })

    works.forEach(work => {
      const key = work.folderId ?? 'uncategorized'
      if (map[key]) {
        map[key].push(work)
      } else {
        map.uncategorized.push(work)
      }
    })

    return map
  }, [folders, works])

  // 搜索过滤
  const filteredWorks = useMemo(() => {
    if (!searchQuery.trim()) return null

    const query = searchQuery.trim().toLowerCase()
    return works.filter(work =>
      work.title.toLowerCase().includes(query)
    )
  }, [works, searchQuery])

  function toggle(id: string) {
    setCollapsed(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  function handleDeleteWork(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (confirm('确定要删除这篇作品吗？此操作不可恢复！')) {
      onDeleteWork(id)
    }
  }

  function handleDeleteFolder(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const folder = folders.find(f => f.id === id)
    if (!folder) return
    if (confirm(`确定要删除文件夹"${folder.name}"及其所有子文件夹吗？此操作不可恢复！`)) {
      onDeleteFolder(id)
    }
  }

  function renderFolder(folder: Folder, depth: number = 0) {
    const items = getWorksByFolder[folder.id] ?? []
    const children = folderTree.children[folder.id] ?? []
    const isCollapsed = collapsed[folder.id]
    const isHovered = hoveredFolderId === folder.id
    const paddingLeft = depth * 12 + 16

    return (
      <div key={folder.id}>
        <div
          className="relative flex items-center justify-between group"
          onMouseEnter={() => setHoveredFolderId(folder.id)}
          onMouseLeave={() => setHoveredFolderId(null)}
        >
          <button
            onClick={() => toggle(folder.id)}
            className="flex-1 flex items-center gap-1 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <span className="text-xs">
              {isCollapsed ? '▶' : '▼'}
            </span>
            <span>{folder.name}</span>
            <span className="text-xs text-zinc-400">({items.length + children.reduce((acc, c) => acc + (getWorksByFolder[c.id]?.length ?? 0), 0)})</span>
          </button>

          {isHovered && (
            <div className="absolute right-2 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateFolder(folder.id)
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="在此文件夹下创建子文件夹"
              >
                ＋
              </button>
              <button
                onClick={(e) => handleDeleteFolder(e, folder.id)}
                className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="删除文件夹"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div>
            {children.map(child => renderFolder(child, depth + 1))}
            <div>
              {items.map(work => renderWorkItem(work, depth + 1))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderWorkItem(work: WorkMeta, depth: number = 1) {
    const isActive = currentId === work.id
    const paddingLeft = depth * 12 + 24

    return (
      <div
        key={work.id}
        className="relative group"
        onMouseEnter={() => setHoveredWorkId(work.id)}
        onMouseLeave={() => setHoveredWorkId(null)}
      >
        <button
          onClick={() => onOpenWork(work.id)}
          className={`
            w-full text-left pr-4 py-2 text-sm transition-colors
            ${isActive
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }
          `}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div className="truncate">{work.title || '未命名作品'}</div>
        </button>

        {hoveredWorkId === work.id && (
          <button
            onClick={(e) => handleDeleteWork(e, work.id)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            title="删除作品"
          >
            ✕
          </button>
        )}
      </div>
    )
  }

  function renderSearchResults() {
    if (!filteredWorks) return null

    if (filteredWorks.length === 0) {
      return (
        <div className="px-4 py-4 text-center text-sm text-zinc-500">
          没有找到匹配的作品
        </div>
      )
    }

    return (
      <div className="py-2">
        <div className="px-4 py-1 text-xs text-zinc-400">
          搜索结果 ({filteredWorks.length})
        </div>
        {filteredWorks.map(work => {
          const isActive = currentId === work.id
          return (
            <div
              key={work.id}
              className="relative group"
              onMouseEnter={() => setHoveredWorkId(work.id)}
              onMouseLeave={() => setHoveredWorkId(null)}
            >
              <button
                onClick={() => {
                  onOpenWork(work.id)
                  setSearchQuery('')
                }}
                className={`
                  w-full text-left pl-8 pr-4 py-2 text-sm transition-colors
                  ${isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }
                `}
              >
                <div className="truncate">{work.title || '未命名作品'}</div>
                <div className="mt-0.5 text-xs text-zinc-400">
                  {work.folderId ? folders.find(f => f.id === work.folderId)?.name || '未分类' : '未分类'}
                </div>
              </button>

              {hoveredWorkId === work.id && (
                <button
                  onClick={(e) => handleDeleteWork(e, work.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  title="删除作品"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 搜索框 */}
      <div className="px-3 py-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索作品..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 搜索结果或文件夹树 */}
      {searchQuery.trim() ? (
        renderSearchResults()
      ) : (
        <>
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="text-xs font-semibold tracking-wide text-zinc-500">
              文件夹
            </div>
            <button
              onClick={() => onCreateFolder()}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              +
            </button>
          </div>

          {/* 根文件夹 */}
          {folderTree.root.map(folder => renderFolder(folder, 0))}

          {/* 未分类 */}
          <div className="mt-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <button
              onClick={() => toggle('uncategorized')}
              className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <span>未分类</span>
              <span className="text-xs text-zinc-400">
                {getWorksByFolder.uncategorized.length}
              </span>
            </button>

            {!collapsed.uncategorized && (
              <div>
                {getWorksByFolder.uncategorized.map(work => renderWorkItem(work, 1))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}