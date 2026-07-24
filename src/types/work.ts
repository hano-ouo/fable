export interface WorkMeta {
  id: string
  title: string
  summary: string
  tags: string[]
  // 新增：真正的关系字段
  folderId: string | null
  createdAt: string
  updatedAt: string
  order: number
}

export interface Work {
  meta: WorkMeta
  inspiration: string
  content: string
}